require('dotenv').config();
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const User = require('./src/models/User');
const Assessment = require('./src/models/Assessment');
const RiskScore = require('./src/models/RiskScore');
const KTPlan = require('./src/models/KTPlan');
const { mapGoogleAssessmentRow } = require('./src/utils/googleFormsParser');
const { calculateAndSaveRiskScore } = require('./src/services/scoringEngine');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  // Clear data
  await User.deleteMany({ email: { $ne: 'admin@knowledgeguard.demo' } });
  await Assessment.deleteMany({});
  await RiskScore.deleteMany({});
  await KTPlan.deleteMany({});
  console.log('✅ Wiped old data (kept admin)');

  // 1. Import Users
  const userRows = [];
  await new Promise(resolve => fs.createReadStream('../test_data/01_users.csv').pipe(csv()).on('data', d => userRows.push(d)).on('end', resolve));
  
  for (const row of userRows) {
    if (!row.email) continue;
    let managerId = null;
    if (row.manager_email) {
      const mgr = await User.findOne({ email: row.manager_email });
      if (mgr) managerId = mgr._id;
    }
    await User.create({
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department,
      startDate: row.start_date || new Date(),
      managerId,
      skills: row.skills ? row.skills.split(',').map(s=>s.trim()) : [],
      knowledgeTags: row.knowledgeTags ? row.knowledgeTags.split(',').map(s=>s.trim()) : [],
      passwordHash: 'Demo1234'
    });
  }
  console.log('✅ Imported Users:', userRows.length);

  // Helper to read CSV
  async function readCsv(path) {
    const rows = [];
    await new Promise(resolve => fs.createReadStream(path).pipe(csv()).on('data', d => rows.push(d)).on('end', resolve));
    return rows;
  }

  const periods = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  for (const q of periods) {
    console.log(`\n--- Processing ${q} ---`);
    
    // 2. Import Assessments for Quarter
    const aRows = await readCsv(`../test_data/02_employee_assessments_${q}.csv`);
    for (const row of aRows) {
      const email = row['Email Address'];
      const user = await User.findOne({ email });
      if (!user) continue;

      const mapped = mapGoogleAssessmentRow(row);
      
      const assessment = await Assessment.create({
        userId: user._id,
        managerId: user.managerId,
        period: `2026-${q}`,
        selfScores: {
          expertiseUniqueness: mapped.expertiseUniqueness,
          documentationGap: mapped.documentationGap,
          projectCriticality: mapped.projectCriticality,
          collaborationDependency: mapped.collaborationDependency
        },
        responseBias: mapped._metadata.biasData,
        managerValidated: false
      });
      await calculateAndSaveRiskScore(user._id, assessment._id);
    }
    console.log(`✅ ${q}: Employee self-assessments imported and scored.`);

    // Check Mohamed pre-validation
    const mohamed = await User.findOne({ email: 'employee@knowledgeguard.demo' });
    let preScore = await RiskScore.findOne({ userId: mohamed._id, period: `2026-${q}` });
    console.log(`   Mohamed (Pre-Validation): Tier=${preScore.tier}, Score=${preScore.finalScore}`);

    // 3. Import Manager Validations for Quarter
    const mRows = await readCsv(`../test_data/03_manager_validations_${q}.csv`);
    for (const row of mRows) {
      const email = row['employee_email'];
      const user = await User.findOne({ email });
      if (!user) continue;

      const assessment = await Assessment.findOne({ userId: user._id, period: `2026-${q}` });
      if (!assessment) continue;

      assessment.managerValidated = true;
      assessment.managerScores = {
        expertiseUniqueness: Number(row['Manager rating: expertise uniqueness']),
        documentationGap: Number(row['Manager rating: documentation gap']),
        projectCriticality: Number(row['Manager rating: project criticality']),
        collaborationDependency: Number(row['Manager rating: collaboration dependency'])
      };
      assessment.managerNotes = row['Manager notes for validation'];
      await assessment.save();

      await calculateAndSaveRiskScore(user._id, assessment._id);
    }
    console.log(`✅ ${q}: Manager validations imported and re-scored.`);

    // Check Mohamed post-validation
    let postScore = await RiskScore.findOne({ userId: mohamed._id, period: `2026-${q}` });
    console.log(`   Mohamed (Post-Validation): Tier=${postScore.tier}, Score=${postScore.finalScore}`);

    // If Q2, create KT Plan!
    if (q === 'Q2') {
      console.log(`\n🔔 Creating KT Plan for Mohamed (Critical) -> Kavindu (Trainee)...`);
      const kavindu = await User.findOne({ email: 'kavindu@knowledgeguard.demo' });
      await KTPlan.create({
        title: "Core Banking System Knowledge Transfer",
        employeeId: mohamed._id,
        managerId: mohamed.managerId,
        traineeIds: [kavindu._id],
        status: "in_progress",
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 120*24*60*60*1000)
      });
    }

    if (q === 'Q3') {
       console.log(`\n🔔 KT Plan in progress... Mohamed's risk should start dropping.`);
    }

    if (q === 'Q4') {
       console.log(`\n🔔 Completing KT Plan...`);
       await KTPlan.updateMany({ employeeId: mohamed._id }, { status: 'completed', completionDate: new Date() });
       console.log(`🔔 KT Plan Complete! Mohamed's Q4 risk should now be much lower.`);
    }
  }

  console.log('\n🎉 All 4 quarters successfully simulated without failures!');
  await mongoose.disconnect();
}

run().catch(console.error);
