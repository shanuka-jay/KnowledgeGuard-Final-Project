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
  
  await User.deleteMany({});
  await Assessment.deleteMany({});
  const RiskScore = require('./src/models/RiskScore');
  await RiskScore.deleteMany({});
  
  const assessments = [];
  await new Promise((resolve) => {
    fs.createReadStream('../test_data/02_assessments_sinhala_q3.csv')
      .pipe(csv())
      .on('data', data => assessments.push(data))
      .on('end', resolve);
  });
  
  for (const row of assessments) {
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
    await Assessment.create({
      userId: user._id,
      period: '2024-Q3',
      selfScores: {
        expertiseUniqueness: mapped.expertiseUniqueness,
        documentationGap: mapped.documentationGap,
        projectCriticality: mapped.projectCriticality,
        collaborationDependency: mapped.collaborationDependency
      }
    });
  }

  const validations = [];
  await new Promise((resolve) => {
    fs.createReadStream('../test_data/03_manager_validations_sinhala.csv')
      .pipe(csv())
      .on('data', data => validations.push(data))
      .on('end', resolve);
  });

  for (const row of validations) {
    const employeeEmail = row['Employee email being validated'];
    if (!employeeEmail) continue;
    
    const employee = await User.findOne({ email: employeeEmail });
    if (!employee) continue;
    
    const assessment = await Assessment.findOne({ userId: employee._id });
    if (!assessment) continue;
    
    const mapped = mapGoogleAssessmentRow(row);
    assessment.managerScores = {
      expertiseUniqueness: mapped.expertiseUniqueness,
      documentationGap: mapped.documentationGap,
      projectCriticality: mapped.projectCriticality,
      collaborationDependency: mapped.collaborationDependency
    };
    assessment.managerValidated = true;
    await assessment.save();
    
    await calculateAndSaveRiskScore(employee._id, assessment._id);
  }
  
  const scores = await RiskScore.find({}).populate('userId');
  const dist = {};
  for (const s of scores) {
    if (s.userId) {
      dist[s.tier] = (dist[s.tier] || 0) + 1;
      console.log(`${s.userId.email} | self=${s.formulaScore} manager=${s.managerScore} ml=${s.mlScore} final=${s.finalScore} tier=${s.tier}`);
    }
  }
  console.log('Final Distribution with Manager Validations:', dist);
  process.exit(0);
}
run().catch(console.error);
