const express = require('express');
const router  = express.Router();
const PDFDocument = require('pdfkit');
const User      = require('../models/User');
const RiskScore = require('../models/RiskScore');
const KTPlan    = require('../models/KTPlan');
const { protect, requireRole } = require('../middleware/auth');
const { describeAIError } = require('../utils/aiErrors');
const {
  explainRisk,
  generateKTQuestions,
  generateSuggestions,
  chatWithTeamData,
  chatWithTeamDataStream,
  generateReport,
} = require('../services/aiService');

function cleanReportText(text) {
  return String(text || '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\|/g, '  ')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// POST /api/ai/explain
router.post('/explain', protect, requireRole('manager','admin','hr_analyst'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const employee  = await User.findById(userId);
    const riskScore = await RiskScore.findOne({ userId }).sort({ period: -1, calculatedAt: -1 });
    if (!employee || !riskScore) return res.status(404).json({ success: false, message: 'Not found' });
    const explanation = await explainRisk(employee, riskScore);
    res.json({ success: true, explanation });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/ai/kt-questions
router.post('/kt-questions', protect, requireRole('manager','admin'), async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId required' });
    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const questions = await generateKTQuestions(employee);
    res.json({ success: true, questions, count: questions.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/ai/suggestions
router.post('/suggestions', protect, async (req, res) => {
  try {
    const targetId = req.body.userId || req.user._id;
    if (req.user.role === 'employee' && targetId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const employee  = await User.findById(targetId);
    const riskScore = await RiskScore.findOne({ userId: targetId }).sort({ period: -1, calculatedAt: -1 });
    if (!employee || !riskScore) return res.status(404).json({ success: false, message: 'Not found' });
    const suggestions = await generateSuggestions(employee, riskScore);
    res.json({ success: true, suggestions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/ai/chat
router.post('/chat', protect, requireRole('manager','admin'), async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array required' });
    }
    
    let teamQuery = {};
    if (req.user.role === 'manager') teamQuery.managerId = req.user._id;
    const team = await User.find({ ...teamQuery, role: 'employee', isActive: true });
    const teamWithScores = await Promise.all(team.map(async (m) => {
      const score = await RiskScore.findOne({ userId: m._id }).sort({ period: -1, calculatedAt: -1 });
      return { ...m.toPublicJSON(), riskScore: score };
    }));
    
    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const stream = await chatWithTeamDataStream(messages, teamWithScores);
    
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        // We write the chunk out. Using standard SSE data format
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const failure = describeAIError(err);
    // Log only classification, never credentials, provider bodies or team prompts.
    console.warn('AI chat failed:', failure.code, 'provider status:', err.status || 'unavailable');
    if (!res.headersSent) {
      res.status(failure.status).json({ success: false, code: failure.code, message: failure.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: failure.message, code: failure.code })}\n\n`);
      res.end();
    }
  }
});

// POST /api/ai/report  — generates PDF
router.post('/report', protect, requireRole('manager','admin'), async (req, res) => {
  try {
    let teamQuery = {};
    if (req.user.role === 'manager') teamQuery.managerId = req.user._id;
    const team = await User.find({ ...teamQuery, role: 'employee', isActive: true });
    const teamWithScores = await Promise.all(team.map(async (m) => {
      const score = await RiskScore.findOne({ userId: m._id }).sort({ period: -1, calculatedAt: -1 });
      return { ...m.toPublicJSON(), riskScore: score };
    }));
    let ktQuery = {};
    if (req.user.role === 'manager') ktQuery.managerId = req.user._id;
    const [active, complete, overdue] = await Promise.all([
      KTPlan.countDocuments({ ...ktQuery, status: 'active' }),
      KTPlan.countDocuments({ ...ktQuery, status: 'complete' }),
      KTPlan.countDocuments({ ...ktQuery, status: 'overdue' }),
    ]);
    let reportText = '';
    try {
      reportText = await generateReport(teamWithScores, { active, complete, overdue });
    } catch (aiErr) {
      reportText = 'AI-written summary was not generated. The structured report below uses current system data.';
    }
    reportText = cleanReportText(reportText);

    const critical = teamWithScores.filter(m => m.riskScore?.tier === 'critical');
    const high = teamWithScores.filter(m => m.riskScore?.tier === 'high');
    const avgScore = teamWithScores.reduce((sum, m) => sum + (m.riskScore?.finalScore || 0), 0) / (teamWithScores.length || 1);
    const priorityRows = teamWithScores
      .filter(m => ['critical', 'high'].includes(m.riskScore?.tier))
      .sort((a, b) => (b.riskScore?.finalScore || 0) - (a.riskScore?.finalScore || 0));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KG_Report_${new Date().toISOString().slice(0,10)}.pdf"`);
    const doc = new PDFDocument({ margin: 42, size: 'A4' });
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 92).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('KnowledgeGuard', 42, 28);
    doc.fillColor('#93c5fd').fontSize(11).font('Helvetica').text('Knowledge Risk Management Report', 42, 56);
    doc.fillColor('#cbd5e1').fontSize(9).text(`Generated: ${new Date().toLocaleDateString()} | Manager: ${req.user.name}`, 360, 34, { align: 'right', width: 190 });

    let y = 120;
    const card = (x, title, value, color = '#1E3A5F') => {
      doc.roundedRect(x, y, 118, 62, 8).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 12, y + 13);
      doc.fillColor(color).fontSize(20).font('Helvetica-Bold').text(value, x + 12, y + 30);
    };
    card(42, 'Team size', String(teamWithScores.length));
    card(172, 'Average score', avgScore.toFixed(1));
    card(302, 'Critical', String(critical.length), '#dc2626');
    card(432, 'High risk', String(high.length), '#ea580c');

    y += 95;
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Executive Summary', 42, y);
    y += 22;
    doc.fillColor('#334155').fontSize(10).font('Helvetica').text(reportText, 42, y, { width: 510, lineGap: 4 });
    y = doc.y + 24;

    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Priority Employees', 42, y);
    y += 24;
    doc.fillColor('#f1f5f9').rect(42, y, 510, 24).fill();
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Employee', 54, y + 8);
    doc.text('Department', 210, y + 8);
    doc.text('Score', 342, y + 8);
    doc.text('Tier', 430, y + 8);
    y += 24;

    if (priorityRows.length === 0) {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('No high or critical risk employees at this time.', 54, y + 10);
      y += 32;
    } else {
      priorityRows.forEach(row => {
        if (y > 710) { doc.addPage(); y = 56; }
        doc.fillColor('#ffffff').rect(42, y, 510, 30).fill();
        doc.strokeColor('#e2e8f0').moveTo(42, y + 30).lineTo(552, y + 30).stroke();
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica');
        doc.text(row.name, 54, y + 10, { width: 140 });
        doc.text(row.department || '-', 210, y + 10, { width: 115 });
        doc.font('Helvetica-Bold').text((row.riskScore?.finalScore || 0).toFixed(1), 342, y + 10);
        doc.fillColor(row.riskScore?.tier === 'critical' ? '#dc2626' : '#ea580c').text(row.riskScore?.tier || '-', 430, y + 10);
        y += 30;
      });
    }

    y += 22;
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Knowledge Transfer Status', 42, y);
    y += 22;
    doc.fillColor('#334155').fontSize(10).font('Helvetica')
      .text(`Active KT plans: ${active}`, 54, y)
      .text(`Completed KT plans: ${complete}`, 54, y + 16)
      .text(`Overdue KT plans: ${overdue}`, 54, y + 32);

    y += 70;
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Immediate Recommendations', 42, y);
    y += 22;
    [
      'Start or review KT plans for every critical-risk employee.',
      'Require documentation evidence for knowledge areas with high dependency.',
      'Assign backup persons and validate competence before sign-off.',
      'Repeat manager validation after major project or staffing changes.',
    ].forEach(item => {
      doc.fillColor('#334155').fontSize(10).font('Helvetica').text(`- ${item}`, 54, y, { width: 480 });
      y += 16;
    });

    doc.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
