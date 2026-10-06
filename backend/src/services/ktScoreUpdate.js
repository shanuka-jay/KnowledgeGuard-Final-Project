/**
 * Called after a KT plan is signed off.
 *
 * KT should reduce the risks it actually mitigates:
 * - Documentation Gap: reduced when documentation evidence is approved.
 * - Expertise Uniqueness: reduced based on backup competence validation.
 * - Collaboration Dependency: reduced when shadowing + interview are approved
 *   and the backup is validated.
 *
 * Project Criticality and Tenure stay factual. KT can mitigate single-person
 * failure impact, but it should not pretend the project is less critical or
 * that the employee has different tenure.
 */

const KTPlan = require('../models/KTPlan');
const KTTask = require('../models/KTTask');
const Assessment = require('../models/Assessment');
const { calculateAndSaveRiskScore } = require('./scoringEngine');

const VALIDATION_IMPACT = {
  fully_competent: {
    expertiseReduction: 3,
    collaborationReduction: 2,
    label: 'Backup fully competent',
  },
  needs_minor: {
    expertiseReduction: 2,
    collaborationReduction: 1.5,
    label: 'Backup competent with minor gaps',
  },
  needs_significant: {
    expertiseReduction: 1,
    collaborationReduction: 0.5,
    label: 'Backup needs significant support',
  },
  not_competent: {
    expertiseReduction: 0,
    collaborationReduction: 0,
    label: 'Backup not competent yet',
  },
};

function snapshotScores(scores) {
  if (!scores) return null;
  const raw = scores.toObject ? scores.toObject() : scores;
  return {
    expertiseUniqueness: raw.expertiseUniqueness,
    documentationGap: raw.documentationGap,
    projectCriticality: raw.projectCriticality,
    collaborationDependency: raw.collaborationDependency,
  };
}

function reduceIndicatorScores(scores, reductions) {
  const raw = snapshotScores(scores);
  if (!raw) return scores;

  return {
    expertiseUniqueness: Math.max(1, raw.expertiseUniqueness - reductions.expertiseReduction),
    documentationGap: Math.max(1, raw.documentationGap - reductions.documentationReduction),
    projectCriticality: raw.projectCriticality,
    collaborationDependency: Math.max(1, raw.collaborationDependency - reductions.collaborationReduction),
  };
}

async function updateScoreAfterKT(planId, { session = null } = {}) {
  try {
    const plan = await KTPlan.findById(planId).session(session);
    if (!plan) throw new Error('KT Plan not found');

    const tasks = await KTTask.find({ planId }).session(session);

    const docTasks = tasks.filter(t => t.type === 'documentation');
    const docTasksApproved = docTasks.filter(t => t.managerApproved).length;
    const totalDocTasks = docTasks.length || 1;

    const shadowingApproved = tasks.some(t => t.type === 'shadowing' && t.managerApproved);
    const interviewApproved = tasks.some(t => t.type === 'interview' && t.managerApproved);
    const validationTask = tasks.find(t => t.type === 'validation');
    const validationImpact = VALIDATION_IMPACT[validationTask?.competenceRating] || VALIDATION_IMPACT.not_competent;

    const assessment = await Assessment.findOne({ userId: plan.employeeId }).sort({ period: -1, submittedAt: -1 }).session(session);
    if (!assessment) {
      throw new Error('No assessment found for employee; sign-off cannot update scores');
    }
    // Include legacy impact records so old plans cannot be applied a second time.
    const appliedIds = assessment.ktAppliedPlanIds || [];
    if (appliedIds.some(id => String(id) === String(planId)) || String(assessment.ktImpact?.planId) === String(planId)) {
      return calculateAndSaveRiskScore(plan.employeeId, assessment._id, { session });
    }

    const documentationReduction = docTasksApproved > 0
      ? (docTasksApproved / totalDocTasks) * 3
      : 0;

    const expertiseReduction = validationImpact.expertiseReduction;
    const collaborationReduction = shadowingApproved && interviewApproved
      ? validationImpact.collaborationReduction
      : 0;

    const reductions = {
      documentationReduction,
      expertiseReduction,
      collaborationReduction,
    };

    const beforeSelfScores = snapshotScores(assessment.selfScores);

    assessment.selfScores = reduceIndicatorScores(assessment.selfScores, reductions);

    if (assessment.managerValidated && assessment.managerScores) {
      assessment.managerScores = reduceIndicatorScores(assessment.managerScores, reductions);
    }

    assessment.ktImpact = {
      planId: plan._id,
      appliedAt: new Date(),
      documentationReduction,
      expertiseReduction,
      collaborationReduction,
      projectCriticalityMitigated: shadowingApproved && interviewApproved && collaborationReduction > 0,
      projectCriticalityNote: 'Project criticality remains unchanged; KT reduces single-person failure impact through backup coverage.',
      validationOutcome: validationTask?.competenceRating || 'not_rated',
      validationLabel: validationImpact.label,
      before: beforeSelfScores,
      after: snapshotScores(assessment.selfScores),
    };

    assessment.ktAppliedPlanIds = [...appliedIds, plan._id];
    await assessment.save({ session });

    const result = await calculateAndSaveRiskScore(plan.employeeId, assessment._id, { session });

    console.log(
      `KT score update complete for employee ${plan.employeeId}:`,
      `DG -${documentationReduction.toFixed(2)}, EU -${expertiseReduction.toFixed(2)}, CD -${collaborationReduction.toFixed(2)},`,
      `new score ${result.finalScore.toFixed(2)} (${result.tier})`
    );

    return result;
  } catch (err) {
    console.error('KT score update error:', err.message);
    throw err;
  }
}

module.exports = { updateScoreAfterKT };
