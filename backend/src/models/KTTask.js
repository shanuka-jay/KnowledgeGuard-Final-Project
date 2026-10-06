const mongoose = require('mongoose');

const ktTaskSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KTPlan',
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    backupPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Task type determines who acts on it and how completion is verified
    type: {
      type: String,
      enum: ['documentation', 'shadowing', 'interview', 'validation', 'signoff'],
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    deadline: { type: Date },

    // ─── Status flow ─────────────────────────────────────────
    // pending → submitted (employee submits evidence)
    //        → approved (manager approves) ✓ COUNTS TOWARD PROGRESS
    //        → rejected (manager rejects, goes back to pending)
    //        → overdue (deadline passed without submission)
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected', 'overdue'],
      default: 'pending',
    },

    // ─── Evidence (documentation tasks) ──────────────────────
    // Employee MUST provide one of these before submitting
    evidenceUrl: { type: String, default: null },
    evidenceDescription: { type: String, default: null },

    // Session evidence workflow for shadowing/interview tasks.
    // Both people confirm, then notes/evidence must be approved by the manager.
    employeeConfirmed: { type: Boolean, default: false },
    backupConfirmed: { type: Boolean, default: false },
    employeeConfirmedAt: { type: Date, default: null },
    backupConfirmedAt: { type: Date, default: null },
    sessionEvidenceUrl: { type: String, default: null },
    sessionNotes: { type: String, default: null },
    sessionEvidenceSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Manager approval (documentation tasks) ──────────────
    managerApproved: { type: Boolean, default: false },
    managerNote: { type: String, default: '' },
    managerActedAt: { type: Date, default: null },

    // ─── Competence rating (validation task only) ─────────────
    // Manager rates backup person after their practice run
    competenceRating: {
      type: String,
      enum: ['fully_competent', 'needs_minor', 'needs_significant', 'not_competent', null],
      default: null,
    },

    // ─── Reminder tracking ────────────────────────────────────
    reminderCount: { type: Number, default: 0, max: 4 },
    lastReminderAt: { type: Date, default: null },

    // ─── Timestamps ───────────────────────────────────────────
    submittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Virtual: is this task done (counts toward progress) ─────
ktTaskSchema.virtual('isDone').get(function () {
  if (this.type === 'documentation') return this.managerApproved === true;
  if (this.type === 'shadowing' || this.type === 'interview') {
    return this.employeeConfirmed && this.backupConfirmed && this.managerApproved === true;
  }
  if (this.type === 'validation') {
    return ['fully_competent', 'needs_minor'].includes(this.competenceRating);
  }
  if (this.type === 'signoff') return this.managerApproved === true;
  return false;
});

module.exports = mongoose.model('KTTask', ktTaskSchema);
