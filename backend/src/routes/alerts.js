const express = require('express');
const router  = express.Router();
const Alert   = require('../models/Alert');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.seen !== undefined) filter.seen = req.query.seen === 'true';
    if (req.query.type) filter.type = req.query.type;
    const alerts = await Alert.find(filter).populate('targetUserId','name email').sort({ createdAt: -1 }).limit(parseInt(req.query.limit)||50);
    const unreadCount = await Alert.countDocuments({ userId: req.user._id, seen: false });
    res.json({ success: true, alerts, unreadCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/mark-all-seen', protect, async (req, res) => {
  try {
    await Alert.updateMany({ userId: req.user._id, seen: false }, { seen: true, seenAt: new Date() });
    res.json({ success: true, message: 'All alerts marked as seen' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/seen', protect, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { seen: true, seenAt: new Date() }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { resolved: true, resolvedNote: req.body.note||'', resolvedAt: new Date(), seen: true }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/clear', protect, async (req, res) => {
  try {
    await Alert.deleteMany({ userId: req.user._id, seen: true });
    res.json({ success: true, message: 'Cleared all seen alerts' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/assessment-reminders/run', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr_analyst') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { runAssessmentReminders, runValidationChasers } = require('../jobs/assessmentReminder');
    const { runKTOverdueCheck } = require('../jobs/ktOverdueCheck');
    
    const result = await runAssessmentReminders();
    const chaserResult = await runValidationChasers();
    await runKTOverdueCheck();

    const count = (result?.employeeNotices || 0) + (result?.managerSummaries || 0) + (chaserResult?.validationChasers || 0);

    res.json({ 
      success: true, 
      count,
      employeeNotices: result?.employeeNotices || 0,
      managerSummaries: result?.managerSummaries || 0,
      validationChasers: chaserResult?.validationChasers || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
