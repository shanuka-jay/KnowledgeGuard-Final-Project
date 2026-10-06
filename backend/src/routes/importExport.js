const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { stringify } = require('csv-stringify/sync');
const Assessment = require('../models/Assessment');
const RiskScore = require('../models/RiskScore');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, requireRole } = require('../middleware/auth');
const { calculateAndSaveRiskScore } = require('../services/scoringEngine');
const {
  googleAssessmentQuestions,
  getEmail,
  getValue,
  surveyRating,
  mapGoogleAssessmentRow,
} = require('../utils/googleFormsParser');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function csvResponse(res, filename, rows) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(stringify(rows, { header: true }));
}

router.get('/templates/google-assessment', protect, requireRole('admin', 'hr_analyst'), async (req, res) => {
  csvResponse(res, 'kg_google_form_employee_assessment_template.csv', googleAssessmentQuestions.map((q, index) => ({
    order: index + 1,
    csv_column_key: q.key,
    google_form_question: q.label,
    response_type: 'Multiple choice or linear scale 1-5',
    scoring_options: q.options,
    hidden_indicator: q.indicator,
  })));
});

router.get('/templates/manager-validation', protect, requireRole('admin', 'hr_analyst'), async (req, res) => {
  csvResponse(res, 'kg_google_form_manager_validation_template.csv', [
    { csv_column_key: 'employee_email', google_form_question: 'Employee email being validated', response_type: 'Short answer', scoring_note: 'Must match an employee email in KnowledgeGuard' },
    { csv_column_key: 'manager_email', google_form_question: 'Manager email', response_type: 'Short answer', scoring_note: 'Optional audit field' },
    { csv_column_key: 'expertise_uniqueness', google_form_question: 'Manager rating: expertise uniqueness', response_type: 'Linear scale 1-5 or 1-10', scoring_note: 'Higher means more unique knowledge' },
    { csv_column_key: 'documentation_gap', google_form_question: 'Manager rating: documentation gap', response_type: 'Linear scale 1-5 or 1-10', scoring_note: 'Higher means weaker documentation' },
    { csv_column_key: 'project_criticality', google_form_question: 'Manager rating: project criticality', response_type: 'Linear scale 1-5 or 1-10', scoring_note: 'Higher means more critical work' },
    { csv_column_key: 'collaboration_dependency', google_form_question: 'Manager rating: collaboration dependency', response_type: 'Linear scale 1-5 or 1-10', scoring_note: 'Higher means stronger dependency' },
    { csv_column_key: 'manager_notes', google_form_question: 'Manager notes for validation', response_type: 'Paragraph', scoring_note: 'Stored as validation note' },
  ]);
});

router.get('/templates/sus-tam', protect, requireRole('researcher'), async (req, res) => {
  csvResponse(res, 'kg_google_form_sus_tam_template.csv', [
    { form: 'SUS', csv_column_key: 'email', google_form_question: 'Participant email', response_type: 'Short answer' },
    ...Array.from({ length: 10 }, (_, i) => ({ form: 'SUS', csv_column_key: `sus_q${i + 1}`, google_form_question: `SUS Q${i + 1}`, response_type: 'Linear scale 1-5' })),
    { form: 'TAM', csv_column_key: 'email', google_form_question: 'Participant email', response_type: 'Short answer' },
    { form: 'TAM', csv_column_key: 'pu_1', google_form_question: 'Using KnowledgeGuard improves knowledge-risk identification.', response_type: 'Linear scale 1-5' },
    { form: 'TAM', csv_column_key: 'pu_2', google_form_question: 'KnowledgeGuard supports better KT planning decisions.', response_type: 'Linear scale 1-5' },
    { form: 'TAM', csv_column_key: 'pu_3', google_form_question: 'KnowledgeGuard would be useful in an organization.', response_type: 'Linear scale 1-5' },
    { form: 'TAM', csv_column_key: 'peou_1', google_form_question: 'KnowledgeGuard is easy to understand.', response_type: 'Linear scale 1-5' },
    { form: 'TAM', csv_column_key: 'peou_2', google_form_question: 'It is easy to complete the required tasks in KnowledgeGuard.', response_type: 'Linear scale 1-5' },
    { form: 'TAM', csv_column_key: 'peou_3', google_form_question: 'The system workflow is clear.', response_type: 'Linear scale 1-5' },
    { form: 'TAM', csv_column_key: 'adopt', google_form_question: 'I would recommend using this system for knowledge-risk monitoring.', response_type: 'Linear scale 1-5' },
  ]);
});

