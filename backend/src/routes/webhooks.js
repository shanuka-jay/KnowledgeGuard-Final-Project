const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const { calculateAndSaveRiskScore } = require('../services/scoringEngine');
const { getEmail, mapGoogleAssessmentRow } = require('../utils/googleFormsParser');

/**
 * POST /api/webhooks/google-form
 * Handles automated submission from Google Forms Apps Script.
 */
router.post('/google-form', async (req, res) => {
  try {
    const data = req.body;
    const email = getEmail(data);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Missing email in submission' });
    }

    let user = await User.findOne({ email });

    // Auto-create user if they don't exist
    if (!user) {
      const name = email.split('@')[0];
      const startDate = data['start_date'] || data['Start Date'] || data['startDate'] || new Date();
      
      // Set a standard default password for the demo instead of a random one
      const tempPassword = 'Demo1234';

      user = await User.create({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email,
        passwordHash: tempPassword,
        role: 'employee',
        department: 'General',
        startDate: new Date(startDate),
        managerId: null, // Left blank for manual assignment in Admin panel
        isActive: true,
      });

      console.log(`Webhook: Auto-created new employee account for ${email}`);
    }

    const period = data.period || Assessment.getCurrentPeriod();

    // Map Google form answers to risk indicators
    const mapped = mapGoogleAssessmentRow(data);
    const selfScores = {
      expertiseUniqueness: mapped.expertiseUniqueness,
      documentationGap: mapped.documentationGap,
      projectCriticality: mapped.projectCriticality,
      collaborationDependency: mapped.collaborationDependency,
    };

    let assessment = await Assessment.findOne({ userId: user._id, period });

    if (assessment) {
      // Overwrite existing assessment to allow testing and resubmissions
      assessment.selfScores = selfScores;
      assessment.importedFromForms = true;
      assessment.quarterTag = mapped._metadata.quarterTag;
      assessment.responseBias = mapped._metadata.biasData || undefined;
      assessment.rawResponses = mapped._metadata.rawResponses;
      await assessment.save();
      console.log(`Webhook: Updated existing assessment for ${email} (${period})`);
    } else {
      // Create new assessment
      assessment = await Assessment.create({
        userId: user._id,
        managerId: user.managerId,
        period: period,
        selfScores: selfScores,
        importedFromForms: true,
        quarterTag: mapped._metadata.quarterTag,
        responseBias: mapped._metadata.biasData || undefined,
        rawResponses: mapped._metadata.rawResponses,
      });
      console.log(`Webhook: Created new assessment for ${email} (${period})`);
    }

    // Run the risk score engine
    await calculateAndSaveRiskScore(user._id, assessment._id);

    console.log(`Webhook: Successfully processed assessment for ${email}`);
    res.status(200).json({ success: true, message: 'Assessment processed successfully' });

  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
