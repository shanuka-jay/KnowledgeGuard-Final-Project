/**
 * KnowledgeGuard Scoring Engine
 *
 * Formula: RS = (EU×0.25) + (DG×0.20) + (PC×0.20) + (CD×0.20) + (T×0.15)
 *
 * Three scores are produced per assessment:
 *   formulaScore  = formula applied to employee self-scores
 *   managerScore  = formula applied to manager-validated scores
 *   mlScore       = FastAPI /predict endpoint result (supporting only)
 *
 * Final score weighting:
 *   Manager validated: self×0.30 + manager×0.50 + ML×0.20
 *   Not yet validated: self×0.70 + ML×0.30
 */

const axios = require('axios');
const RiskScore = require('../models/RiskScore');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const SystemSettings = require('../models/SystemSettings');

// ─── Tenure score from start date ────────────────────────────
function calculateTenureScore(startDate) {
  const years = (Date.now() - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
  if (years < 2)  return 2;
  if (years < 5)  return 5;
  if (years < 10) return 7;
  return 10;
}

// ─── Weighted formula ─────────────────────────────────────────
function calculateFormulaScore(scores, tenureScore, weights = null) {
  const { expertiseUniqueness, documentationGap, projectCriticality, collaborationDependency } = scores;

  // Validate all required scores are present
  if (!expertiseUniqueness || !documentationGap || !projectCriticality || !collaborationDependency) {
    throw new Error('All four indicator scores are required');
  }

  const w = weights || {
    expertiseUniqueness: 0.25,
    documentationGap: 0.20,
    projectCriticality: 0.20,
    collaborationDependency: 0.20,
    tenure: 0.15
  };

  const result =
    expertiseUniqueness     * w.expertiseUniqueness +
    documentationGap        * w.documentationGap +
    projectCriticality      * w.projectCriticality +
    collaborationDependency * w.collaborationDependency +
    tenureScore             * w.tenure;

  return Math.round(result * 100) / 100; // 2 decimal places
}

// ─── Risk tier classification ─────────────────────────────────
function classifyTier(score) {
  if (score <= 5.0) return 'low';
  if (score <= 7.5) return 'medium';
  if (score <= 9.0) return 'high';
  return 'critical';
}

// ─── Confidence based on agreement between three scores and bias discount
function calculateConfidence(selfScore, managerScore, mlScore, confidenceDiscount = 0) {
  const selfManagerDiff = Math.abs(selfScore - managerScore);
  const selfMLDiff      = Math.abs(selfScore - mlScore);

  let confidence = 'low';
  if (selfManagerDiff <= 1.5 && selfMLDiff <= 2.0) confidence = 'high';
  else if (selfManagerDiff <= 3.0) confidence = 'medium';
  
  if (confidenceDiscount >= 0.15 && confidence === 'high') return 'medium';
  if (confidenceDiscount >= 0.3 && confidence !== 'low') return 'low';

  return confidence;
}

// ─── Final weighted score ─────────────────────────────────────
function calculateFinalScore(formulaScore, managerScore, mlScore, managerValidated, confidenceDiscount = 0) {
  let final;
  if (managerValidated && managerScore > 0) {
    // Blend Self (30%), Manager (50%), and ML (20%)
    final = formulaScore * 0.30 + managerScore * 0.50 + mlScore * 0.20;
  } else {
    // No manager validation yet — blend Self (70%) and ML (30%)
    final = formulaScore * 0.70 + mlScore * 0.30;
  }
  return Math.round(final * 100) / 100;
}

// ─── Call ML microservice for prediction ─────────────────────
async function getMLPrediction(scores, tenureScore) {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      {
        expertiseUniqueness:     scores.expertiseUniqueness,
        documentationGap:        scores.documentationGap,
        projectCriticality:      scores.projectCriticality,
        collaborationDependency: scores.collaborationDependency,
        tenure:                  tenureScore,
      },
      { 
        timeout: 5000,
        headers: { 'x-api-key': process.env.ML_API_KEY || 'default-dev-ml-key' }
      } 
    );
    return response.data.predicted_score || 5.0;
  } catch (err) {
    // If ML service is unavailable, fall back to formula score
    console.warn('⚠️  ML service unavailable, using formula fallback:', err.message);
    return null; // null signals fallback was used
  }
}

