const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    // Who receives this alert
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Who the alert is about (the employee at risk, the task owner, etc.)
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Alert categories
    type: {
      type: String,
      enum: [
        'score_crossed_high',       // score went into High tier
        'score_crossed_critical',   // score went into Critical tier
        'score_spike',              // score jumped >2 points in one quarter
        'anomaly_detected',         // Isolation Forest flagged unusual pattern
        'assessment_overdue',       // employee has not submitted this quarter
        'kt_task_submitted',        // employee submitted evidence, needs manager review
        'kt_task_overdue',          // KT task passed its deadline
        'kt_session_unconfirmed',   // session not confirmed by backup after 48h
        'kt_plan_overdue',          // entire KT plan is overdue
        'kt_plan_complete',         // all KT tasks signed off
        'validation_needed',        // manager needs to validate assessment
        'general',                  // generic info alert
      ],
      required: true,
    },

    // Human-readable alert message
    message: { type: String, required: true },

    // Where the action button should link to
    actionUrl: { type: String, default: null },
    actionLabel: { type: String, default: 'View' },

    // Has the recipient seen/dismissed this alert?
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },

    // Was the alert resolved with a note?
    resolved: { type: Boolean, default: false },
    resolvedNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast unread count queries
alertSchema.index({ userId: 1, seen: 1 });
alertSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
