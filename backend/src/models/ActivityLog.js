const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    action: {
      type: String,
      enum: [
        // Auth events
        'login',
        'logout',
        'password_reset',
        'password_changed',
        'consent_given',
        'consent_withdrawn',

        // Assessment events
        'assessment_submitted',
        'assessment_validated',
        'score_calculated',

        // KT events
        'kt_plan_created',
        'kt_plan_updated',
        'kt_plan_deleted',
        'kt_task_submitted',
        'kt_task_approved',
        'kt_task_rejected',
        'kt_session_confirmed',
        'kt_plan_signed_off',

        // AI improvement action events
        'improvement_action_started',
        'improvement_evidence_submitted',
        'improvement_action_approved',
        'improvement_action_rejected',

        // Admin events
        'user_created',
        'user_updated',
        'user_deactivated',
        'profile_photo_updated',
        'profile_photo_removed',
        'bulk_import',
        'data_exported',
        'ml_trained',
        'ahp_weights_applied',
        'ahp_weights_rolled_back',

        // Survey events
        'sus_submitted',
        'tam_submitted',
      ],
      required: true,
    },

    // Extra details about the action (flexible object)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // For security auditing
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true, // createdAt is the event timestamp
  }
);

// Index for admin activity feed queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
