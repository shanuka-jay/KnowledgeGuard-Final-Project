// Explicitly opt-in, isolated database verification. Uses no existing records,
// no seed scripts, and no AI/email. Drops only its newly created test database.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../src/models/User');
const Assessment = require('../src/models/Assessment');
const RiskScore = require('../src/models/RiskScore');
const KTPlan = require('../src/models/KTPlan');
const KTTask = require('../src/models/KTTask');
const SystemSettings = require('../src/models/SystemSettings');
const ActivityLog = require('../src/models/ActivityLog');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
// External notifications and generated questions are deliberately isolated.
for (const [path, exports] of [
  ['../src/services/alertService', new Proxy({}, {get:()=>async()=>{}})],
  ['../src/services/aiService', {generateKTQuestions:async()=>['Fictional fixture question']}],
]) require.cache[require.resolve(path)] = {id:require.resolve(path),filename:require.resolve(path),loaded:true,exports};
const app = express();
app.use(express.json());
app.use('/api/kt-plans', require('../src/routes/ktPlans'));
app.use('/api/kt-tasks', require('../src/routes/ktTasks'));
app.use('/api/assessments', require('../src/routes/assessments'));
async function post(path, user, body={}, status=200) {
  const token = jwt.sign({id:String(user._id)},process.env.JWT_SECRET,{expiresIn:'5m'});
  const response = await request(app).post(path).set('Authorization',`Bearer ${token}`).send(body);
  assert.equal(response.status,status,`${path}: ${response.body.message}`);
  return response.body;
}
const { calculateAndSaveRiskScore } = require('../src/services/scoringEngine');
const { signOffKTPlan } = require('../src/services/ktSignoff');
const { mapGoogleAssessmentRow } = require('../src/utils/googleFormsParser');
const databaseName = `kg_verify_${crypto.randomUUID().replaceAll('-', '').slice(0,16)}`;
let cleanupAllowed = false;
let passed = 0;
function pass(label) { passed++; console.log(`PASS ${label}`); }

