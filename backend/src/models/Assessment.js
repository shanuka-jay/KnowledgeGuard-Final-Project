const mongoose = require('mongoose');

// Reusable sub-schema for the 5 indicator scores
const indicatorScoresSchema = new mongoose.Schema(
  {
    expertiseUniqueness:     { type: Number, min: 1, max: 10 },
    documentationGap:        { type: Number, min: 1, max: 10 },
    projectCriticality:      { type: Number, min: 1, max: 10 },
    collaborationDependency: { type: Number, min: 1, max: 10 },
    // tenure is NOT stored here — calculated from user.startDate automatically
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // e.g. "2025-Q2" — prevents duplicate submissions per quarter
    period: {
      type: String,
      required: [true, 'Period is required'],
      match: [/^\d{4}-Q[1-4]$/, 'Period must be in format YYYY-Q# (e.g. 2025-Q2)'],
    },

    // Scores entered by the employee themselves
    selfScores: indicatorScoresSchema,

    // Scores entered independently by the manager
    managerScores: indicatorScoresSchema,

    managerValidated: { type: Boolean, default: false },
    managerValidatedAt: { type: Date, default: null },
    managerNotes: { type: String, default: '' },

    // Was this imported from Google Forms CSV?
    importedFromForms: { type: Boolean, default: false },

    // The quarter formulation used (e.g. 'Q1', 'Q2', 'Q3', 'Q4', 'universal')
    quarterTag: { type: String, default: 'universal' },

    // Object storing the raw JSON responses for academic validation
    rawResponses: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Response bias analysis data
    responseBias: {
      biasScore: { type: Number, default: 0 },
      inconsistencyScore: { type: Number, default: 0 },
      straightLining: { type: Boolean, default: false },
      biasFlags: [{ type: String }],
      confidenceDiscount: { type: Number, default: 0 }
    },

    // KT mitigation audit trail applied after manager sign-off.
    ktAppliedPlanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KTPlan' }],
    ktImpact: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'KTPlan', default: null },
      appliedAt: { type: Date, default: null },
      documentationReduction: { type: Number, default: 0 },
      expertiseReduction: { type: Number, default: 0 },
      collaborationReduction: { type: Number, default: 0 },
      projectCriticalityMitigated: { type: Boolean, default: false },
      projectCriticalityNote: { type: String, default: '' },
      validationOutcome: { type: String, default: '' },
      validationLabel: { type: String, default: '' },
      before: indicatorScoresSchema,
      after: indicatorScoresSchema,
    },

    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate submissions — one per user per period
assessmentSchema.index({ userId: 1, period: 1 }, { unique: true });

// ─── Static: get current period string ───────────────────────
assessmentSchema.statics.getCurrentPeriod = function () {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${year}-Q${quarter}`;
};

module.exports = mongoose.model('Assessment', assessmentSchema);
