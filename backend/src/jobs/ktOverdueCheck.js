const KTPlan = require('../models/KTPlan');
const KTTask = require('../models/KTTask');
const User = require('../models/User');
const { sendKTTaskReminder } = require('../services/emailService');

async function runKTOverdueCheck() {
  try {
    const now = new Date();
    let escalated = 0;

    // Find all active KT plans where deadline has passed
    const overduePlans = await KTPlan.find({
      status: 'active',
      deadline: { $lt: now },
    }).populate('employeeId managerId backupPersonId');

    for (const plan of overduePlans) {
      // Update plan status to overdue
      plan.status = 'overdue';
      await plan.save();

      const daysOverdue = Math.floor((now - new Date(plan.deadline)) / (1000 * 60 * 60 * 24));

      // Find incomplete tasks for this plan
      const incompleteTasks = await KTTask.find({
        planId: plan._id,
        status: { $in: ['pending', 'submitted', 'rejected'] },
      });

      for (const task of incompleteTasks) {
        // Mark task as overdue
        task.status = 'overdue';
        await task.save();

        // Escalating reminders based on days overdue
        if (daysOverdue >= 1 && task.reminderCount === 0) {
          // Day 1 — remind employee
          if (plan.employeeId) {
            await sendKTTaskReminder(
              plan.employeeId.email,
              plan.employeeId.name,
              task.title,
              daysOverdue
            );
          }
          task.reminderCount = 1;
          task.lastReminderAt = now;
          await task.save();
          escalated++;
        }

        if (daysOverdue >= 3 && task.reminderCount === 1) {
          // Day 3 — remind employee again + manager
          if (plan.managerId) {
            await sendKTTaskReminder(
              plan.managerId.email,
              plan.managerId.name,
              task.title,
              daysOverdue
            );
          }
          task.reminderCount = 2;
          task.lastReminderAt = now;
          await task.save();
          escalated++;
        }
      }
    }

    // Check pending session confirmations (backup did not confirm in 48h)
    const unconfirmedSessions = await KTTask.find({
      type: { $in: ['shadowing', 'interview'] },
      status: { $in: ['pending', 'submitted'] },
      employeeConfirmed: true,
      backupConfirmed: false,
      employeeConfirmedAt: { $lt: new Date(now - 48 * 60 * 60 * 1000) },
    }).populate({ path: 'planId', populate: { path: 'employeeId backupPersonId' } });

    for (const task of unconfirmedSessions) {
      if (task.planId?.backupPersonId) {
        await sendKTTaskReminder(
          task.planId.backupPersonId.email,
          task.planId.backupPersonId.name,
          task.title,
          0
        );
        task.reminderCount = (task.reminderCount || 0) + 1;
        await task.save();
        escalated++;
      }
    }

    console.log(`✅ KT overdue check complete — ${escalated} escalations sent`);
  } catch (err) {
    console.error('KT overdue check error:', err.message);
  }
}

module.exports = { runKTOverdueCheck };
