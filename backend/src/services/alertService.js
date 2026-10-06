const Alert = require('../models/Alert');
const RiskScore = require('../models/RiskScore');
const User = require('../models/User');
const { detectAnomaly } = require('./mlService');
const { emitAlert } = require('../socket/socketHandler');
const { sendAnomalyAlert, sendTaskReadyForReviewAlert } = require('./emailService');

/**
 * Create an alert, save it to MongoDB, and push via Socket.IO
 *
 * @param {Object} io - Socket.IO server instance (from req.app.get('io'))
 * @param {Object} data - Alert data
 */
async function createAlert(io, {
  userId,
  targetUserId = null,
  type,
  message,
  actionUrl = null,
  actionLabel = 'View',
  priority = 'medium',
}) {
  try {
    const alert = await Alert.create({
      userId,
      targetUserId,
      type,
      message,
      actionUrl,
      actionLabel,
      priority,
    });

    // Push real-time notification
    emitAlert(io, userId.toString(), {
      _id: alert._id,
      type: alert.type,
      message: alert.message,
      actionUrl: alert.actionUrl,
      actionLabel: alert.actionLabel,
      priority: alert.priority,
      createdAt: alert.createdAt,
    });

    return alert;
  } catch (err) {
    console.error('Alert service error:', err.message);
    return null;
  }
}

/**
 * Check score and create appropriate alerts after recalculation
 *
 * @param {Object} io
 * @param {Object} result - Result from calculateAndSaveRiskScore
 * @param {string} managerId
 */
async function checkScoreAlerts(io, result, managerId) {
  const { riskScore, tier, finalScore, scoreDelta, previousTier } = result;
  const userId = riskScore.userId;
  const employeeName = riskScore._employeeName || 'An employee'; // set by caller

  const employeeProfileUrl = `/manager/employees/${userId}`;

  // Alert 1 — crossed into High tier for first time
  if (tier === 'high' && previousTier !== 'high' && previousTier !== 'critical') {
    await createAlert(io, {
      userId: managerId,
      targetUserId: userId,
      type: 'score_crossed_high',
      message: `${employeeName} has entered High Risk tier with a score of ${finalScore.toFixed(1)}. Review their profile and consider starting a KT plan.`,
      actionUrl: employeeProfileUrl,
      actionLabel: 'View Profile',
      priority: 'high',
    });
  }

  // Alert 2 — crossed into Critical tier
  if (tier === 'critical' && previousTier !== 'critical') {
    await createAlert(io, {
      userId: managerId,
      targetUserId: userId,
      type: 'score_crossed_critical',
      message: `CRITICAL: ${employeeName} is now Critical Risk (score: ${finalScore.toFixed(1)}). Immediate KT plan required.`,
      actionUrl: employeeProfileUrl,
      actionLabel: 'Start KT Plan',
      priority: 'critical',
    });
  }

  // Alert 3 — sudden spike (>2 points in one quarter)
  if (scoreDelta > 2.0) {
    await createAlert(io, {
      userId: managerId,
      targetUserId: userId,
      type: 'score_spike',
      message: `${employeeName}'s risk score spiked by ${scoreDelta.toFixed(1)} points this quarter (now ${finalScore.toFixed(1)}). This may warrant investigation.`,
      actionUrl: employeeProfileUrl,
      actionLabel: 'View Profile',
      priority: 'high',
    });
  }

  // Notify employee if tier changed
  if (previousTier && tier !== previousTier) {
    await createAlert(io, {
      userId: userId,
      type: 'tier_changed',
      message: `Your Knowledge Risk Tier has changed from ${previousTier.toUpperCase()} to ${tier.toUpperCase()}.`,
      actionUrl: `/dashboard`,
      actionLabel: 'View Dashboard',
      priority: 'medium',
    });
    
    const employee = await User.findById(userId);
    if (employee) {
      const { sendRiskTierChangedEmail } = require('./emailService');
      await sendRiskTierChangedEmail(employee.email, employee.name, previousTier, tier, finalScore);
    }
  }

  const history = await RiskScore.find({ userId })
    .sort({ calculatedAt: 1 })
    .select('period finalScore calculatedAt');

  if (history.length >= 3) {
    const anomaly = await detectAnomaly(userId, history.map(score => ({
      period: score.period || score.calculatedAt.toISOString(),
      score: score.finalScore,
    })));

    if (anomaly?.is_anomaly) {
      await RiskScore.findByIdAndUpdate(riskScore._id, { anomalyFlag: true });
      await createAlert(io, {
        userId: managerId,
        targetUserId: userId,
        type: 'anomaly_detected',
        message: `${employeeName}'s latest risk score pattern is unusual compared with their history. Review before deciding KT priority.`,
        actionUrl: employeeProfileUrl,
        actionLabel: 'Review Score History',
        priority: 'high',
      });
      
      // Notify HR of Anomaly
      const hrUsers = await User.find({ role: { $in: ['admin', 'hr_analyst'] } });
      for (const hr of hrUsers) {
        await sendAnomalyAlert(hr.email, employeeName);
      }
    }
  }
}

