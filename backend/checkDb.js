require('dotenv').config();
const mongoose = require('mongoose');

async function checkScores() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const RiskScore = require('./src/models/RiskScore');
  const User = require('./src/models/User');

  const scores = await RiskScore.find().populate('userId', 'name department');
  console.log(`Found ${scores.length} total risk scores.`);

  let unknownCount = 0;
  for (const score of scores) {
    if (!score.userId || !score.userId.department) {
      unknownCount++;
      console.log(`RiskScore ${score._id}: userId object = ${score.userId ? JSON.stringify(score.userId) : 'null'}`);
    }
  }

  console.log(`Total "Unknown" scores: ${unknownCount}`);
  process.exit(0);
}

checkScores().catch(console.error);