// ─── MAIN FUNCTION: calculate and save risk score ─────────────
async function calculateAndSaveRiskScore(userId, assessmentId, { session = null } = {}) {
  // 1. Get user and assessment
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error('User not found');

  const assessment = await Assessment.findById(assessmentId).session(session);
  if (!assessment) throw new Error('Assessment not found');
  if (String(assessment.userId) !== String(userId)) throw new Error('Assessment does not belong to this user');
  const period = assessment.period;
  if (!/^\d{4}-Q[1-4]$/.test(period)) throw new Error('Invalid assessment period');

  // 2. Tenure score (auto-calculated, cannot be faked)
  const tenureScore = calculateTenureScore(user.startDate);

  // Fetch dynamic weights if enabled
  const settings = await SystemSettings.getSettings({ session });
  let weights = null;
  if (settings.useDynamicWeights && settings.ahpWeights) {
    weights = typeof settings.ahpWeights.toJSON === 'function' 
      ? settings.ahpWeights.toJSON() 
      : settings.ahpWeights;
  }

  // 3. Formula score from employee self-scores
  const formulaScore = calculateFormulaScore(assessment.selfScores, tenureScore, weights);

  // 4. ML prediction
  const mlScoreRaw = await getMLPrediction(assessment.selfScores, tenureScore);
  const mlScore = mlScoreRaw !== null ? mlScoreRaw : formulaScore; // fallback to formula

  // 5. Manager score (if validated)
  let managerFormulaScore = 0;
  if (assessment.managerValidated && assessment.managerScores) {
    managerFormulaScore = calculateFormulaScore(assessment.managerScores, tenureScore, weights);
  }

  // Extract bias discount if present
  const confidenceDiscount = assessment.responseBias ? (assessment.responseBias.confidenceDiscount || 0) : 0;

  // 6. Final weighted score
  const finalScore = calculateFinalScore(
    formulaScore,
    managerFormulaScore,
    mlScore,
    assessment.managerValidated,
    confidenceDiscount
  );

  // 7. Tier and confidence
  const tier       = classifyTier(finalScore);
  const confidence = assessment.managerValidated
    ? calculateConfidence(formulaScore, managerFormulaScore, mlScore, confidenceDiscount)
    : (confidenceDiscount >= 0.2 ? 'low' : 'medium');

  // 8. Get previous score for delta calculation
  const previousScoreDoc = await RiskScore.findOne({ userId, period: { $lt: period } })
    .sort({ period: -1, calculatedAt: -1 })
    .session(session);
  const previousScore = previousScoreDoc ? previousScoreDoc.finalScore : null;
  const scoreDelta    = previousScore !== null ? finalScore - previousScore : 0;

  // 9. Save or update risk score for this period
  const riskScoreData = {
    userId,
    assessmentId,
    period,
    formulaScore,
    mlScore,
    managerScore: managerFormulaScore,
    finalScore,
    tier,
    confidence,
    breakdown: {
      expertiseUniqueness:     assessment.selfScores.expertiseUniqueness,
      documentationGap:        assessment.selfScores.documentationGap,
      projectCriticality:      assessment.selfScores.projectCriticality,
      collaborationDependency: assessment.selfScores.collaborationDependency,
      tenure:                  tenureScore,
    },
    previousScore,
    scoreDelta,
    ktImpact: assessment.ktImpact || undefined,
    calculatedAt: new Date(),
  };

  // Upsert — update if exists for this period, create if not
  const riskScore = await RiskScore.findOneAndUpdate(
    { userId, period },
    riskScoreData,
    { upsert: true, new: true, session }
  );

  return {
    riskScore,
    tier,
    finalScore,
    scoreDelta,
    previousTier: previousScoreDoc ? previousScoreDoc.tier : null,
  };
}

// ─── Recalculate after KT plan completion ────────────────────
async function recalculateAfterKT(userId) {
  // Find most recent assessment
  const assessment = await Assessment.findOne({ userId }).sort({ period: -1, submittedAt: -1 });
  if (!assessment) return null;

  return calculateAndSaveRiskScore(userId, assessment._id);
}

module.exports = {
  calculateTenureScore,
  calculateFormulaScore,
  classifyTier,
  calculateConfidence,
  calculateFinalScore,
  getMLPrediction,
  calculateAndSaveRiskScore,
  recalculateAfterKT,
};
