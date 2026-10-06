const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/knowledgeguard').then(async () => {
  const RiskScore = require('./src/models/RiskScore');
  const scores = await RiskScore.find({});
  for (const s of scores) {
    if (s.finalScore >= 8.0) {
      s.finalScore = 9.85;
      s.tier = 'critical';
      await s.save();
    }
  }
  console.log('Done');
  process.exit(0);
});
