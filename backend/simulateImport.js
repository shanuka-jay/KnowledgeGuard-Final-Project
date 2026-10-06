require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const User = require('./src/models/User');
const Assessment = require('./src/models/Assessment');
const { calculateAndSaveRiskScore } = require('./src/services/scoringEngine');
const { mapGoogleAssessmentRow, getEmail } = require('./src/utils/googleFormsParser');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  // Wipe and seed minimum users
  await User.deleteMany({});
  await Assessment.deleteMany({});
  const RiskScore = require('./src/models/RiskScore');
  await RiskScore.deleteMany({});
  
  // Need to insert some users manually since we wiped them
  // We will just read the assessment CSV and create users for them
  const rows = [];
  await new Promise((resolve) => {
    fs.createReadStream('../test_data/02_employee_assessments_Q3.csv')
      .pipe(csv())
      .on('data', data => rows.push(data))
      .on('end', resolve);
  });
  
  for (const row of rows) {
    const email = row['Email Address'];
    if (!email) continue;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: email.split('@')[0],
        email: email,
        passwordHash: 'Demo1234',
        role: 'employee',
        department: 'Engineering',
        startDate: new Date('2021-01-01'),
        consentGiven: true
      });
    }
    
    const mapped = mapGoogleAssessmentRow(row);
    const assessment = await Assessment.create({
      userId: user._id,
      period: '2026-Q2',
      selfScores: {
        expertiseUniqueness: mapped.expertiseUniqueness,
        documentationGap: mapped.documentationGap,
        projectCriticality: mapped.projectCriticality,
        collaborationDependency: mapped.collaborationDependency
      }
    });
    
    await calculateAndSaveRiskScore(user._id, assessment._id);
  }
  
  console.log('Assessments imported. Checking risk scores...');
  const scores = await RiskScore.find({}).populate('userId');
  const dist = {};
  for (const s of scores) {
    if (s.userId) {
      dist[s.tier] = (dist[s.tier] || 0) + 1;
      console.log(`${s.userId.email} | formula=${s.formulaScore} ml=${s.mlScore} final=${s.finalScore} tier=${s.tier}`);
    }
  }
  console.log('Distribution:', dist);
  process.exit(0);
}
run().catch(console.error);
