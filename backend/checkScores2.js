require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const RiskScore = require('./src/models/RiskScore');
  const scores = await RiskScore.find({}).populate('userId', 'email');
  scores.forEach(s => {
    if (s.userId) {
      console.log(`${s.userId.email} | Final: ${s.finalScore} | Formula: ${s.formulaScore} | Tier: ${s.tier} | ML: ${s.mlScore} | Manager: ${s.managerScore}`);
    }
  });
  process.exit(0);
}
run();
