const express    = require('express');
const router     = express.Router();
const Assessment = require('../models/Assessment');
const RiskScore  = require('../models/RiskScore');
const User       = require('../models/User');
const ActivityLog= require('../models/ActivityLog');
const SystemSettings = require('../models/SystemSettings');
const { protect, requireRole } = require('../middleware/auth');
const { trainModel, getMetrics, getFeatureImportance } = require('../services/mlService');
const { calculateTenureScore, calculateFormulaScore, classifyTier, calculateAndSaveRiskScore } = require('../services/scoringEngine');
const { calculateAHP } = require('../utils/ahp');

// GET /api/research/bias — three-way score comparison with MAE and Response Bias Analytics
router.get('/bias', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const assessments = await Assessment.find({ managerValidated: true }).populate('userId','name email department');
    const results = [];
    for (const a of assessments) {
      const riskScore = await RiskScore.findOne({ userId: a.userId._id }).sort({ calculatedAt: -1 });
      if (!riskScore) continue;
      const selfScore    = riskScore.formulaScore;
      const managerScore = riskScore.managerScore;
      const mlScore      = riskScore.mlScore;
      const smDelta = Math.abs(selfScore - managerScore);
      const smlDelta= Math.abs(selfScore - mlScore);
      
      const responseBias = a.responseBias || {};

      results.push({
        employeeId:    a.userId._id,
        employeeName:  a.userId.name,
        department:    a.userId.department,
        selfScore:     parseFloat(selfScore.toFixed(2)),
        managerScore:  parseFloat(managerScore.toFixed(2)),
        mlScore:       parseFloat(mlScore.toFixed(2)),
        finalScore:    parseFloat(riskScore.finalScore.toFixed(2)),
        selfManagerDelta: parseFloat(smDelta.toFixed(2)),
        selfMLDelta:      parseFloat(smlDelta.toFixed(2)),
        biasDirection: managerScore > selfScore ? 'under' : 'over',
        tier: riskScore.tier,
        quarterTag: a.quarterTag || 'universal',
        biasScore: responseBias.biasScore || 0,
        inconsistencyScore: responseBias.inconsistencyScore || 0,
        straightLining: responseBias.straightLining || false,
        biasFlags: responseBias.biasFlags || []
      });
    }
    const mae_sm  = results.length ? results.reduce((s,r)=>s+r.selfManagerDelta,0)/results.length : 0;
    const mae_sml = results.length ? results.reduce((s,r)=>s+r.selfMLDelta,0)/results.length : 0;
    const underReporters = results.filter(r=>r.biasDirection==='under').length;
    const overReporters  = results.filter(r=>r.biasDirection==='over').length;
    const straightLiners = results.filter(r=>r.straightLining).length;
    const avgInconsistency = results.length ? results.reduce((s,r)=>s+r.inconsistencyScore,0)/results.length : 0;

    res.json({ success: true, results, summary: {
      totalParticipants: results.length,
      maeSelVsManager: parseFloat(mae_sm.toFixed(3)),
      maeSelfVsML:     parseFloat(mae_sml.toFixed(3)),
      underReporters, overReporters,
      underReporterPct: results.length ? Math.round(underReporters/results.length*100) : 0,
      overReporterPct:  results.length ? Math.round(overReporters/results.length*100)  : 0,
      straightLiners,
      avgInconsistency: parseFloat(avgInconsistency.toFixed(2)),
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/research/sus — SUS scores
router.get('/sus', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const logs = await ActivityLog.find({ action: 'sus_submitted' }).populate('userId','name email role');
    const scored = logs.map(log => {
      const q = log.details?.responses || {};
      const oddSum  = (q.q1-1)+(q.q3-1)+(q.q5-1)+(q.q7-1)+(q.q9-1);
      const evenSum = (5-q.q2)+(5-q.q4)+(5-q.q6)+(5-q.q8)+(5-q.q10);
      const susScore= (oddSum+evenSum)*2.5;
      const grade   = susScore>=85?'Excellent':susScore>=71?'Good':susScore>=51?'OK':'Poor';
      return { userId:log.userId?._id, name:log.userId?.name, role:log.userId?.role, susScore:parseFloat(susScore.toFixed(1)), grade, submittedAt:log.createdAt };
    });
    const avg = scored.length ? scored.reduce((s,r)=>s+r.susScore,0)/scored.length : 0;
    res.json({ success:true, responses:scored, average:parseFloat(avg.toFixed(1)), count:scored.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/research/tam — TAM scores
router.get('/tam', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const logs = await ActivityLog.find({ action: 'tam_submitted' }).populate('userId','name email role');
    const results = logs.map(log => {
      const d = log.details?.responses || {};
      const puAvg   = ((d.pu1||3)+(d.pu2||3)+(d.pu3||3))/3;
      const peouAvg = ((d.peou1||3)+(d.peou2||3)+(d.peou3||3))/3;
      return { userId:log.userId?._id, name:log.userId?.name, role:log.userId?.role,
        puAvg:parseFloat(puAvg.toFixed(2)), peouAvg:parseFloat(peouAvg.toFixed(2)),
        adoptionIntent:d.adopt||3, submittedAt:log.createdAt };
    });
    const avgPU   = results.length ? results.reduce((s,r)=>s+r.puAvg,0)/results.length   : 0;
    const avgPEOU = results.length ? results.reduce((s,r)=>s+r.peouAvg,0)/results.length : 0;
    res.json({ success:true, responses:results, averages:{ pu:parseFloat(avgPU.toFixed(2)), peou:parseFloat(avgPEOU.toFixed(2)) }, count:results.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/research/ahp — AHP weight calculator
router.post('/ahp', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const { matrix } = req.body;
    const result = calculateAHP(matrix);
    res.json({ success:true, ...result });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
});

// GET /api/research/settings
router.get('/settings', protect, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/research/settings/apply-ahp
router.post('/settings/apply-ahp', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const { matrix } = req.body;
    const ahpResult = calculateAHP(matrix);
    if (!ahpResult.isConsistent) {
      return res.status(400).json({
        success: false,
        message: `AHP weights were not applied because the consistency ratio is ${ahpResult.consistencyRatio}, which must be below 0.10.`,
        consistencyRatio: ahpResult.consistencyRatio,
      });
    }

    const settings = await SystemSettings.getSettings();
    settings.ahpWeights = ahpResult.weights;
    settings.useDynamicWeights = true;
    await settings.save();
    
    const currentPeriod = Assessment.getCurrentPeriod();
    const activeAssessments = await Assessment.find({ period: currentPeriod });
    for (const a of activeAssessments) {
      await calculateAndSaveRiskScore(a.userId, a._id); 
    }
    
    await ActivityLog.create({ userId:req.user._id, action:'ahp_weights_applied', details:{ weights: ahpResult.weights, consistencyRatio: ahpResult.consistencyRatio, recalculatedCount: activeAssessments.length } });
    res.json({ success: true, settings, ...ahpResult });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
});

// POST /api/research/settings/rollback
router.post('/settings/rollback', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    settings.useDynamicWeights = false;
    await settings.save();
    
    const currentPeriod = Assessment.getCurrentPeriod();
    const activeAssessments = await Assessment.find({ period: currentPeriod });
    for (const a of activeAssessments) {
      await calculateAndSaveRiskScore(a.userId, a._id);
    }
    
    await ActivityLog.create({ userId:req.user._id, action:'ahp_weights_rolled_back', details:{ recalculatedCount: activeAssessments.length } });
    res.json({ success: true, settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/research/ml-metrics
router.get('/ml-metrics', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const [metrics, featureImportance] = await Promise.all([getMetrics(), getFeatureImportance()]);
    res.json({ success:true, metrics, featureImportance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/research/train — admin triggers ML training
router.post('/train', protect, requireRole('admin', 'hr_analyst', 'researcher'), async (req, res) => {
  try {
    const { useSynthetic = true, augmentRealData = false } = req.body;
    let trainingData = [];
    if (!useSynthetic) {
      const validated = await Assessment.find({
        managerValidated: true,
        managerScores: { $exists: true, $ne: null },
      }).populate('userId', 'startDate');

      trainingData = validated
        .filter(a => a.userId && a.selfScores && a.managerScores)
        .map(a => {
          const tenureScore = calculateTenureScore(a.userId.startDate);
          const managerFormulaScore = calculateFormulaScore(a.managerScores, tenureScore);
          return {
            features: [
              a.selfScores.expertiseUniqueness,
              a.selfScores.documentationGap,
              a.selfScores.projectCriticality,
              a.selfScores.collaborationDependency,
              tenureScore,
            ],
            label: classifyTier(managerFormulaScore),
          };
        });

      if (trainingData.length < 10 && !augmentRealData) {
        return res.status(400).json({
          success: false,
          message: `Need at least 10 manager-validated assessments for real-data training. Current usable records: ${trainingData.length}. Use synthetic training until pilot data is collected.`,
        });
      }
    }
    const result = await trainModel(useSynthetic, trainingData, augmentRealData);
    await ActivityLog.create({ userId:req.user._id, action:'ml_trained', details:{ useSynthetic, result } });
    res.json({ success:true, result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/research/sus-submit — participant submits SUS survey in-app
router.post('/sus-submit', protect, async (req, res) => {
  try {
    const { responses } = req.body;
    await ActivityLog.create({ userId:req.user._id, action:'sus_submitted', details:{ responses } });
    res.json({ success:true, message:'SUS survey submitted. Thank you.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/research/tam-submit — participant submits TAM survey in-app
router.post('/tam-submit', protect, async (req, res) => {
  try {
    const { responses } = req.body;
    await ActivityLog.create({ userId:req.user._id, action:'tam_submitted', details:{ responses } });
    res.json({ success:true, message:'TAM survey submitted. Thank you.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
