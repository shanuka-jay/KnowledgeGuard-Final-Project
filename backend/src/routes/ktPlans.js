const express = require('express');
const router = express.Router();
const KTPlan = require('../models/KTPlan');
const KTTask = require('../models/KTTask');
const User   = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');
const { generateKTQuestions } = require('../services/aiService');
const { signOffKTPlan } = require('../services/ktSignoff');
const { createAlert, alertKTPlanComplete } = require('../services/alertService');

// ─── Helper: recalculate plan completion % ────────────────────
async function recalcProgress(planId) {
  const tasks = await KTTask.find({ planId });
  if (!tasks.length) return 0;
  const done = tasks.filter(t => t.isDone).length;
  const pct  = Math.round((done / tasks.length) * 100);
  await KTPlan.findByIdAndUpdate(planId, { completionPercentage: pct });
  return pct;
}

// ─── POST /api/kt-plans ───────────────────────────────────────
// Manager creates a new KT plan
router.post('/', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { employeeId, backupPersonId, knowledgeAreas, deadline, priority } = req.body;

    if (!employeeId || !backupPersonId || !knowledgeAreas?.length || !deadline || !priority) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, backupPersonId, knowledgeAreas, deadline, and priority are required',
      });
    }

    const employee  = await User.findById(employeeId);
    const backup    = await User.findById(backupPersonId);
    if (!employee || !backup) {
      return res.status(404).json({ success: false, message: 'Employee or backup person not found' });
    }
    if (employee._id.toString() === backup._id.toString()) {
      return res.status(400).json({ success: false, message: 'Backup person must be different from the knowledge holder' });
    }
    if (employee.role !== 'employee' || backup.role !== 'employee') {
      return res.status(400).json({ success: false, message: 'KT plans can only be created between employee accounts' });
    }
    if (req.user.role === 'manager') {
      const managerId = req.user._id.toString();
      if (employee.managerId?.toString() !== managerId) {
        return res.status(403).json({ success: false, message: 'You can only create KT plans for your own team members' });
      }
      if (backup.managerId?.toString() !== managerId) {
        return res.status(403).json({ success: false, message: 'Backup person must be from your own team' });
      }
    }

    const RiskScore = require('../models/RiskScore');
    const sourceScore = await RiskScore.findOne({ userId: employeeId }).sort({ period: -1, calculatedAt: -1 });
    const backupScore = await RiskScore.findOne({ userId: backupPersonId }).sort({ period: -1, calculatedAt: -1 });

    if (!sourceScore || !['high', 'critical'].includes(sourceScore.tier)) {
      return res.status(400).json({ success: false, message: 'Knowledge holder must be a high or critical risk employee.' });
    }
    if (backupScore && ['high', 'critical'].includes(backupScore.tier)) {
      return res.status(400).json({ success: false, message: 'Backup person is also at high knowledge risk and cannot be used.' });
    }

    // 1. Generate AI interview questions
    let aiQuestions = [];
    try {
      aiQuestions = await generateKTQuestions(employee);
    } catch (aiErr) {
      console.warn('AI question generation failed, using defaults:', aiErr.message);
      aiQuestions = [
        `Walk me through your day-to-day responsibilities in detail.`,
        `What processes do you manage that are not fully documented?`,
        `What decisions do you make regularly that require your specific expertise?`,
        `What would break first if you were unavailable for two weeks?`,
        `Who depends on you most, and for what specific tasks?`,
        `What tribal knowledge do you have that isn't written anywhere?`,
        `What are the edge cases and exceptions in your work that are hardest to transfer?`,
        `What tools, systems, or contacts are critical that only you know about?`,
        `How would you train someone to replace you in three months?`,
        `What mistakes have you learned from that a successor should know?`,
      ];
    }

    // 2. Create the KT plan
    const plan = await KTPlan.create({
      employeeId,
      managerId: req.user._id,
      backupPersonId,
      knowledgeAreas,
      deadline: new Date(deadline),
      priority,
      aiQuestions,
      status: 'active',
    });

    // 3. Auto-create the 5 task types
    const deadlineDate = new Date(deadline);
    const week = 7 * 24 * 60 * 60 * 1000;

    const tasks = await KTTask.insertMany([
      {
        planId: plan._id,
        employeeId,
        managerId: req.user._id,
        type: 'documentation',
        title: `Document knowledge areas: ${knowledgeAreas.join(', ')}`,
        description: 'Employee must document all assigned knowledge areas with links or written descriptions. Evidence required before submission counts.',
        deadline: new Date(deadlineDate - 3 * week),
        status: 'pending',
      },
      {
        planId: plan._id,
        employeeId,
        backupPersonId,
        managerId: req.user._id,
        type: 'shadowing',
        title: `Shadowing session — ${employee.name} with ${backup.name}`,
        description: `${backup.name} observes ${employee.name} performing key tasks. Both participants confirm attendance, then submit session notes or evidence for manager approval.`,
        deadline: new Date(deadlineDate - 2.5 * week),
        status: 'pending',
      },
      {
        planId: plan._id,
        employeeId,
        backupPersonId,
        managerId: req.user._id,
        type: 'interview',
        title: `Structured knowledge transfer interview`,
        description: 'AI-generated questions are used to extract tacit knowledge. Both participants confirm completion, then submit notes or evidence for manager approval.',
        deadline: new Date(deadlineDate - 2 * week),
        status: 'pending',
      },
      {
        planId: plan._id,
        employeeId,
        backupPersonId,
        managerId: req.user._id,
        type: 'validation',
        title: `Backup person practice run — ${backup.name} works independently`,
        description: `${backup.name} completes real tasks independently without assistance. Manager rates competence afterward.`,
        deadline: new Date(deadlineDate - 1 * week),
        status: 'pending',
      },
      {
        planId: plan._id,
        managerId: req.user._id,
        type: 'signoff',
        title: `Manager sign-off — confirm KT plan complete`,
        description: 'Only available after all other tasks are approved. Manager confirms knowledge has been successfully transferred.',
        deadline: deadlineDate,
        status: 'pending',
      },
    ]);

    // 4. Notify employee and backup person
    const io = req.app.get('io');
    await createAlert(io, {
      userId: employeeId,
      type: 'general',
      message: `A Knowledge Transfer plan has been created for you by ${req.user.name}. Please check your KT sessions.`,
      actionUrl: '/employee/kt-sessions',
      actionLabel: 'View KT Sessions',
      priority: 'high',
    });

    await createAlert(io, {
      userId: backupPersonId,
      type: 'general',
      message: `You have been assigned as backup person in a KT plan for ${employee.name}. Please check your KT sessions.`,
      actionUrl: '/employee/kt-sessions',
      actionLabel: 'View KT Sessions',
      priority: 'medium',
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_plan_created',
      details: { planId: plan._id, employeeId, backupPersonId },
    });

    res.status(201).json({
      success: true,
      plan,
      tasks,
      message: `KT plan created with ${tasks.length} tasks and ${aiQuestions.length} AI-generated questions`,
    });
  } catch (err) {
    console.error('KT plan create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/kt-plans ────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'manager')  filter.managerId  = req.user._id;
    if (req.user.role === 'employee') filter.employeeId = req.user._id;

    if (req.query.status) filter.status = req.query.status;

    const plans = await KTPlan.find(filter)
      .populate('employeeId',    'name email department knowledgeTags')
      .populate('backupPersonId','name email')
      .populate('managerId',     'name email')
      .sort({ createdAt: -1 });

    // Attach tasks to each plan
    const plansWithTasks = await Promise.all(
      plans.map(async (plan) => {
        const tasks = await KTTask.find({ planId: plan._id }).sort({ createdAt: 1 });
        return { ...plan.toObject({ virtuals: true }), tasks };
      })
    );

    res.json({ success: true, count: plans.length, plans: plansWithTasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/kt-plans/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const plan = await KTPlan.findById(req.params.id)
      .populate('employeeId',    'name email department skills knowledgeTags projects')
      .populate('backupPersonId','name email')
      .populate('managerId',     'name email');

    if (!plan) return res.status(404).json({ success: false, message: 'KT plan not found' });

    const tasks = await KTTask.find({ planId: plan._id }).sort({ createdAt: 1 });

    res.json({ success: true, plan: { ...plan.toObject({ virtuals: true }), tasks } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/kt-plans/:id ────────────────────────────────────
router.put('/:id', protect, requireRole('manager', 'admin', 'hr_analyst'), async (req, res) => {
  try {
    const { knowledgeAreas, deadline, priority } = req.body;
    const plan = await KTPlan.findById(req.params.id);
    
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'hr_analyst') {
      return res.status(403).json({ success: false, message: 'Only the assigned manager can edit this plan' });
    }

    if (knowledgeAreas?.length) plan.knowledgeAreas = knowledgeAreas;
    if (priority) plan.priority = priority;
    
    let deadlineChanged = false;
    if (deadline && new Date(deadline).getTime() !== new Date(plan.deadline).getTime()) {
      plan.deadline = new Date(deadline);
      deadlineChanged = true;
    }

    await plan.save();

    // If deadline changed, update all pending tasks
    if (deadlineChanged) {
      const deadlineDate = new Date(deadline);
      const week = 7 * 24 * 60 * 60 * 1000;
      
      await KTTask.updateMany({ planId: plan._id, type: 'documentation', status: 'pending' }, { deadline: new Date(deadlineDate - 3 * week) });
      await KTTask.updateMany({ planId: plan._id, type: 'shadowing', status: 'pending' }, { deadline: new Date(deadlineDate - 2.5 * week) });
      await KTTask.updateMany({ planId: plan._id, type: 'interview', status: 'pending' }, { deadline: new Date(deadlineDate - 2 * week) });
      await KTTask.updateMany({ planId: plan._id, type: 'validation', status: 'pending' }, { deadline: new Date(deadlineDate - 1 * week) });
      await KTTask.updateMany({ planId: plan._id, type: 'signoff', status: 'pending' }, { deadline: deadlineDate });
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_plan_updated',
      details: { planId: plan._id },
    });

    res.json({ success: true, plan, message: 'KT plan updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/kt-plans/:id ─────────────────────────────────
router.delete('/:id', protect, requireRole('manager', 'admin', 'hr_analyst'), async (req, res) => {
  try {
    const plan = await KTPlan.findById(req.params.id);
    
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'hr_analyst') {
      return res.status(403).json({ success: false, message: 'Only the assigned manager can delete this plan' });
    }

    await KTTask.deleteMany({ planId: plan._id });
    await KTPlan.findByIdAndDelete(plan._id);

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_plan_deleted',
      details: { planId: plan._id, employeeId: plan.employeeId },
    });

    res.json({ success: true, message: 'KT plan and all associated tasks deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/kt-plans/:id/signoff ──────────────────────────
// Manager signs off — only when ALL other tasks are approved
router.post('/:id/signoff', protect, requireRole('manager', 'admin', 'hr_analyst'), async (req, res) => {
  try {
    const { plan, result } = await signOffKTPlan(req.params.id, req.user);

    // Alert manager
    try {
    const io = req.app.get('io');
    const employee = await User.findById(plan.employeeId);
    await alertKTPlanComplete(io, plan.managerId, plan.employeeId, employee?.name || 'Employee');

    // Notify employee
    await createAlert(io, {
      userId: plan.employeeId,
      type: 'kt_plan_complete',
      message: 'Your Knowledge Transfer plan is complete. Your risk score has been updated.',
      actionUrl: '/employee',
      actionLabel: 'View My Score',
      priority: 'low',
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'kt_plan_signed_off',
      details: { planId: plan._id, employeeId: plan.employeeId },
    });
    } catch (notificationError) {
      // Notification failure must not report a committed sign-off as failed.
      console.warn('KT sign-off committed, but notification/audit delivery failed.');
    }

    res.json({ success: true, message: 'KT plan signed off and complete. Risk scores updated.', finalScore: result.finalScore, tier: result.tier });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
