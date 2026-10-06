const mongoose = require('mongoose');
const KTPlan = require('../models/KTPlan');
const KTTask = require('../models/KTTask');
const { updateScoreAfterKT } = require('./ktScoreUpdate');

function reject(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function signOffKTPlan(planId, actor) {
  // Plan state, task approval, assessment mitigation and risk persistence commit
  // together. Requires a transaction-capable MongoDB deployment (e.g. Atlas).
  return mongoose.connection.transaction(async session => {
    const plan = await KTPlan.findById(planId).session(session);
    if (!plan) reject(404, 'Plan not found');
    if (String(plan.managerId) !== String(actor._id) && !['admin', 'hr_analyst'].includes(actor.role)) {
      reject(403, 'Only the assigned manager can sign off');
    }
    if (plan.status === 'complete') reject(409, 'This KT plan is already complete; reductions cannot be applied again.');
    const tasks = await KTTask.find({ planId }).session(session);
    for (const type of ['documentation', 'shadowing', 'interview', 'validation', 'signoff']) {
      if (!tasks.some(task => task.type === type)) reject(400, `Cannot sign off: missing ${type} task.`);
    }
    if (tasks.some(task => task.type !== 'signoff' && !task.isDone)) {
      reject(400, 'Cannot sign off — not all tasks are complete. Check task statuses.');
    }
    const result = await updateScoreAfterKT(plan._id, { session });
    await KTTask.findOneAndUpdate(
      { planId: plan._id, type: 'signoff' },
      { status: 'approved', managerApproved: true, completedAt: new Date(), managerActedAt: new Date() },
      { session }
    );
    plan.status = 'complete';
    plan.completedAt = new Date();
    plan.completionPercentage = 100;
    await plan.save({ session });
    return { plan, result };
  });
}

module.exports = { signOffKTPlan };
