const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendPasswordResetEmail } = require('../services/emailService');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // generous limit for development/demo testing
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// ─── Helper: generate JWT ─────────────────────────────────────
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user (explicitly select passwordHash since it is excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Generate token
    const token = generateToken(user._id);

    // Set HttpOnly cookie
    res.cookie('kg_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      token,
      user: user.toPublicJSON(),
      requiresConsent: !user.consentGiven, // frontend shows consent banner if true
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('kg_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── POST /api/auth/consent ───────────────────────────────────
// Called when user accepts research consent on first login
router.post('/consent', protect, async (req, res) => {
  try {
    const { accepted } = req.body;

    if (accepted === false) {
      // User declined — deactivate their account
      await User.findByIdAndUpdate(req.user._id, { isActive: false });
      return res.json({ success: true, message: 'Consent declined. Account deactivated.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      consentGiven: true,
      consentDate: new Date(),
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'consent_given',
      details: { acceptedAt: new Date() },
    });

    res.json({ success: true, message: 'Consent recorded. Thank you.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not save consent' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always return success (do not reveal if email exists)
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Could not send reset email' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Token and password (min 6 chars) required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
    }

    user.passwordHash        = newPassword; // will be hashed by pre-save hook
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
// Get current logged-in user profile
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Current password and new password (min 6 chars) are required' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'password_changed',
      details: { changedAt: new Date() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password update failed' });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
});

// ─── DELETE /api/auth/me ──────────────────────────────────────
// Right to withdraw — employee deletes all their data
router.delete('/me', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Import models here to avoid circular deps
    const Assessment = require('../models/Assessment');
    const RiskScore  = require('../models/RiskScore');

    // Delete personal data
    await Assessment.deleteMany({ userId });
    await RiskScore.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    await ActivityLog.create({
      userId,
      action: 'consent_withdrawn',
      details: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Your data has been deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete account' });
  }
});

module.exports = router;
