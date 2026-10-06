const User = require('../models/User');
const Assessment = require('../models/Assessment');
const { sendAssessmentReminder, sendValidationChaser } = require('../services/emailService');

async function runAssessmentReminders() {
  try {
    const currentPeriod = Assessment.getCurrentPeriod();

    // Find all active employees
    const employees = await User.find({ role: 'employee', isActive: true });

    let reminded = 0;

    for (const employee of employees) {
      // Check if they have submitted this period
      const existing = await Assessment.findOne({
        userId: employee._id,
        period: currentPeriod,
      });

      if (!existing) {
        // Send reminder email
        await sendAssessmentReminder(employee.email, employee.name, currentPeriod);
        reminded++;
      }
    }

    console.log(`✅ Assessment reminders sent: ${reminded} employees`);
    return { employeeNotices: reminded, managerSummaries: 0 };
  } catch (err) {
    console.error('Assessment reminder job error:', err.message);
    throw err;
  }
}

async function runValidationChasers() {
  try {
    const currentPeriod = Assessment.getCurrentPeriod();
    
    // Find all assessments for the current period that have NOT been validated
    const unvalidated = await Assessment.find({
      period: currentPeriod,
      managerValidated: false,
    });

    if (!unvalidated.length) {
      console.log(`✅ Manager Validation Chasers: 0 managers require reminders`);
      return { validationChasers: 0 };
    }

    // Group by managerId
    const pendingByManager = {};
    for (const doc of unvalidated) {
      const mId = doc.managerId?.toString();
      if (!mId) continue;
      if (!pendingByManager[mId]) {
        pendingByManager[mId] = 0;
      }
      pendingByManager[mId]++;
    }

    let chasersSent = 0;

    for (const [managerId, count] of Object.entries(pendingByManager)) {
      const manager = await User.findById(managerId);
      if (manager && manager.email) {
        await sendValidationChaser(manager.email, manager.name, count);
        chasersSent++;
      }
    }

    console.log(`✅ Manager Validation Chasers sent to ${chasersSent} managers`);
    return { validationChasers: chasersSent };
  } catch (err) {
    console.error('Manager Validation Chaser error:', err.message);
    throw err;
  }
}

module.exports = { runAssessmentReminders, runValidationChasers };
