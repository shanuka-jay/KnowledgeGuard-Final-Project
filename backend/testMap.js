const { mapGoogleAssessmentRow } = require('./src/utils/googleFormsParser');
const fs = require('fs');

function test() {
  const content = fs.readFileSync('../test_data/02_assessments_sinhala_q3.csv', 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  for(let i=1; i<4; i++) {
    const rowStr = lines[i].replace(/^"|"$/g, '');
    const values = rowStr.split('","');
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });
    console.log('ROW:', row);
    console.log('MAPPED:', mapGoogleAssessmentRow(row));
  }
}
test();
