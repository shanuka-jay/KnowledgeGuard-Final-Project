const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee', 'hr_analyst', 'researcher'],
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    skills: [{ type: String, trim: true }],
    knowledgeTags: [{ type: String, trim: true }],

    // Research consent
    consentGiven: { type: Boolean, default: false },
    consentDate: { type: Date, default: null },

    // Account management
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String, default: null },
    avatarFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Password reset
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },

    // Projects the employee is involved in
    projects: [{ name: String, role: String, criticality: String }],

    // Documentation log entries
    documentationLog: [
      {
        title: String,
        url: String,
        description: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: tenure in years ─────────────────────────────────
userSchema.virtual('tenureYears').get(function () {
  if (!this.startDate) return 0;
  return ((Date.now() - new Date(this.startDate)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
});

// ─── Virtual: tenure score (used in risk formula) ─────────────
userSchema.virtual('tenureScore').get(function () {
  const years = (Date.now() - new Date(this.startDate)) / (1000 * 60 * 60 * 24 * 365);
  if (years < 2)  return 2;
  if (years < 5)  return 5;
  if (years < 10) return 7;
  return 10;
});

// ─── Pre-save: hash password before saving ────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// ─── Method: compare password ─────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Method: get public profile (no sensitive fields) ─────────
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    startDate: this.startDate,
    tenureYears: this.tenureYears,
    tenureScore: this.tenureScore,
    managerId: this.managerId,
    skills: this.skills,
    knowledgeTags: this.knowledgeTags,
    consentGiven: this.consentGiven,
    consentDate: this.consentDate,
    lastLogin: this.lastLogin,
    isActive: this.isActive,
    avatarUrl: this.avatarFileId ? `/api/users/${this._id}/avatar/file?v=${new Date(this.updatedAt || Date.now()).getTime()}` : this.avatarUrl,
    avatarFileId: this.avatarFileId,
    projects: this.projects,
    documentationLog: this.documentationLog,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
