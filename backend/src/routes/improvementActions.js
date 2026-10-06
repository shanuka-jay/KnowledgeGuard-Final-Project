const express = require('express');
const router = express.Router();
const ImprovementAction = require('../models/ImprovementAction');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');
const { createAlert } = require('../services/alertService');

function canManage(reqUser, action) {
  return reqUser.role === 'admin'
    || (action.managerId && action.managerId.toString() === reqUser._id.toString());
}

router.get('/mine', protect, async (req, res) => {
  try {
    const actions = await ImprovementAction.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, actions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/manager', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'manager') query.managerId = req.user._id;
    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.status) query.status = req.query.status;

    const actions = await ImprovementAction.find(query)
      .populate('employeeId', 'name email department')
      .sort({ updatedAt: -1 });

    res.json({ success: true, actions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, requireRole('employee', 'admin'), async (req, res) => {
  try {
    const { indicator, tip, action, estimatedReduction, employeeNote } = req.body;
    if (!indicator || !tip || !action) {
      return res.status(400).json({ success: false, message: 'indicator, tip, and action are required' });
    }

    const employee = await User.findById(req.user._id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const item = await ImprovementAction.create({
      employeeId: req.user._id,
      managerId: employee.managerId || null,
      indicator,
      tip,
      action,
      estimatedReduction: Number(estimatedReduction || 0),
      employeeNote: employeeNote || '',
      status: 'in_progress',
      startedAt: new Date(),
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'improvement_action_started',
      details: { actionId: item._id, indicator },
    });

    res.status(201).json({ success: true, action: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/evidence', protect, async (req, res) => {
  try {
    const { evidenceUrl, evidenceNotes } = req.body;
    if (!evidenceUrl && !evidenceNotes) {
      return res.status(400).json({ success: false, message: 'Evidence link or notes are required' });
    }

    const action = await ImprovementAction.findById(req.params.id);
    if (!action) return res.status(404).json({ success: false, message: 'Improvement action not found' });
    if (action.employeeId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned employee can submit evidence' });
    }
    if (action.status === 'approved') {
      return res.status(400).json({ success: false, message: 'This action is already approved' });
    }

    action.evidenceUrl = evidenceUrl || '';
    action.evidenceNotes = evidenceNotes || '';
    action.status = 'submitted';
    action.submittedAt = new Date();
    await action.save();

    const io = req.app.get('io');
    if (action.managerId) {
      await createAlert(io, {
        userId: action.managerId,
        targetUserId: action.employeeId,
        type: 'general',
        message: `${req.user.name} submitted evidence for an AI improvement action. Review before any score interpretation.`,
        actionUrl: `/manager/employees/${action.employeeId}`,
        actionLabel: 'Review Evidence',
        priority: 'medium',
      });
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'improvement_evidence_submitted',
      details: { actionId: action._id, indicator: action.indicator },
    });

    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/review', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { approved, managerNote } = req.body;
    if (approved === undefined) {
      return res.status(400).json({ success: false, message: 'approved true/false is required' });
    }

    const action = await ImprovementAction.findById(req.params.id);
    if (!action) return res.status(404).json({ success: false, message: 'Improvement action not found' });
    if (!canManage(req.user, action)) {
      return res.status(403).json({ success: false, message: 'Only the assigned manager can review this action' });
    }
    if (action.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted evidence can be reviewed' });
    }

    action.status = approved ? 'approved' : 'rejected';
    action.managerNote = managerNote || '';
    action.reviewedAt = new Date();
    await action.save();

    const io = req.app.get('io');
    await createAlert(io, {
      userId: action.employeeId,
      type: 'general',
      message: approved
        ? 'Your AI improvement evidence was approved. Official risk score changes still require the configured scoring workflow.'
        : `Your AI improvement evidence was rejected. ${managerNote || 'Please revise and resubmit.'}`,
      actionUrl: '/employee/tips',
      actionLabel: 'View Tips',
      priority: approved ? 'low' : 'medium',
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: approved ? 'improvement_action_approved' : 'improvement_action_rejected',
      details: { actionId: action._id, indicator: action.indicator, managerNote },
    });

    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
