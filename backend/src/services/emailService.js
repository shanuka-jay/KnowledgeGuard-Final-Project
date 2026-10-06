const nodemailer = require('nodemailer');

// ─── Create transporter ───────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Gmail App Password (not your real password)
  },
});

// ─── Verify connection on startup ─────────────────────────────
if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
  transporter.verify((err) => {
    if (err) {
      console.warn('⚠️  Email service not connected:', err.message);
      console.warn('   Check GMAIL_USER and GMAIL_PASS in .env');
    } else {
      console.log('✅ Email service ready');
    }
  });
} else {
  console.log('ℹ️  Email service skipped (no credentials provided in .env)');
}

// ─── Base email template ──────────────────────────────────────
function emailTemplate(title, body, actionUrl = null, actionLabel = null) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1E3A5F; padding: 24px 32px; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .header p { color: #8faecf; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .body h2 { color: #1E3A5F; margin-top: 0; }
    .button { display: inline-block; background: #2E6DA4; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .footer { background: #f5f5f5; padding: 16px 32px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KnowledgeGuard 3.0</h1>
      <p>Knowledge Loss Risk Assessment System</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
      ${actionUrl ? `<a href="${process.env.FRONTEND_URL}${actionUrl}" class="button">${actionLabel || 'View Now'}</a>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated message from KnowledgeGuard. Do not reply to this email.</p>
      <p>For research purposes only — University Research Project 2025-2026</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ─── Send email helper ────────────────────────────────────────
async function sendEmail({ to, subject, title, body, actionUrl, actionLabel }) {
  try {
    await transporter.sendMail({
      from: `"KnowledgeGuard" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: emailTemplate(title, body, actionUrl, actionLabel),
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`📧 Email failed to ${to}:`, err.message);
    return false;
  }
}

// ─── Specific email functions ─────────────────────────────────

async function sendCriticalRiskAlert(managerEmail, managerName, employeeName, score) {
  return sendEmail({
    to: managerEmail,
    subject: `⚠️ Critical Knowledge Risk: ${employeeName}`,
    title: `Critical Risk Alert — ${employeeName}`,
    body: `
      <p>Dear ${managerName},</p>
      <p><strong>${employeeName}</strong> has been classified as <strong>Critical Risk</strong> with a knowledge loss risk score of <strong>${score.toFixed(1)}/10</strong>.</p>
      <p>This means their departure would cause significant knowledge loss to the organisation. Immediate action is recommended:</p>
      <ul>
        <li>Review their knowledge profile</li>
        <li>Initiate a Knowledge Transfer plan</li>
        <li>Identify a backup person for their key knowledge areas</li>
      </ul>
      <p>Please log in to KnowledgeGuard to take action.</p>
    `,
    actionUrl: '/manager',
    actionLabel: 'View Dashboard',
  });
}

async function sendHighRiskAlert(managerEmail, managerName, employeeName, score) {
  return sendEmail({
    to: managerEmail,
    subject: `⚠️ High Knowledge Risk: ${employeeName}`,
    title: `High Risk Alert — ${employeeName}`,
    body: `
      <p>Dear ${managerName},</p>
      <p><strong>${employeeName}</strong> has entered the <strong>High Risk</strong> tier with a score of <strong>${score.toFixed(1)}/10</strong>.</p>
      <p>Please log in to KnowledgeGuard to review their profile and consider starting a Knowledge Transfer plan.</p>
    `,
    actionUrl: '/manager',
    actionLabel: 'View Team',
  });
}

async function sendAssessmentReminder(employeeEmail, employeeName, period) {
  return sendEmail({
    to: employeeEmail,
    subject: `Reminder: Your knowledge assessment is due (${period})`,
    title: 'Your Quarterly Assessment is Due',
    body: `
      <p>Dear ${employeeName},</p>
      <p>Your quarterly knowledge self-assessment for <strong>${period}</strong> is now due.</p>
      <p>The assessment takes approximately 3 minutes to complete. Your honest responses help your organisation plan knowledge retention effectively.</p>
      <p>Your individual scores are <strong>never shared with your manager</strong> — only aggregate data is used.</p>
    `,
    actionUrl: '/employee/assessment',
    actionLabel: 'Complete Assessment',
  });
}

async function sendKTTaskReminder(recipientEmail, recipientName, taskTitle, daysOverdue) {
  return sendEmail({
    to: recipientEmail,
    subject: `Reminder: KT Task overdue — ${taskTitle}`,
    title: 'Knowledge Transfer Task Reminder',
    body: `
      <p>Dear ${recipientName},</p>
      <p>The following Knowledge Transfer task is <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>:</p>
      <p><strong>"${taskTitle}"</strong></p>
      <p>Please log in to KnowledgeGuard to complete or update this task.</p>
    `,
    actionUrl: '/employee/kt-sessions',
    actionLabel: 'View KT Sessions',
  });
}

