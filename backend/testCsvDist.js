const { mapGoogleAssessmentRow } = require('./src/utils/googleFormsParser');
const { calculateFormulaScore, classifyTier } = require('./src/services/scoringEngine');
const fs = require('fs');

function test() {
  const content = fs.readFileSync('../test_data/02_assessments_sinhala_q3.csv', 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  const results = {};
  for(let i=1; i<lines.length; i++) {
    if(!lines[i].trim()) continue;
    
    // Naive CSV split ignoring commas inside quotes for this specific test
    // Actually this CSV has quotes around everything, so we can split by ","
    const rowStr = lines[i].replace(/^"|"$/g, '');
    const values = rowStr.split('","');
    
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });
    
    const mapped = mapGoogleAssessmentRow(row);
    // tenure is approx 2 years (score 5) for most
    const formulaScore = calculateFormulaScore(mapped, 5);
    const tier = classifyTier(formulaScore);
    results[tier] = (results[tier] || 0) + 1;
  }
  
  console.log('Self Assessment Distribution:');
  console.log(results);
}
test();
