/**
 * Seed script — creates demo accounts for testing
 * Run: npm run seed
 *
 * Creates:
 *   1 admin account
 *   1 hr_analyst account
 *   4 manager accounts
 *   1 employee account with assessment and risk score
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User       = require('../models/User');
const Assessment = require('../models/Assessment');
const { calculateAndSaveRiskScore } = require('../services/scoringEngine');

const DEMO_PASSWORD = 'Demo1234';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await User.deleteMany({ email: /@knowledgeguard\.demo$/ });
  console.log('Cleared old seed data');

  // ─── Create admin ──────────────────────────────────────────
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'admin',
    department: 'Administration',
    startDate: new Date('2020-01-01'),
    consentGiven: true,
    consentDate: new Date(),
  });
  console.log('✅ Admin created:', admin.email);

  // ─── Create HR analyst ────────────────────────────────────
  const hr = await User.create({
    name: 'HR Analyst',
    email: 'hr@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'hr_analyst',
    department: 'Human Resources',
    startDate: new Date('2021-03-01'),
    consentGiven: true,
    consentDate: new Date(),
  });
  // ─── Create researcher ────────────────────────────────────
  const researcher = await User.create({
    name: 'Lead Researcher',
    email: 'researcher@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'researcher',
    department: 'Academic Research',
    startDate: new Date('2020-01-01'),
    consentGiven: true,
    consentDate: new Date(),
  });
  console.log('✅ Researcher created:', researcher.email);

  const manager1 = await User.create({
    name: 'Sarah',
    email: 'sarah@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'manager',
    department: 'Engineering',
    startDate: new Date('2018-06-01'),
    consentGiven: true,
    consentDate: new Date(),
  });

  const manager2 = await User.create({
    name: 'David',
    email: 'david@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'manager',
    department: 'Product',
    startDate: new Date('2019-02-01'),
    consentGiven: true,
    consentDate: new Date(),
  });

  const manager3 = await User.create({
    name: 'Michael',
    email: 'michael@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'manager',
    department: 'Operations',
    startDate: new Date('2017-05-15'),
    consentGiven: true,
    consentDate: new Date(),
  });

  const manager4 = await User.create({
    name: 'Emma',
    email: 'emma@knowledgeguard.demo',
    passwordHash: DEMO_PASSWORD,
    role: 'manager',
    department: 'Finance',
    startDate: new Date('2020-08-10'),
    consentGiven: true,
    consentDate: new Date(),
  });

  console.log('✅ 4 managers created');

  // ─── Create employees with varied risk profiles ────────────
  const employees = [
    // Demo Employee (assigned to manager1)
    { name:'Mohamed Al-Rashid', email:'mohamed@knowledgeguard.demo', dept:'Engineering', start:'2015-03-01', managerId:manager1._id,
      scores:{ expertiseUniqueness:9, documentationGap:8, projectCriticality:9, collaborationDependency:7 },
      skills:['Payment API','Legacy Database','Microservices'], knowledgeTags:['payment-reconciliation','core-banking-system'] }
  ];

  const period = Assessment.getCurrentPeriod();

  for (const emp of employees) {
    const user = await User.create({
      name: emp.name,
      email: emp.email,
      passwordHash: DEMO_PASSWORD,
      role: 'employee',
      department: emp.dept,
      startDate: new Date(emp.start),
      managerId: emp.managerId,
      skills: emp.skills,
      knowledgeTags: emp.knowledgeTags,
      consentGiven: true,
      consentDate: new Date(),
    });

    const assessment = await Assessment.create({
      userId: user._id,
      managerId: emp.managerId,
      period,
      selfScores: emp.scores,
    });

    const result = await calculateAndSaveRiskScore(user._id, assessment._id);
    console.log(`✅ ${emp.name}: score=${result.finalScore.toFixed(1)} tier=${result.tier}`);
  }

  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('─────────────────────────────────────────');
  console.log('Admin:      admin@knowledgeguard.demo');
  console.log('Researcher: researcher@knowledgeguard.demo');
  console.log('HR Analyst: hr@knowledgeguard.demo');
  console.log('Manager 1:  sarah@knowledgeguard.demo');
  console.log('Manager 2:  david@knowledgeguard.demo');
  console.log('Manager 3:  michael@knowledgeguard.demo');
  console.log('Manager 4:  emma@knowledgeguard.demo');
  console.log('Employee:   mohamed@knowledgeguard.demo');
  console.log('Password:   Demo1234 (all accounts)');
  console.log('─────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