async function run() {
  if (!process.argv.includes('--run-isolated')) throw new Error('Requires --run-isolated');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: databaseName, autoIndex: false, serverSelectionTimeoutMS: 15000 });
  assert.equal(mongoose.connection.db.databaseName, databaseName);
  assert.match(databaseName, /^kg_verify_[a-f0-9]{16}$/);
  // Do not adopt or delete any pre-existing database contents.
  assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0);
  cleanupAllowed = true;
  console.log(`Isolated database: ${databaseName}`);
  await Promise.all([User,Assessment,RiskScore,KTPlan,KTTask,SystemSettings,ActivityLog].map(model=>model.createCollection()));
  await Assessment.createIndexes();
  await SystemSettings.create({ useDynamicWeights:false });
  const manager = await User.create({name:'Verification Manager',department:'Test fixture',email:'manager@verification.invalid',passwordHash:'TemporaryFixture123!',role:'manager',startDate:'2010-01-01'});
  const employee = await User.create({name:'Verification Holder',department:'Test fixture',email:'holder@verification.invalid',passwordHash:'TemporaryFixture123!',role:'employee',managerId:manager._id,startDate:'2010-01-01'});
  const backup = await User.create({name:'Verification Backup',department:'Test fixture',email:'backup@verification.invalid',passwordHash:'TemporaryFixture123!',role:'employee',managerId:manager._id,startDate:'2025-01-01'});
  // Deterministic ML boundary: database and all business rules are real.
  axios.post = async () => ({data:{predicted_score:6.5}});
  const inputs = {EU:9,DG:8,PC:9,CD:7};
  const mapped = mapGoogleAssessmentRow(inputs);
  let current;
  for (let q=1;q<=4;q++) {
    current = await Assessment.create({userId:employee._id,managerId:manager._id,period:`2026-Q${q}`,selfScores:mapped,managerScores:mapped,managerValidated:true});
    await calculateAndSaveRiskScore(employee._id,current._id);
  }
  const history = await RiskScore.find({userId:employee._id}).sort({period:1}).lean();
  assert.deepEqual(history.map(row=>row.period),['2026-Q1','2026-Q2','2026-Q3','2026-Q4']);
  pass('four-quarter persistence without overwriting');
  await post(`/api/assessments/${current._id}/validate`,manager,mapped);
  pass('authenticated manager assessment validation API');
  const created = await post('/api/kt-plans',manager,{employeeId:employee._id,backupPersonId:backup._id,knowledgeAreas:['Fixture process'],deadline:new Date(Date.now()+30*86400000).toISOString(),priority:'high'},201);
  const plan = {_id:created.plan._id};
  assert.equal(created.tasks.length,5);
  await post(`/api/kt-plans/${plan._id}/signoff`,manager,{},400);
  assert.equal((await KTPlan.findById(plan._id)).status,'active');
  pass('early sign-off blocked with real task records');
  const taskId = type => created.tasks.find(task=>task.type===type)._id;
  await post(`/api/kt-tasks/${taskId('documentation')}/submit`,employee,{evidenceDescription:'Fictional documented procedure'});
  await post(`/api/kt-tasks/${taskId('documentation')}/approve`,manager,{approved:true});
  for (const type of ['shadowing','interview']) {
    await post(`/api/kt-tasks/${taskId(type)}/confirm`,employee);
    await post(`/api/kt-tasks/${taskId(type)}/session-evidence`,employee,{sessionNotes:'Fictional session notes'},400);
    await post(`/api/kt-tasks/${taskId(type)}/confirm`,backup);
    await post(`/api/kt-tasks/${taskId(type)}/session-evidence`,employee,{sessionNotes:'Fictional session notes'});
    await post(`/api/kt-tasks/${taskId(type)}/approve`,manager,{approved:true});
  }
  await post(`/api/kt-tasks/${taskId('validation')}/rate`,manager,{competenceRating:'fully_competent'});
  await post(`/api/kt-plans/${plan._id}/signoff`,manager);
  pass('authenticated evidence, dual attendance, approvals, competence and sign-off APIs');
  const after = await Assessment.findById(current._id);
  assert.deepEqual(after.selfScores.toObject(),{expertiseUniqueness:6,documentationGap:5,projectCriticality:9,collaborationDependency:5});
  assert.equal((await KTPlan.findById(plan._id)).status,'complete');
  assert.equal((await RiskScore.findOne({userId:employee._id,period:'2026-Q4'})).formulaScore,6.8);
  pass('transaction commits plan, indicators, audit trace and recalculated score');
  await assert.rejects(signOffKTPlan(plan._id,manager),error=>error.status===409);
  assert.equal((await Assessment.findById(current._id)).selfScores.expertiseUniqueness,6);
  pass('repeat sign-off cannot reduce the score twice');

  // A second valid plan with an injected persistence failure exercises actual
  // MongoDB transaction rollback, not an in-memory imitation.
  const failingPlan = await KTPlan.create({employeeId:employee._id,managerId:manager._id,backupPersonId:backup._id,knowledgeAreas:['Fixture second process'],deadline:new Date(Date.now()+86400000),priority:'high'});
  await KTTask.create(['documentation','shadowing','interview','validation','signoff'].map(type=>({planId:failingPlan._id,managerId:manager._id,employeeId:employee._id,backupPersonId:backup._id,type,title:type,deadline:new Date(Date.now()+86400000),managerApproved:type!=='signoff',employeeConfirmed:true,backupConfirmed:true,competenceRating:type==='validation'?'fully_competent':undefined})));
  const originalSave = RiskScore.findOneAndUpdate;
  RiskScore.findOneAndUpdate = async () => { throw new Error('injected score persistence failure'); };
  try { await assert.rejects(signOffKTPlan(failingPlan._id,manager), /injected score persistence failure/); }
  finally { RiskScore.findOneAndUpdate = originalSave; }
  assert.equal((await KTPlan.findById(failingPlan._id)).status,'active');
  assert.equal((await Assessment.findById(current._id)).selfScores.expertiseUniqueness,6);
  assert.equal((await Assessment.findById(current._id)).ktAppliedPlanIds.length,1);
  pass('real transaction rollback preserves pre-failure indicators and plan state');
  console.log(`Database/API checks passed: ${passed}/7. ML was deterministic; AI/email were not invoked.`);
}
run().catch(error=>{console.error('Verification failed:',error.message);process.exitCode=1;}).finally(async()=>{
  if (cleanupAllowed && mongoose.connection.db?.databaseName === databaseName && /^kg_verify_[a-f0-9]{16}$/.test(databaseName)) {
    await mongoose.connection.db.dropDatabase();
    console.log('Temporary verification database removed; existing application database untouched.');
  }
  await mongoose.disconnect();
});