router.post('/import/assessments', protect, requireRole('admin', 'hr_analyst'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    const parser = Readable.from(req.file.buffer).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));
    let imported = 0;
    const errors = [];
    const period = req.body.period || Assessment.getCurrentPeriod();
    
    for await (const row of parser) {
      try {
        const email = getEmail(row);
        if (!email) { errors.push('Row missing email'); continue; }
        let user = await User.findOne({ email });
        if (!user) { 
          const name = email.split('@')[0];
          const startDate = row['start_date'] || row['Start Date'] || row['startDate'] || new Date();
          user = await User.create({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            email: email,
            passwordHash: 'Demo1234',
            role: 'employee',
            department: row['department'] || 'General',
            startDate: new Date(startDate),
            managerId: null,
            isActive: true,
          });
        }

        const existing = await Assessment.findOne({ userId: user._id, period });
        if (existing) { errors.push(`${email}: already submitted for ${period}`); continue; }

        const mapped = mapGoogleAssessmentRow(row);
        const assessment = await Assessment.create({
          userId: user._id,
          managerId: user.managerId,
          period,
          selfScores: {
            expertiseUniqueness: mapped.expertiseUniqueness,
            documentationGap: mapped.documentationGap,
            projectCriticality: mapped.projectCriticality,
            collaborationDependency: mapped.collaborationDependency,
          },
          importedFromForms: true,
          quarterTag: mapped._metadata.quarterTag,
          responseBias: mapped._metadata.biasData || undefined,
          rawResponses: mapped._metadata.rawResponses,
        });
        await calculateAndSaveRiskScore(user._id, assessment._id);
        imported++;
      } catch (rowErr) {
        errors.push(`${getEmail(row) || 'row'}: ${rowErr.message}`);
      }
    }

    await ActivityLog.create({ userId: req.user._id, action: 'bulk_import', details: { type: 'assessments', imported, errors: errors.length } });
    res.json({ success: true, imported, skipped: errors.length, errors, period });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/import/manager-validations', protect, requireRole('admin', 'hr_analyst'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    const parser = Readable.from(req.file.buffer).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));
    let imported = 0;
    const errors = [];
    const period = req.body.period || Assessment.getCurrentPeriod();
    
    for await (const row of parser) {
      try {
        const email = getEmail(row);
        if (!email) { errors.push('Row missing employee email'); continue; }
        const user = await User.findOne({ email });
        if (!user) { errors.push(`${email}: user not found`); continue; }
        const assessment = await Assessment.findOne({ userId: user._id, period });
        if (!assessment) { errors.push(`${email}: no assessment found for ${period}`); continue; }

        const mapped = mapGoogleAssessmentRow(row);
        assessment.managerScores = {
          expertiseUniqueness: mapped.expertiseUniqueness,
          documentationGap: mapped.documentationGap,
          projectCriticality: mapped.projectCriticality,
          collaborationDependency: mapped.collaborationDependency,
        };
        assessment.managerValidated = true;
        assessment.managerValidatedAt = new Date();
        assessment.managerNotes = getValue(row, ['manager_notes', 'Manager notes for validation', 'notes']) || 'Imported from Google Forms manager validation CSV.';
        const managerEmail = getValue(row, ['manager_email', 'manager']);
        if (managerEmail) {
          const mgr = await User.findOne({ email: managerEmail });
          if (mgr) assessment.managerId = mgr._id;
        } else if (user.managerId) {
          assessment.managerId = user.managerId;
        }
        await assessment.save();
        await calculateAndSaveRiskScore(user._id, assessment._id);
        imported++;
      } catch (rowErr) {
        errors.push(`${getEmail(row) || 'row'}: ${rowErr.message}`);
      }
    }

    await ActivityLog.create({ userId: req.user._id, action: 'bulk_import', details: { type: 'manager_validations', imported, errors: errors.length } });
    res.json({ success: true, imported, skipped: errors.length, errors, period });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/import/surveys', protect, requireRole('admin', 'hr_analyst'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    const parser = Readable.from(req.file.buffer).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));
    let imported = 0;
    const errors = [];
    let isSUS = false;
    let firstRow = true;

    for await (const row of parser) {
      if (firstRow) {
        const keys = Object.keys(row || {}).map(k => k.toLowerCase());
        isSUS = keys.some(k => k.includes('sus_q1') || k.includes('sus q1'));
        firstRow = false;
      }
      
      try {
        const email = getEmail(row);
        const user = await User.findOne({ email });
        if (!user) { errors.push(`${email}: not found`); continue; }

        if (isSUS) {
          const responses = {};
          for (let j = 1; j <= 10; j++) {
            responses[`q${j}`] = surveyRating(getValue(row, [`sus_q${j}`, `sus q${j}`, `SUS Q${j}`])) || 3;
          }
          await ActivityLog.create({ userId: user._id, action: 'sus_submitted', details: { responses, importedFromForms: true } });
        } else {
          const responses = {
            pu1: surveyRating(getValue(row, ['pu_1', 'pu1'])) || 3,
            pu2: surveyRating(getValue(row, ['pu_2', 'pu2'])) || 3,
            pu3: surveyRating(getValue(row, ['pu_3', 'pu3'])) || 3,
            peou1: surveyRating(getValue(row, ['peou_1', 'peou1'])) || 3,
            peou2: surveyRating(getValue(row, ['peou_2', 'peou2'])) || 3,
            peou3: surveyRating(getValue(row, ['peou_3', 'peou3'])) || 3,
            adopt: surveyRating(getValue(row, ['adopt', 'adoption_intent'])) || 3,
          };
          await ActivityLog.create({ userId: user._id, action: 'tam_submitted', details: { responses, importedFromForms: true } });
        }
        imported++;
      } catch (rowErr) {
        errors.push(`${getEmail(row) || 'row'}: ${rowErr.message}`);
      }
    }
    res.json({ success: true, imported, skipped: errors.length, errors, type: isSUS ? 'SUS' : 'TAM' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/scores', protect, requireRole('admin', 'hr_analyst'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.startDate) filter.calculatedAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) filter.calculatedAt = { ...filter.calculatedAt, $lte: new Date(req.query.endDate) };
    const scores = await RiskScore.find(filter).populate('userId', 'name email department').sort({ calculatedAt: -1 });
    const rows = scores.map(s => ({
      employee_name: s.userId?.name,
      email: s.userId?.email,
      department: s.userId?.department,
      period: s.period,
      formula_score: s.formulaScore,
      ml_score: s.mlScore,
      manager_score: s.managerScore,
      final_score: s.finalScore,
      tier: s.tier,
      confidence: s.confidence,
      score_delta: s.scoreDelta,
      calculated_at: s.calculatedAt?.toISOString(),
    }));
    await ActivityLog.create({ userId: req.user._id, action: 'data_exported', details: { type: 'scores', count: rows.length } });
    csvResponse(res, 'kg_risk_scores.csv', rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/anonymised', protect, requireRole('researcher'), async (req, res) => {
  try {
    const scores = await RiskScore.find({}).populate('userId', 'name email department role startDate').sort({ calculatedAt: -1 });
    let counter = 1;
    const idMap = {};
    const rows = scores.map(s => {
      const uid = s.userId?._id?.toString();
      if (!idMap[uid]) idMap[uid] = `P${String(counter++).padStart(3, '0')}`;
      return {
        participant_id: idMap[uid],
        department: s.userId?.department,
        role: s.userId?.role,
        period: s.period,
        formula_score: s.formulaScore,
        ml_score: s.mlScore,
        manager_score: s.managerScore,
        final_score: s.finalScore,
        tier: s.tier,
        score_delta: s.scoreDelta,
      };
    });
    csvResponse(res, 'kg_anonymised_dataset.csv', rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/assessments', protect, requireRole('admin', 'hr_analyst'), async (req, res) => {
  try {
    const assessments = await Assessment.find({}).populate('userId', 'name email department').sort({ submittedAt: -1 });
    const rows = assessments.map(a => ({
      employee_name: a.userId?.name,
      email: a.userId?.email,
      department: a.userId?.department,
      period: a.period,
      source_channel: a.importedFromForms ? 'google_forms_csv' : 'in_app',
      self_eu: a.selfScores?.expertiseUniqueness,
      self_dg: a.selfScores?.documentationGap,
      self_pc: a.selfScores?.projectCriticality,
      self_cd: a.selfScores?.collaborationDependency,
      manager_eu: a.managerScores?.expertiseUniqueness || '',
      manager_dg: a.managerScores?.documentationGap || '',
      manager_pc: a.managerScores?.projectCriticality || '',
      manager_cd: a.managerScores?.collaborationDependency || '',
      manager_validated: a.managerValidated,
      submitted_at: a.submittedAt?.toISOString(),
    }));
    csvResponse(res, 'kg_assessments.csv', rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/sus', protect, requireRole('researcher'), async (req, res) => {
  try {
    const logs = await ActivityLog.find({ action: 'sus_submitted' }).populate('userId', 'name email role department').sort({ createdAt: -1 });
    const rows = logs.map(log => {
      const q = log.details?.responses || {};
      const oddSum = (q.q1 - 1) + (q.q3 - 1) + (q.q5 - 1) + (q.q7 - 1) + (q.q9 - 1);
      const evenSum = (5 - q.q2) + (5 - q.q4) + (5 - q.q6) + (5 - q.q8) + (5 - q.q10);
      return {
        participant_name: log.userId?.name,
        email: log.userId?.email,
        role: log.userId?.role,
        department: log.userId?.department,
        sus_q1: q.q1, sus_q2: q.q2, sus_q3: q.q3, sus_q4: q.q4, sus_q5: q.q5,
        sus_q6: q.q6, sus_q7: q.q7, sus_q8: q.q8, sus_q9: q.q9, sus_q10: q.q10,
        sus_score: parseFloat(((oddSum + evenSum) * 2.5).toFixed(1)),
        imported_from_forms: Boolean(log.details?.importedFromForms),
        submitted_at: log.createdAt?.toISOString(),
      };
    });
    csvResponse(res, 'kg_sus_responses.csv', rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export/tam', protect, requireRole('researcher'), async (req, res) => {
  try {
    const logs = await ActivityLog.find({ action: 'tam_submitted' }).populate('userId', 'name email role department').sort({ createdAt: -1 });
    const rows = logs.map(log => {
      const d = log.details?.responses || {};
      return {
        participant_name: log.userId?.name,
        email: log.userId?.email,
        role: log.userId?.role,
        department: log.userId?.department,
        pu_1: d.pu1,
        pu_2: d.pu2,
        pu_3: d.pu3,
        peou_1: d.peou1,
        peou_2: d.peou2,
        peou_3: d.peou3,
        adoption_intent: d.adopt,
        perceived_usefulness_avg: parseFloat((((d.pu1 || 3) + (d.pu2 || 3) + (d.pu3 || 3)) / 3).toFixed(2)),
        perceived_ease_of_use_avg: parseFloat((((d.peou1 || 3) + (d.peou2 || 3) + (d.peou3 || 3)) / 3).toFixed(2)),
        imported_from_forms: Boolean(log.details?.importedFromForms),
        submitted_at: log.createdAt?.toISOString(),
      };
    });
    csvResponse(res, 'kg_tam_responses.csv', rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/test-data/reset', protect, requireRole('researcher'), async (req, res) => {
  try {
    if (req.body.confirm !== 'DELETE_TEST_DATA') {
      return res.status(400).json({ success: false, message: 'Missing confirmation string.' });
    }

    const Alert = require('../models/Alert');
    const KTPlan = require('../models/KTPlan');
    const KTTask = require('../models/KTTask');
    const ImprovementAction = require('../models/ImprovementAction');
    const ActivityLog = require('../models/ActivityLog');

    const usersResult = await User.deleteMany({ role: { $nin: ['admin', 'researcher'] } });
    const assessmentsResult = await Assessment.deleteMany({});
    const scoresResult = await RiskScore.deleteMany({});

    await Alert?.deleteMany({});
    await KTPlan?.deleteMany({});
    await KTTask?.deleteMany({});
    await ImprovementAction?.deleteMany({});
    await ActivityLog?.deleteMany({});

    res.json({
      success: true,
      deleted: {
        users: usersResult.deletedCount,
        assessments: assessmentsResult.deletedCount,
        scores: scoresResult.deletedCount,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
