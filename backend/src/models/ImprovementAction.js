const mongoose = require('mongoose');

const improvementActionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source: {
      type: String,
      enum: ['ai_tip', 'manual'],
      default: 'ai_tip',
    },
    indicator: {
      type: String,
      enum: ['expertiseUniqueness', 'documentationGap', 'projectCriticality', 'collaborationDependency'],
      required: true,
    },
    tip: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    estimatedReduction: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'submitted', 'approved', 'rejected'],
      default: 'planned',
    },
    evidenceUrl: { type: String, default: '' },
    evidenceNotes: { type: String, default: '' },
    employeeNote: { type: String, default: '' },
    managerNote: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

improvementActionSchema.index({ employeeId: 1, createdAt: -1 });
improvementActionSchema.index({ managerId: 1, status: 1 });

module.exports = mongoose.model('ImprovementAction', improvementActionSchema);
