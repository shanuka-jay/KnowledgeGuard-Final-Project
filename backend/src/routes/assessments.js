const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');
const { calculateAndSaveRiskScore } = require('../services/scoringEngine');
const {
  checkScoreAlerts,
  alertManagerValidationNeeded,
  alertAssessmentValidated,
} = require('../services/alertService');
const {
  sendCriticalRiskAlert,
  sendHighRiskAlert,
} = require('../services/emailService');

// ─── POST /api/assessments ────────────────────────────────────
// Employee submits self-assessment
router.post('/', protect, requireRole('employee'), async (req, res) => {
  try {
    const { expertiseUniqueness, documentationGap, projectCriticality, collaborationDependency } = req.body;

    // Validate all scores present and in range
    const scores = { expertiseUniqueness, documentationGap, projectCriticality, collaborationDependency };
    for (const [key, val] of Object.entries(scores)) {
      if (!val || val < 1 || val > 10) {
        return res.status(400).json({
          success: false,
          message: `${key} must be between 1 and 10`,
        });
      }
    }

    const period = Assessment.getCurrentPeriod();

    // Check for duplicate submission this period
    const existing = await Assessment.findOne({ userId: req.user._id, period });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted your assessment for ${period}`,
      });
    }

    // Create assessment
    const assessment = await Assessment.create({
      userId: req.user._id,
      managerId: req.user.managerId,
      period,
      selfScores: scores,
    });

    // Calculate risk score immediately
    const result = await calculateAndSaveRiskScore(req.user._id, assessment._id);
    result.riskScore._employeeName = req.user.name;

    // Check if manager alerts are needed
    if (req.user.managerId) {
      const io = req.app.get('io');
      await checkScoreAlerts(io, result, req.user.managerId);
      await alertManagerValidationNeeded(io, req.user.managerId, req.user._id, req.user.name);

      // Send email for high/critical
      const manager = await User.findById(req.user.managerId);
      if (manager) {
        if (result.tier === 'critical') {
          await sendCriticalRiskAlert(manager.email, manager.name, req.user.name, result.finalScore);
        } else if (result.tier === 'high') {
          await sendHighRiskAlert(manager.email, manager.name, req.user.name, result.finalScore);
        }
      }
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'assessment_submitted',
      details: { period, scores, tier: result.tier, finalScore: result.finalScore },
    });

    res.status(201).json({
      success: true,
      assessment,
      riskScore: result.riskScore,
      tier: result.tier,
      finalScore: result.finalScore,
      message: `Assessment submitted. Your risk score is ${result.finalScore.toFixed(1)} (${result.tier})`,
    });
  } catch (err) {
    console.error('Assessment submit error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/assessments/:id/validate ──────────────────────
// Manager validates an employee assessment
router.post('/:id/validate', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { expertiseUniqueness, documentationGap, projectCriticality, collaborationDependency, notes } = req.body;

    const assessment = await Assessment.findById(req.params.id).populate('userId');
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    // Check manager is responsible for this employee
    if (
      req.user.role === 'manager' &&
      assessment.userId.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'You can only validate your own team members' });
    }

    // Update with manager scores
    assessment.managerScores = { expertiseUniqueness, documentationGap, projectCriticality, collaborationDependency };
    assessment.managerValidated = true;
    assessment.managerValidatedAt = new Date();
    assessment.managerNotes = notes || '';
    if (!assessment.managerId) {
      assessment.managerId = req.user._id;
    }
    await assessment.save();

    // Recalculate score with manager validation included
    const result = await calculateAndSaveRiskScore(assessment.userId._id, assessment._id);
    result.riskScore._employeeName = assessment.userId.name;

    const io = req.app.get('io');
    const managerId = req.user.role === 'manager' ? req.user._id : assessment.userId.managerId;
    
    // Alert the employee that their assessment was validated
    await alertAssessmentValidated(io, assessment.userId._id, assessment.userId.name, req.user.name, result.finalScore, result.tier);

    if (managerId) {
      await checkScoreAlerts(io, result, managerId);
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'assessment_validated',
      details: { assessmentId: assessment._id, employeeId: assessment.userId._id },
    });

    res.json({
      success: true,
      message: 'Assessment validated. Score recalculated.',
      riskScore: result.riskScore,
      tier: result.tier,
      finalScore: result.finalScore,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/assessments/mine ────────────────────────────────
// Employee: own assessment history
router.get('/mine', protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({ userId: req.user._id })
      .populate('managerId', 'name email role')
      .sort({ period: -1, submittedAt: -1 });

    const user = await User.findById(req.user._id).populate('managerId', 'name email role');
    const enriched = assessments.map(a => {
      const doc = a.toObject();
      if (!doc.managerId && user?.managerId) {
        doc.managerId = user.managerId;
      }
      return doc;
    });

    res.json({ success: true, assessments: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/assessments/pending ────────────────────────────
// Manager: assessments awaiting their validation
router.get('/pending', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    let filter = { managerValidated: false };

    if (req.user.role === 'manager') {
      filter.managerId = req.user._id;
    }

    const assessments = await Assessment.find(filter)
      .populate('userId', 'name email department')
      .sort({ submittedAt: -1 });

    res.json({ success: true, count: assessments.length, assessments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/assessments/scores ─────────────────────────────
// Get risk scores — scoped by role
router.get('/status', protect, requireRole('manager', 'admin', 'hr_analyst'), async (req, res) => {
  try {
    const period = Assessment.getCurrentPeriod();
    let employeeFilter = { role: 'employee', isActive: true };

    if (req.user.role === 'manager') {
      employeeFilter.managerId = req.user._id;
    }

    const employees = await User.find(employeeFilter)
      .select('name email department managerId startDate isActive avatarUrl avatarFileId knowledgeTags skills')
      .populate('managerId', 'name email');

    const assessments = await Assessment.find({
      period,
      userId: { $in: employees.map(e => e._id) },
    }).select('userId period managerValidated submittedAt managerValidatedAt');

    const byUser = new Map(assessments.map(a => [a.userId.toString(), a]));
    const dueDate = new Date();
    const quarterEndMonth = Math.floor(dueDate.getMonth() / 3) * 3 + 2;
    dueDate.setMonth(quarterEndMonth + 1, 0);
    dueDate.setHours(23, 59, 59, 999);
    const isPastDue = new Date() > dueDate;

    const rows = employees.map(employee => {
      const assessment = byUser.get(employee._id.toString());
      const status = assessment
        ? (assessment.managerValidated ? 'validated' : 'pending_validation')
        : (isPastDue ? 'overdue' : 'not_submitted');
      return {
        employee: employee.toPublicJSON(),
        assessment: assessment || null,
        period,
        dueDate,
        status,
      };
    });

    const summary = rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, { validated: 0, pending_validation: 0, not_submitted: 0, overdue: 0 });

    res.json({ success: true, period, dueDate, summary, rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/scores', protect, async (req, res) => {
  try {
    const RiskScore = require('../models/RiskScore');
    let filter = {};

    if (req.query.userId) {
      const requestedUserId = req.query.userId;

      if (req.user.role === 'employee' && requestedUserId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (req.user.role === 'manager') {
        const teamMember = await User.findOne({ _id: requestedUserId, managerId: req.user._id }).select('_id');
        if (!teamMember) return res.status(403).json({ success: false, message: 'Access denied' });
      }

      filter.userId = requestedUserId;
    } else if (req.user.role === 'employee') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'manager') {
      // Get team member IDs
      const team = await User.find({ managerId: req.user._id }).select('_id');
      filter.userId = { $in: team.map(u => u._id) };
    }

    // Date range filter
    if (req.query.startDate) filter.calculatedAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate)   filter.calculatedAt = { ...filter.calculatedAt, $lte: new Date(req.query.endDate) };

    const scores = await RiskScore.find(filter)
      .populate('userId', 'name email department role')
      .populate({
        path: 'assessmentId',
        populate: { path: 'managerId', select: 'name email role' }
      })
      .sort({ period: -1, calculatedAt: -1 });

    res.json({ success: true, count: scores.length, scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
