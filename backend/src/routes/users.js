const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function canManageProfile(req, targetUserId) {
  return req.user.role === 'admin' || req.user._id.toString() === targetUserId;
}

function avatarBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'avatars' });
}

async function deleteAvatarFile(fileId) {
  if (!fileId) return;
  try {
    await avatarBucket().delete(new mongoose.Types.ObjectId(fileId));
  } catch {
    // Missing old files should not block profile updates.
  }
}

// ─── GET /api/users ───────────────────────────────────────────
// Admin: all users. Manager: own team only.
router.get('/', protect, requireRole('admin', 'manager', 'hr_analyst'), async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'manager') {
      filter.managerId = req.user._id;
    }

    // Optional query filters (admin only)
    if (req.user.role === 'admin') {
      if (req.query.role)       filter.role = req.query.role;
      if (req.query.department) filter.department = req.query.department;
      if (req.query.active)     filter.isActive = req.query.active === 'true';
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments(filter);
    
    const users = await User.find(filter)
      .select('-passwordHash -resetPasswordToken -resetPasswordExpiry')
      .populate('managerId', 'name email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    res.json({ 
      success: true, 
      count: users.length, 
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users: users.map(u => u.toPublicJSON()) 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/users/team ──────────────────────────────────────
// Manager: get their team with latest risk scores. HR/Admin: get all employees.
router.get('/team', protect, requireRole('manager', 'hr_analyst', 'admin'), async (req, res) => {
  try {
    const RiskScore = require('../models/RiskScore');

    let query = { isActive: true, role: 'employee' };
    if (req.user.role === 'manager') {
      query.managerId = req.user._id;
    }

    const team = await User.find(query).select('-passwordHash');

    // Attach latest risk score to each team member
    const teamWithScores = await Promise.all(
      team.map(async (member) => {
        const latestScore = await RiskScore.findOne({ userId: member._id })
          .sort({ period: -1, calculatedAt: -1 });
        return {
          ...member.toPublicJSON(),
          riskScore: latestScore || null,
        };
      })
    );

    res.json({ success: true, team: teamWithScores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Employees can only see their own profile
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/users ──────────────────────────────────────────
// Admin creates a single user
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, startDate, managerId } = req.body;

    if (!name || !email || !password || !role || !department || !startDate) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    let assignedManagerId = null;
    if (role === 'employee') {
      if (!managerId) {
        return res.status(400).json({
          success: false,
          message: 'Employees must be assigned to a manager so they appear in the manager KT workflow',
        });
      }

      const manager = await User.findOne({ _id: managerId, role: 'manager', isActive: true });
      if (!manager) {
        return res.status(400).json({ success: false, message: 'Selected manager was not found or is inactive' });
      }
      assignedManagerId = manager._id;
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
      department,
      startDate: new Date(startDate),
      managerId: assignedManagerId,
    });

    // await sendWelcomeEmail(email, name, role, password); // Disabled for demo to prevent email flooding

    await ActivityLog.create({
      userId: req.user._id,
      action: 'user_created',
      details: { createdUserId: user._id, email, role },
    });

    res.status(201).json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/users/bulk ─────────────────────────────────────
// Admin bulk imports users from CSV
router.post('/bulk', protect, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });

    const parser = Readable.from(req.file.buffer).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));
    let imported = 0;
    const errors = [];

    for await (const row of parser) {
      try {
        const email = row.email?.toLowerCase();
        if (!email) { errors.push('Row missing email'); continue; }

        const exists = await User.findOne({ email });
        if (exists) { errors.push(`${email} already exists`); continue; }

        let managerId = null;
        if (row.manager_email) {
          const manager = await User.findOne({ email: row.manager_email.toLowerCase() });
          if (manager) managerId = manager._id;
        }

        const tempPassword = 'Demo1234';

        await User.create({
          name: row.name || row.Name,
          email,
          passwordHash: tempPassword,
          role: row.role || row.Role || 'employee',
          department: row.department || row.Department || 'General',
          startDate: row.start_date ? new Date(row.start_date) : new Date(),
          managerId,
          skills: row.skills ? row.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          knowledgeTags: row.knowledgeTags || row.knowledge_tags ? (row.knowledgeTags || row.knowledge_tags).split(',').map(s => s.trim()).filter(Boolean) : [],
        });

        imported++;
      } catch (rowErr) {
        errors.push(`${row.email}: ${rowErr.message}`);
      }
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'bulk_import',
      details: { imported, errors: errors.length },
    });

    res.json({ success: true, imported, skipped: errors.length, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/users/:id ───────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    // Employees can only update their own profile
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowedFields = ['name', 'avatarUrl', 'skills', 'knowledgeTags', 'projects', 'documentationLog'];

    // Admins can also update role, department, managerId, isActive
    if (req.user.role === 'admin') {
      allowedFields.push('role', 'department', 'managerId', 'isActive', 'startDate');
    }

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // BUGFIX: If an admin assigns a manager to a webhook-created user, we must cascade that managerId to any pending assessments
    if (updates.managerId !== undefined) {
      const Assessment = require('../models/Assessment');
      await Assessment.updateMany(
        { userId: user._id, managerValidated: false },
        { $set: { managerId: user.managerId } }
      );
    }

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/users/:id/reset-password ───────────────────────
// Admin sends password reset to a user
router.post('/:id/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!canManageProfile(req, req.params.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file required' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed' });
    }

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

    await deleteAvatarFile(existingUser.avatarFileId);

    const fileId = new mongoose.Types.ObjectId();
    await new Promise((resolve, reject) => {
      const stream = avatarBucket().openUploadStreamWithId(fileId, `${req.params.id}-avatar`, {
        contentType: req.file.mimetype,
        metadata: {
          userId: req.params.id,
          originalName: req.file.originalname,
          uploadedBy: req.user._id.toString(),
        },
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatarFileId: fileId, avatarUrl: null },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      userId: req.user._id,
      action: 'profile_photo_updated',
      details: { targetUserId: user._id },
    });

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id/avatar', protect, async (req, res) => {
  try {
    if (!canManageProfile(req, req.params.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

    await deleteAvatarFile(existingUser.avatarFileId);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatarUrl: null, avatarFileId: null },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      userId: req.user._id,
      action: 'profile_photo_removed',
      details: { targetUserId: user._id },
    });

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/avatar/file', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('avatarFileId');
    if (!user?.avatarFileId) return res.status(404).json({ success: false, message: 'Avatar not found' });

    const files = await avatarBucket().find({ _id: new mongoose.Types.ObjectId(user.avatarFileId) }).toArray();
    if (!files.length) return res.status(404).json({ success: false, message: 'Avatar not found' });

    res.set('Content-Type', files[0].contentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=86400');
    avatarBucket()
      .openDownloadStream(new mongoose.Types.ObjectId(user.avatarFileId))
      .on('error', () => res.status(404).end())
      .pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/reset-password', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { sendPasswordResetEmail } = require('../services/emailService');
    const crypto = require('crypto');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({ success: true, message: `Password reset email sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent deleting oneself
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    // Cascade delete related records
    const Assessment = require('../models/Assessment');
    const RiskScore = require('../models/RiskScore');
    const Alert = require('../models/Alert');
    const KTPlan = require('../models/KTPlan');
    const KTTask = require('../models/KTTask');

    await Assessment.deleteMany({ userId: user._id });
    await RiskScore.deleteMany({ userId: user._id });
    await Alert.deleteMany({ userId: user._id });
    await KTPlan.deleteMany({ employeeId: user._id });
    await KTTask.deleteMany({ employeeId: user._id });
    
    await deleteAvatarFile(user.avatarFileId);
    await user.deleteOne();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'user_deleted',
      details: { deletedUserId: user._id, email: user.email, role: user.role },
    });

    res.json({ success: true, message: 'User and associated records deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
