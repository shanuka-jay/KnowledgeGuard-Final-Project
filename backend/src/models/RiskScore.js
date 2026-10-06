const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
    },
    period: {
      type: String,
      required: true,
    },

    // The three independent scores
    formulaScore: { type: Number, min: 0, max: 10, default: 0 },
    mlScore:      { type: Number, min: 0, max: 10, default: 0 },
    managerScore: { type: Number, min: 0, max: 10, default: 0 },

    // The weighted final score
    // Validated: self*0.30 + manager*0.50 + ml*0.20
    // Preliminary: self*0.70 + ml*0.30
    finalScore: { type: Number, min: 0, max: 10, default: 0 },

    tier: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },

    // How much we trust this score
    // high = self and manager agree (within 1.5 pts)
    // medium = minor disagreement
    // low = significant disagreement
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },

    // Individual indicator values used in this calculation
    breakdown: {
      expertiseUniqueness:     { type: Number, default: 0 },
      documentationGap:        { type: Number, default: 0 },
      projectCriticality:      { type: Number, default: 0 },
      collaborationDependency: { type: Number, default: 0 },
      tenure:                  { type: Number, default: 0 },
    },

    // Change tracking
    previousScore: { type: Number, default: null },
    scoreDelta:    { type: Number, default: 0 }, // positive = got worse, negative = improved

    // Set to true by anomaly detection (Isolation Forest)
    anomalyFlag: { type: Boolean, default: false },

    // Transparent KT mitigation details copied from the assessment.
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
      before: {
        expertiseUniqueness: { type: Number, default: 0 },
        documentationGap: { type: Number, default: 0 },
        projectCriticality: { type: Number, default: 0 },
        collaborationDependency: { type: Number, default: 0 },
      },
      after: {
        expertiseUniqueness: { type: Number, default: 0 },
        documentationGap: { type: Number, default: 0 },
        projectCriticality: { type: Number, default: 0 },
        collaborationDependency: { type: Number, default: 0 },
      },
    },

    calculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
riskScoreSchema.index({ userId: 1, period: -1 });
riskScoreSchema.index({ tier: 1 });

// ─── Virtual: tier label for display ─────────────────────────
riskScoreSchema.virtual('tierLabel').get(function () {
  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  return labels[this.tier] || 'Unknown';
});

// ─── Virtual: tier colour for UI ─────────────────────────────
riskScoreSchema.virtual('tierColor').get(function () {
  const colors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[this.tier] || '#gray';
});

module.exports = mongoose.model('RiskScore', riskScoreSchema);
