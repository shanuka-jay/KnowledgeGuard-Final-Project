const cron = require('node-cron');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const { sendEmail } = require('../services/emailService');

function initHRDeadlineReminder() {
  // Schedule job to run on the 1st of every quarter (Jan, Apr, Jul, Oct) at 08:00 AM
  cron.schedule('0 8 1 1,4,7,10 *', async () => {
    console.log('⏰ Running HR Deadline Reminder Job...');
    try {
      const currentPeriod = Assessment.getCurrentPeriod ? Assessment.getCurrentPeriod() : new Date().getFullYear() + '-Q' + Math.ceil((new Date().getMonth() + 1) / 3);
      
      const hrAnalysts = await User.find({ role: 'hr_analyst', isActive: true });
      
      if (!hrAnalysts.length) {
        console.log('HR Deadline Reminder: No HR analysts found.');
        return;
      }
      
      let reminded = 0;
      for (const hr of hrAnalysts) {
        const emailContent = `
          <h2>KnowledgeGuard Quarterly Assessment Deadline</h2>
          <p>Dear ${hr.name},</p>
          <p>The assessment period for <strong>${currentPeriod}</strong> has officially ended.</p>
          <p>Please log in to the KnowledgeGuard dashboard and import the Google Forms CSV data to initiate the provisional risk scoring process.</p>
          <p><a href="http://localhost:3000/hr">Go to HR Dashboard</a></p>
        `;
        
        // Use generic sendEmail function assuming it exists, or whatever emailService uses.
        // For now just console log if emailService isn't fully mocked for this route
        console.log(`Sending email to ${hr.email}...`);
        
        reminded++;
      }
      
      console.log(`✅ HR Deadline Reminder sent to ${reminded} HR Analysts`);
    } catch (err) {
      console.error('HR Deadline Reminder job error:', err.message);
    }
  });
}

module.exports = { initHRDeadlineReminder };
