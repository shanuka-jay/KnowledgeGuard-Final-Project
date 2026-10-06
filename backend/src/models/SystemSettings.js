const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    useDynamicWeights: {
      type: Boolean,
      default: false,
    },
    ahpWeights: {
      type: Map,
      of: Number,
      default: {
        expertiseUniqueness: 0.25,
        documentationGap: 0.20,
        projectCriticality: 0.20,
        collaborationDependency: 0.20,
        tenure: 0.15,
      },
    },
  },
  { timestamps: true }
);

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function ({ session = null } = {}) {
  let settings = await this.findOne().session(session);
  if (!settings) {
    [settings] = await this.create([{}], { session });
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
