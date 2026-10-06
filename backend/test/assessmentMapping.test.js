const test = require('node:test');
const assert = require('node:assert/strict');
const { mapGoogleAssessmentRow, multiQuarterDictionary } = require('../src/utils/googleFormsParser');
const headers = [
  'Q1 Other people can complete complex deliverables','Q2 Learning curve','Q3 SOP availability/currentness',
  'Q4 Tasks completed using documentation','Q5 Impact if key deliverables stall 48 hours',
  'Q6 Connection to SLA/compliance/revenue/service continuity','Q7 Colleagues halt work waiting for knowledge/decision',
  'Q8 Colleagues/teams depending on clearance/input','Q9 Peer could step in without substantial assistance',
  'Q10 Troubleshooting procedures published/current/searchable',
];
const answers = ['Nobody','>6 months','Unwritten or unavailable','<40%','Critical impact','Mission-critical impact','Daily or almost daily','6+','Disagree','Agree'];
function raw() { return Object.fromEntries(headers.map((h, i) => [h, answers[i]])); }
test('maps the real shortened Q1 headings including Agree and Disagree', () => {
  const mapped = mapGoogleAssessmentRow(raw());
  assert.equal(mapped.expertiseUniqueness, 9.33);
  assert.equal(mapped.documentationGap, 8);
  assert.equal(mapped.projectCriticality, 10);
  assert.equal(mapped.collaborationDependency, 10);
  assert.equal(mapped._metadata.quarterTag, 'Q1');
});
test('maps all five reverse Likert responses without substring collisions', () => {
  for (const [answer, expected] of [['Strongly agree',2],['Agree',4],['Neutral',6],['Disagree',8],['Strongly disagree',10]]) {
    const row = raw(); row[headers[8]] = answer;
    assert.equal(mapGoogleAssessmentRow(row).expertiseUniqueness, Number(((20+expected)/3).toFixed(2)));
  }
});
test('maps the revised real form documentation wording', () => {
  const row = raw(); delete row[headers[3]];
  row['4. If a capable colleague used the available documentation, what percentage of your tasks could they finish without your help?'] = '>80%';
  assert.equal(mapGoogleAssessmentRow(row).documentationGap, 5.33);
});
test('rejects empty, unknown and unmapped input instead of substituting 5', () => {
  assert.throws(() => mapGoogleAssessmentRow({ something: 'unknown' }), /No recognized answers/);
  for (const value of ['', 'not an answer']) {
    const row = raw(); row[headers[3]] = value;
    assert.throws(() => mapGoogleAssessmentRow(row), /unrecognized answer/);
  }
});
test('keeps direct manager values on their explicit 1-10 scale', () => {
  const mapped = mapGoogleAssessmentRow({ EU: 2, DG: 4, PC: 5, CD: 1, manager_notes: 'fixture' });
  assert.deepEqual([mapped.expertiseUniqueness,mapped.documentationGap,mapped.projectCriticality,mapped.collaborationDependency], [2,4,5,1]);
  assert.throws(() => mapGoogleAssessmentRow({ EU: 0,DG:4,PC:5,CD:1 }), /Invalid/);
});
test('maps each quarter dictionary independently with complete five-option Likert support', () => {
  for (let q=0;q<4;q++) {
    const row = {};
    for (const entry of multiQuarterDictionary.slice(q*10,q*10+10)) row[entry.snippet] = entry.isReverse ? 'Disagree' : Object.keys(entry.map)[0];
    const mapped = mapGoogleAssessmentRow(row);
    assert.ok([mapped.expertiseUniqueness,mapped.documentationGap,mapped.projectCriticality,mapped.collaborationDependency].every(Number.isFinite));
  }
});
