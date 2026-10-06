const mongoose = require('mongoose');

const ktPlanSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Manager ID is required'],
    },
    backupPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Backup person ID is required'],
    },

    // Knowledge areas selected by manager when creating the plan
    knowledgeAreas: [{ type: String, trim: true }],

    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },

    status: {
      type: String,
      enum: ['active', 'complete', 'overdue'],
      default: 'active',
    },

    priority: {
      type: String,
      enum: ['high', 'critical'],
      required: true,
    },

    // AI-generated interview questions (array of question strings)
    aiQuestions: [{ type: String }],

    // 0-100 percentage, recalculated after every task approval
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // Reminder tracking for overdue escalation
    remindersSent: { type: Number, default: 0 },
    lastReminderAt: { type: Date, default: null },

    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Virtual: days until deadline ────────────────────────────
ktPlanSchema.virtual('daysUntilDeadline').get(function () {
  return Math.ceil((new Date(this.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
});

// ─── Virtual: is overdue ──────────────────────────────────────
ktPlanSchema.virtual('isOverdue').get(function () {
  return this.status === 'active' && new Date(this.deadline) < new Date();
});

module.exports = mongoose.model('KTPlan', ktPlanSchema);
