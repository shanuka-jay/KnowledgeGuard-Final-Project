// Isolated business-flow tests: real parser/scoring/sign-off code and KTTask
// completion rules, with in-memory database/transaction and ML boundaries.
// No production database, email, AI or existing records are accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../src/models/User');
const Assessment = require('../src/models/Assessment');
const RiskScore = require('../src/models/RiskScore');
const Settings = require('../src/models/SystemSettings');
const KTPlan = require('../src/models/KTPlan');
const KTTask = require('../src/models/KTTask');
const { calculateAndSaveRiskScore, classifyTier } = require('../src/services/scoringEngine');
const { signOffKTPlan } = require('../src/services/ktSignoff');
const { updateScoreAfterKT } = require('../src/services/ktScoreUpdate');
const ids = { employee:'000000000000000000000001',manager:'000000000000000000000002',plan:'000000000000000000000003' };
let state;
const clone = value => JSON.parse(JSON.stringify(value));
function query(resolve) {
  const q = { sort() { return q; }, session() { return q; }, then(ok,fail) { return Promise.resolve().then(resolve).then(ok,fail); } };
  return q;
}
function doc(value) {
  if (!value) return null;
  Object.defineProperty(value, 'save', { configurable:true, enumerable:false, value: async () => value });
  return value;
}
function taskDocuments() { return state.tasks.map(t => new KTTask(t)); }
function reset(competence='fully_competent') {
  state = {
    assessments: [{ _id:'000000000000000000000004',userId:ids.employee,period:'2026-Q1',submittedAt:'2026-01-01', selfScores:{expertiseUniqueness:9,documentationGap:8,projectCriticality:9,collaborationDependency:7},managerScores:{expertiseUniqueness:9,documentationGap:8,projectCriticality:9,collaborationDependency:7},managerValidated:true,ktAppliedPlanIds:[] }],
    scores: [],
    plan: {_id:ids.plan,employeeId:ids.employee,managerId:ids.manager,status:'active'},
    tasks: ['documentation','shadowing','interview','validation','signoff'].map(type=>({planId:ids.plan,employeeId:ids.employee,managerId:ids.manager,backupPersonId:'000000000000000000000005',type,title:type,managerApproved:type!=='signoff',employeeConfirmed:true,backupConfirmed:true,competenceRating:type==='validation'?competence:undefined})),
    mlFails:false, writeFails:false,
  };
  User.findById = () => query(() => ({_id:ids.employee,startDate:'2010-01-01'}));
  Assessment.findById = id => query(() => doc(state.assessments.find(a=>a._id===String(id))));
  Assessment.findOne = () => query(() => doc([...state.assessments].sort((a,b)=>b.period.localeCompare(a.period))[0]));
  Settings.getSettings = async () => ({useDynamicWeights:false});
  RiskScore.findOne = filter => query(() => [...state.scores].filter(s=>!filter.period?.$lt || s.period<filter.period.$lt).sort((a,b)=>b.period.localeCompare(a.period))[0] || null);
  RiskScore.findOneAndUpdate = async (filter,data) => {
    if (state.writeFails) throw new Error('injected persistence failure');
    const found = state.scores.find(s=>s.period===filter.period);
    if (found) Object.assign(found,clone(data)); else state.scores.push(clone(data));
    return clone(data);
  };
  KTPlan.findById = () => query(() => doc(state.plan));
  KTTask.find = () => query(taskDocuments);
  KTTask.findOneAndUpdate = async (filter,update) => Object.assign(state.tasks.find(t=>t.type==='signoff'),update);
  axios.post = async () => { if(state.mlFails) throw new Error('injected ML outage'); return {data:{predicted_score:6.5}}; };
  mongoose.connection.transaction = async callback => {
    const snapshot = clone(state);
    try { return await callback({fixtureSession:true}); }
    catch(error) { state=snapshot; throw error; }
  };
}
const actor = {_id:ids.manager,role:'manager'};
test('Q1-Q4 scores persist as four separate periods and delta uses the preceding quarter', async () => {
  reset(); const template = clone(state.assessments[0]); state.assessments=[];
  for(let q=1;q<=4;q++) {
    const assessment={...clone(template),_id:`fixture-${q}`,period:`2026-Q${q}`};state.assessments.push(assessment);
    await calculateAndSaveRiskScore(ids.employee,assessment._id);
  }
  assert.deepEqual(state.scores.map(s=>s.period),['2026-Q1','2026-Q2','2026-Q3','2026-Q4']);
  assert.equal(state.scores[0].previousScore,null);
  assert.equal(state.scores[3].previousScore,state.scores[2].finalScore);
  await calculateAndSaveRiskScore(ids.employee,'fixture-1');
  assert.equal(state.scores.length,4);assert.equal(state.scores[0].previousScore,null);
});
test('rejects assessment-owner mismatch and malformed periods', async () => {
  reset(); state.assessments[0].userId='other';
  await assert.rejects(calculateAndSaveRiskScore(ids.employee,state.assessments[0]._id), /does not belong/);
  reset();state.assessments[0].period='Q1';
  await assert.rejects(calculateAndSaveRiskScore(ids.employee,state.assessments[0]._id), /Invalid assessment period/);
});
test('fully competent KT reduces only EU/DG/CD, stores before/after, and completes the plan', async () => {
  reset();const before = await calculateAndSaveRiskScore(ids.employee,state.assessments[0]._id);
  assert.equal(before.riskScore.formulaScore,8.55);
  const completed = await signOffKTPlan(ids.plan,actor);
  assert.equal(state.plan.status,'complete');assert.equal(state.plan.completionPercentage,100);
  assert.deepEqual(state.assessments[0].selfScores,{expertiseUniqueness:6,documentationGap:5,projectCriticality:9,collaborationDependency:5});
  assert.deepEqual(state.assessments[0].managerScores,state.assessments[0].selfScores);
  assert.equal(completed.result.riskScore.formulaScore,6.8);
  assert.equal(completed.result.finalScore,6.74);
  assert.equal(state.assessments[0].ktImpact.before.documentationGap,8);
  assert.equal(state.assessments[0].ktImpact.after.documentationGap,5);
  assert.equal(state.scores[0].period,'2026-Q1');
});
test('repeat sign-off is rejected and direct mitigation retry does not subtract twice', async () => {
  reset();await signOffKTPlan(ids.plan,actor);const after=clone(state.assessments[0].selfScores);
  await assert.rejects(signOffKTPlan(ids.plan,actor), e=>e.status===409);
  await updateScoreAfterKT(ids.plan);
  assert.deepEqual(state.assessments[0].selfScores,after);
  assert.equal(state.assessments[0].ktAppliedPlanIds.length,1);
});
test('legacy mitigation trace also prevents repeat reductions', async () => {
  reset();state.assessments[0].ktImpact={planId:ids.plan};
  const before=clone(state.assessments[0].selfScores);await updateScoreAfterKT(ids.plan);
  assert.deepEqual(state.assessments[0].selfScores,before);
});
test('minor-gap competence uses smaller reductions', async () => {
  reset('needs_minor');await signOffKTPlan(ids.plan,actor);
  assert.equal(state.assessments[0].selfScores.expertiseUniqueness,7);
  assert.equal(state.assessments[0].selfScores.collaborationDependency,5.5);
});
test('incomplete, missing, unconfirmed and non-competent tasks block sign-off', async () => {
  for(const variation of ['missing','approval','confirmation','needs_significant','not_competent']) {
    reset();
    if(variation==='missing') state.tasks=state.tasks.filter(t=>t.type!=='documentation');
    else if(variation==='approval') state.tasks[0].managerApproved=false;
    else if(variation==='confirmation') state.tasks[1].backupConfirmed=false;
    else state.tasks[3].competenceRating=variation;
    await assert.rejects(signOffKTPlan(ids.plan,actor), e=>e.status===400);
    assert.equal(state.plan.status,'active');assert.equal(state.assessments[0].selfScores.expertiseUniqueness,9);
  }
});
test('unauthorized manager cannot complete the plan', async () => {
  reset();await assert.rejects(signOffKTPlan(ids.plan,{_id:'different-manager',role:'manager'}),e=>e.status===403);
});
test('scores cannot fall below one and PC stays unchanged', async () => {
  reset();Object.assign(state.assessments[0].selfScores,{expertiseUniqueness:2,documentationGap:2,collaborationDependency:2});
  await signOffKTPlan(ids.plan,actor);
  assert.deepEqual(state.assessments[0].selfScores,{expertiseUniqueness:1,documentationGap:1,projectCriticality:9,collaborationDependency:1});
});
test('ML outage uses formula fallback and does not prevent completion', async () => {
  reset();state.mlFails=true;const {result}=await signOffKTPlan(ids.plan,actor);
  assert.equal(result.finalScore,6.8);assert.equal(result.riskScore.mlScore,6.8);
});
test('persistence failure or missing assessment leaves plan and indicators unchanged', async () => {
  reset();state.writeFails=true;
  await assert.rejects(signOffKTPlan(ids.plan,actor), /persistence failure/);
  assert.equal(state.plan.status,'active');assert.equal(state.assessments[0].selfScores.expertiseUniqueness,9);
  assert.equal(state.assessments[0].ktAppliedPlanIds.length,0);
  reset();state.assessments=[];
  await assert.rejects(signOffKTPlan(ids.plan,actor), /No assessment/);assert.equal(state.plan.status,'active');
});
test('tier boundaries remain unchanged', () => {
  assert.deepEqual([5,5.01,7.5,7.51,9,9.01].map(classifyTier),['low','medium','medium','high','high','critical']);
});
