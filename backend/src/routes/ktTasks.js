const express = require('express');
const router  = express.Router();
const KTTask  = require('../models/KTTask');
const KTPlan  = require('../models/KTPlan');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');
const {
  createAlert,
  alertKTTaskSubmitted,
  alertSessionUnconfirmed,
} = require('../services/alertService');

// ─── Helper: recalculate plan progress % ─────────────────────
async function recalcProgress(planId) {
  const tasks = await KTTask.find({ planId });
  if (!tasks.length) return 0;
  const done = tasks.filter(t => t.isDone).length;
  const pct  = Math.round((done / tasks.length) * 100);
  await KTPlan.findByIdAndUpdate(planId, { completionPercentage: pct });
  return pct;
}

// ─── POST /api/kt-tasks/:id/submit ───────────────────────────
// Employee submits a documentation task with evidence
// Evidence URL or description is REQUIRED — cannot submit empty
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { evidenceUrl, evidenceDescription } = req.body;

    // Must provide at least one form of evidence
    if (!evidenceUrl && !evidenceDescription) {
      return res.status(400).json({
        success: false,
        message: 'Evidence is required. Please provide a document link or written description.',
      });
    }

    const task = await KTTask.findById(req.params.id).populate({
      path: 'planId',
      populate: { path: 'managerId', select: 'name email' },
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.type !== 'documentation') {
      return res.status(400).json({
        success: false,
        message: 'Only documentation tasks can be submitted with evidence. Use /confirm for sessions.',
      });
    }
    if (task.employeeId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned knowledge holder can submit documentation evidence',
      });
    }

    if (task.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Task is already approved' });
    }

    // Update task
    task.evidenceUrl         = evidenceUrl || null;
    task.evidenceDescription = evidenceDescription || null;
    task.status              = 'submitted';
    task.submittedAt         = new Date();
    await task.save();

    // Notify manager to review
    const io = req.app.get('io');
    if (task.planId?.managerId) {
      const plan    = await KTPlan.findById(task.planId._id).populate('employeeId', 'name');
      const empName = plan?.employeeId?.name || 'Employee';
      await alertKTTaskSubmitted(io, task.planId.managerId._id, task.employeeId, empName, task.title);
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_task_submitted',
      details: { taskId: task._id, type: task.type, hasUrl: !!evidenceUrl },
    });

    await recalcProgress(task.planId._id || task.planId);

    res.json({ success: true, message: 'Task submitted. Waiting for manager approval.', task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/kt-tasks/:id/confirm ──────────────────────────
// Employee OR backup person confirms they attended a session.
// Both confirmations allow evidence submission; manager approval completes it.
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const task = await KTTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (!['shadowing', 'interview'].includes(task.type)) {
      return res.status(400).json({
        success: false,
        message: 'Confirm endpoint is only for shadowing and interview session tasks',
      });
    }

    if (task.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Session already confirmed by both parties' });
    }

    const userId = req.user._id.toString();
    const isEmployee = task.employeeId && task.employeeId.toString() === userId;
    const isBackup   = task.backupPersonId && task.backupPersonId.toString() === userId;

    if (!isEmployee && !isBackup) {
      return res.status(403).json({
        success: false,
        message: 'Only the employee or backup person assigned to this task can confirm',
      });
    }

    if (isEmployee) {
      task.employeeConfirmed   = true;
      task.employeeConfirmedAt = new Date();
    }
    if (isBackup) {
      task.backupConfirmed   = true;
      task.backupConfirmedAt = new Date();
    }

    // Both confirmations submit the session for evidence/manager review.
    if (task.employeeConfirmed && task.backupConfirmed) {
      task.status = (task.sessionNotes || task.sessionEvidenceUrl) ? 'submitted' : 'pending';
    } else {
      task.status = 'pending';
    }

    await task.save();
    await recalcProgress(task.planId);

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_session_confirmed',
      details: {
        taskId: task._id,
        confirmedBy: isEmployee ? 'employee' : 'backup',
        bothConfirmed: task.employeeConfirmed && task.backupConfirmed,
      },
    });

    const msg = task.employeeConfirmed && task.backupConfirmed
        ? 'Attendance confirmed by both parties. Add session notes/evidence for manager approval.'
        : `Attendance confirmed. Waiting for ${isEmployee ? 'backup person' : 'employee'} to also confirm.`;

    res.json({ success: true, message: msg, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/session-evidence', protect, async (req, res) => {
  try {
    const { sessionEvidenceUrl, sessionNotes } = req.body;
    if (!sessionEvidenceUrl && !sessionNotes) {
      return res.status(400).json({
        success: false,
        message: 'Session notes or an evidence link is required for manager review',
      });
    }

    const task = await KTTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!['shadowing', 'interview'].includes(task.type)) {
      return res.status(400).json({ success: false, message: 'Session evidence is only for shadowing and interview tasks' });
    }

    const userId = req.user._id.toString();
    const isEmployee = task.employeeId && task.employeeId.toString() === userId;
    const isBackup = task.backupPersonId && task.backupPersonId.toString() === userId;
    if (!isEmployee && !isBackup) {
      return res.status(403).json({ success: false, message: 'Only assigned session participants can submit session evidence' });
    }
    if (!task.employeeConfirmed || !task.backupConfirmed) {
      return res.status(400).json({ success: false, message: 'Both participants must confirm attendance before submitting session evidence' });
    }
    if (task.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Session is already approved' });
    }

    task.sessionEvidenceUrl = sessionEvidenceUrl || null;
    task.sessionNotes = sessionNotes || null;
    task.sessionEvidenceSubmittedBy = req.user._id;
    task.status = 'submitted';
    task.submittedAt = new Date();
    await task.save();

    const io = req.app.get('io');
    await createAlert(io, {
      userId: task.managerId,
      targetUserId: task.employeeId,
      type: 'kt_task_submitted',
      message: `Session evidence submitted for KT task: "${task.title}". Please review and approve.`,
      actionUrl: '/manager/kt-plans',
      actionLabel: 'Review Session',
      priority: 'medium',
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_task_submitted',
      details: { taskId: task._id, type: task.type, hasSessionEvidence: true },
    });

    await recalcProgress(task.planId);
    res.json({ success: true, message: 'Session evidence submitted. Waiting for manager approval.', task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/kt-tasks/:id/approve ──────────────────────────
// Manager approves or rejects a documentation/session evidence task
router.post('/:id/approve', protect, requireRole('manager', 'admin', 'hr_analyst'), async (req, res) => {
  try {
    const { approved, note } = req.body;

    if (approved === undefined) {
      return res.status(400).json({ success: false, message: 'approved (true/false) is required' });
    }

    const task = await KTTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (!['documentation', 'shadowing', 'interview'].includes(task.type)) {
      return res.status(400).json({
        success: false,
        message: 'Only documentation, shadowing, and interview tasks can be approved here.',
      });
    }
    if (req.user.role === 'manager' && task.managerId?.toString() !== req.user._id.toString() && req.user.role !== 'hr_analyst') {
      return res.status(403).json({ success: false, message: 'Only the assigned manager can approve this KT task' });
    }

    if (task.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Task must be in submitted status to approve/reject' });
    }

    task.managerApproved  = approved;
    task.managerNote      = note || '';
    task.managerActedAt   = new Date();
    task.status           = approved ? 'approved' : 'rejected';
    if (approved) task.completedAt = new Date();
    await task.save();

    const progress = await recalcProgress(task.planId);

    // Notify employee of decision
    const io = req.app.get('io');
    const plan = await KTPlan.findById(task.planId);

    await createAlert(io, {
      userId: task.employeeId,
      type: 'general',
      message: approved
        ? `Your KT task "${task.title}" has been approved.`
        : `Your KT task "${task.title}" was not approved. Reason: ${note || 'No reason given'}. Please revise and resubmit.`,
      actionUrl: '/employee/kt-sessions',
      actionLabel: 'View KT Sessions',
      priority: approved ? 'low' : 'medium',
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: approved ? 'kt_task_approved' : 'kt_task_rejected',
      details: { taskId: task._id, note },
    });

    res.json({
      success: true,
      message: approved ? 'Task approved.' : 'Task rejected.',
      task,
      planProgress: progress,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/kt-tasks/:id/rate ─────────────────────────────
// Manager rates backup person after validation task
router.post('/:id/rate', protect, requireRole('manager', 'admin', 'hr_analyst'), async (req, res) => {
  try {
    const { competenceRating } = req.body;

    const validRatings = ['fully_competent', 'needs_minor', 'needs_significant', 'not_competent'];
    if (!validRatings.includes(competenceRating)) {
      return res.status(400).json({
        success: false,
        message: `competenceRating must be one of: ${validRatings.join(', ')}`,
      });
    }

    const task = await KTTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.type !== 'validation') {
      return res.status(400).json({ success: false, message: 'Only validation tasks can be rated' });
    }
    if (req.user.role === 'manager' && task.managerId?.toString() !== req.user._id.toString() && req.user.role !== 'hr_analyst') {
      return res.status(403).json({ success: false, message: 'Only the assigned manager can rate backup competence' });
    }

    const prerequisiteTasks = await KTTask.find({
      planId: task.planId,
      type: { $in: ['documentation', 'shadowing', 'interview'] },
    });
    const incompletePrerequisites = prerequisiteTasks.filter(t => !t.isDone);
    if (incompletePrerequisites.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Backup validation can only be rated after documentation, shadowing, and interview tasks are complete.',
        incompleteTasks: incompletePrerequisites.map(t => ({
          id: t._id,
          type: t.type,
          title: t.title,
          status: t.status,
        })),
      });
    }

    task.competenceRating = competenceRating;
    task.managerActedAt   = new Date();

    // Auto-approve if competent enough
    const isSuccess = ['fully_competent', 'needs_minor'].includes(competenceRating);
    if (isSuccess) {
      task.status      = 'approved';
      task.completedAt = new Date();
    } else {
      // Not ready — recommend new sessions
      task.status = 'rejected';
    }

    await task.save();
    await recalcProgress(task.planId);

    // Notify backup person
    const io = req.app.get('io');
    const plan = await KTPlan.findById(task.planId).populate('backupPersonId', 'name');

    const ratingLabels = {
      fully_competent:   'Fully Competent ✓',
      needs_minor:       'Competent with minor gaps',
      needs_significant: 'Needs significant more training',
      not_competent:     'Not yet competent',
    };

    if (plan?.backupPersonId) {
      await createAlert(io, {
        userId: plan.backupPersonId._id,
        type: 'general',
        message: `Your competence rating for the KT validation task: ${ratingLabels[competenceRating]}`,
        actionUrl: '/employee/kt-sessions',
        actionLabel: 'View Details',
        priority: isSuccess ? 'low' : 'medium',
      });
    }

    res.json({
      success: true,
      message: isSuccess
        ? 'Validation approved. Backup person rated as competent.'
        : 'Validation flagged. Additional training sessions recommended.',
      task,
      isSuccess,
      recommendation: isSuccess
        ? 'Proceed to manager sign-off.'
        : 'Schedule additional shadowing and interview sessions before re-attempting validation.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/kt-tasks/my-tasks ──────────────────────────────
// Employee or backup person sees their own tasks
router.get('/my-tasks', protect, async (req, res) => {
  try {
    const tasks = await KTTask.find({
      type: { $ne: 'signoff' },
      $or: [
        { employeeId: req.user._id },
        { backupPersonId: req.user._id },
      ],
    })
      .populate({
        path: 'planId',
        populate: [
          { path: 'employeeId',    select: 'name email' },
          { path: 'backupPersonId',select: 'name email' },
          { path: 'managerId',     select: 'name email' },
        ],
      })
      .sort({ deadline: 1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