/**
 * Alert manager that employee submitted assessment needing validation
 */
async function alertManagerValidationNeeded(io, managerId, employeeId, employeeName) {
  await createAlert(io, {
    userId: managerId,
    targetUserId: employeeId,
    type: 'validation_needed',
    message: `${employeeName} has submitted their self-assessment. Please validate their scores.`,
    actionUrl: `/manager/employees/${employeeId}`,
    actionLabel: 'Validate Now',
    priority: 'medium',
  });
}

/**
 * Alert manager that a KT task was submitted with evidence
 */
async function alertKTTaskSubmitted(io, managerId, employeeId, employeeName, taskTitle) {
  await createAlert(io, {
    userId: managerId,
    targetUserId: employeeId,
    type: 'kt_task_submitted',
    message: `${employeeName} submitted evidence for KT task: "${taskTitle}". Please review and approve.`,
    actionUrl: `/manager/kt-plans`,
    actionLabel: 'Review Task',
    priority: 'medium',
  });

  const manager = await User.findById(managerId);
  if (manager) {
    await sendTaskReadyForReviewAlert(manager.email, manager.name, employeeName, taskTitle);
  }
}

/**
 * Alert backup person that a session was not confirmed within 48h
 */
async function alertSessionUnconfirmed(io, backupPersonId, employeeName, taskTitle) {
  await createAlert(io, {
    userId: backupPersonId,
    type: 'kt_session_unconfirmed',
    message: `Please confirm your attendance at the KT session: "${taskTitle}" with ${employeeName}.`,
    actionUrl: `/kt-sessions`,
    actionLabel: 'Confirm Session',
    priority: 'high',
  });
}

/**
 * Alert employee that their assessment was validated
 */
async function alertAssessmentValidated(io, employeeId, employeeName, managerName, finalScore, tier) {
  await createAlert(io, {
    userId: employeeId,
    type: 'assessment_validated',
    message: `Your manager (${managerName}) has validated your assessment. Your final score is ${finalScore.toFixed(1)} (${tier.toUpperCase()}).`,
    actionUrl: `/dashboard`,
    actionLabel: 'View Dashboard',
    priority: 'medium',
  });

  const employee = await User.findById(employeeId);
  if (employee) {
    const { sendAssessmentValidatedEmail } = require('./emailService');
    await sendAssessmentValidatedEmail(employee.email, employee.name, managerName, finalScore, tier);
  }
}

/**
 * Alert manager that KT plan completion was successful
 */
async function alertKTPlanComplete(io, managerId, employeeId, employeeName) {
  await createAlert(io, {
    userId: managerId,
    targetUserId: employeeId,
    type: 'kt_plan_complete',
    message: `KT plan for ${employeeName} is complete. Their risk score has been updated automatically.`,
    actionUrl: `/manager/employees/${employeeId}`,
    actionLabel: 'View Updated Score',
    priority: 'low',
  });
}

module.exports = {
  createAlert,
  checkScoreAlerts,
  alertManagerValidationNeeded,
  alertKTTaskSubmitted,
  alertSessionUnconfirmed,
  alertAssessmentValidated,
  alertKTPlanComplete,
};