async function sendPasswordResetEmail(email, name, resetToken) {
  return sendEmail({
    to: email,
    subject: 'Reset your KnowledgeGuard password',
    title: 'Password Reset Request',
    body: `
      <p>Dear ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
    actionUrl: `/reset-password?token=${resetToken}`,
    actionLabel: 'Reset Password',
  });
}

async function sendWelcomeEmail(email, name, role, tempPassword) {
  return sendEmail({
    to: email,
    subject: 'Welcome to KnowledgeGuard — Your account is ready',
    title: `Welcome to KnowledgeGuard, ${name}!`,
    body: `
      <p>Your account has been created. Here are your login details:</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Email:</td><td style="padding: 8px 0; font-weight: bold;">${email}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Temporary password:</td><td style="padding: 8px 0; font-weight: bold;">${tempPassword}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Your role:</td><td style="padding: 8px 0; font-weight: bold;">${role}</td></tr>
      </table>
      <p>Please log in and change your password immediately.</p>
      <p><em>Note: You will be asked to provide research consent on your first login.</em></p>
    `,
    actionUrl: '/login',
    actionLabel: 'Log In Now',
  });
}

async function sendAnomalyAlert(hrEmail, employeeName) {
  return sendEmail({
    to: hrEmail,
    subject: `🚨 ML Anomaly Detected: Unusual Risk Pattern for ${employeeName}`,
    title: `ML Anomaly Detected`,
    body: `
      <p>Dear HR / Admin,</p>
      <p>The Isolation Forest Machine Learning algorithm has flagged an anomaly in the knowledge risk score history for <strong>${employeeName}</strong>.</p>
      <p>This means their recent self-assessment pattern is highly unusual compared to their historical baseline. This could indicate taking on undocumented core responsibilities, or sudden knowledge hoarding.</p>
      <p>Please investigate immediately.</p>
    `,
    actionUrl: `/hr`,
    actionLabel: 'View Dashboard',
  });
}

async function sendTaskReadyForReviewAlert(managerEmail, managerName, employeeName, taskTitle) {
  return sendEmail({
    to: managerEmail,
    subject: `✅ KT Task Evidence Submitted by ${employeeName}`,
    title: `Knowledge Transfer Task Ready for Review`,
    body: `
      <p>Dear ${managerName},</p>
      <p><strong>${employeeName}</strong> has submitted evidence for the Knowledge Transfer task: <strong>"${taskTitle}"</strong>.</p>
      <p>Please log in to review the evidence and approve the task. Approving this task will formally reduce the employee's knowledge loss risk score.</p>
    `,
    actionUrl: `/manager/kt-plans`,
    actionLabel: 'Review Evidence',
  });
}

async function sendValidationChaser(managerEmail, managerName, pendingCount) {
  return sendEmail({
    to: managerEmail,
    subject: `Action Required: You have ${pendingCount} pending risk assessments to validate`,
    title: `Manager Validation Required`,
    body: `
      <p>Dear ${managerName},</p>
      <p>Your team has completed their quarterly knowledge self-assessments. There are currently <strong>${pendingCount}</strong> assessments pending your validation.</p>
      <p>Your managerial input is a critical part of the Risk Scoring Engine. Please log in and provide your validations as soon as possible.</p>
    `,
    actionUrl: `/manager/employees`,
    actionLabel: 'Validate Scores',
  });
}

async function sendAssessmentValidatedEmail(employeeEmail, employeeName, managerName, finalScore, tier) {
  return sendEmail({
    to: employeeEmail,
    subject: `Your Knowledge Risk Assessment was Validated by ${managerName}`,
    title: `Assessment Validated`,
    body: `
      <p>Dear ${employeeName},</p>
      <p>Your manager, <strong>${managerName}</strong>, has reviewed and validated your recent Knowledge Risk Self-Assessment.</p>
      <p>Your finalized knowledge loss risk score is <strong>${finalScore.toFixed(1)}/10</strong>, placing you in the <strong>${tier.toUpperCase()}</strong> tier.</p>
    `,
    actionUrl: `/dashboard`,
    actionLabel: 'View Dashboard',
  });
}

async function sendRiskTierChangedEmail(employeeEmail, employeeName, oldTier, newTier, finalScore) {
  return sendEmail({
    to: employeeEmail,
    subject: `Notice: Your Risk Tier has changed to ${newTier.toUpperCase()}`,
    title: `Risk Tier Change`,
    body: `
      <p>Dear ${employeeName},</p>
      <p>This is an automated notification to inform you that your Knowledge Loss Risk Tier has changed from <strong>${oldTier.toUpperCase()}</strong> to <strong>${newTier.toUpperCase()}</strong>.</p>
      <p>Your current risk score is <strong>${finalScore.toFixed(1)}/10</strong>.</p>
      <p>If you have moved to a higher tier, your manager may reach out to initiate a Knowledge Transfer (KT) Plan.</p>
    `,
    actionUrl: `/dashboard`,
    actionLabel: 'View Dashboard',
  });
}

module.exports = {
  sendEmail,
  sendCriticalRiskAlert,
  sendHighRiskAlert,
  sendAssessmentReminder,
  sendKTTaskReminder,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAnomalyAlert,
  sendTaskReadyForReviewAlert,
  sendValidationChaser,
  sendAssessmentValidatedEmail,
  sendRiskTierChangedEmail,
};
