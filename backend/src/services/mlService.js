/**
 * mlService.js
 * Connects Node.js backend to the Python FastAPI ML microservice
 */

const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = 8000; // 8 seconds
const ML_API_KEY = process.env.ML_API_KEY || 'default-dev-ml-key';

const mlClient = axios.create({
  baseURL: ML_URL,
  headers: { 'x-api-key': ML_API_KEY }
});

// ─── Predict risk score for one employee ─────────────────────
async function predict(scores, tenureScore) {
  try {
    const { data } = await mlClient.post(`/predict`, {
      expertiseUniqueness:     scores.expertiseUniqueness,
      documentationGap:        scores.documentationGap,
      projectCriticality:      scores.projectCriticality,
      collaborationDependency: scores.collaborationDependency,
      tenure:                  tenureScore,
    }, { timeout: TIMEOUT });

    return {
      predicted_score: data.predicted_score,
      predicted_tier:  data.predicted_tier,
      confidence:      data.confidence,
    };
  } catch (err) {
    console.warn('ML predict failed:', err.message);
    return null; // Caller falls back to formula-only
  }
}

// ─── Train model (admin triggered) ───────────────────────────
async function trainModel(useSynthetic = true, trainingData = [], augmentRealData = false) {
  const { data } = await mlClient.post(`/train`, {
    use_synthetic: useSynthetic,
    augment_real_data: augmentRealData,
    data: trainingData,
  }, { timeout: 60000 }); // 60s for training
  return data;
}

// ─── Get model performance metrics ───────────────────────────
async function getMetrics() {
  try {
    const { data } = await mlClient.get(`/metrics`, { timeout: TIMEOUT });
    return data;
  } catch (err) {
    return { error: 'ML service unavailable', message: err.message };
  }
}

// ─── Anomaly detection on score history ──────────────────────
async function detectAnomaly(userId, scoreHistory) {
  try {
    const { data } = await mlClient.post(`/anomaly`, {
      userId: userId.toString(),
      scoreHistory,
    }, { timeout: TIMEOUT });
    return data;
  } catch (err) {
    console.warn('Anomaly detection failed:', err.message);
    return { is_anomaly: false };
  }
}

// ─── Feature importance from trained model ────────────────────
async function getFeatureImportance() {
  try {
    const { data } = await mlClient.get(`/feature-importance`, { timeout: TIMEOUT });
    return data;
  } catch (err) {
    return { error: 'ML service unavailable' };
  }
}

// ─── Health check ─────────────────────────────────────────────
async function isHealthy() {
  try {
    await mlClient.get(`/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = { predict, trainModel, getMetrics, detectAnomaly, getFeatureImportance, isHealthy };
