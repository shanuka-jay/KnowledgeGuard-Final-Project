const fs = require('fs');
const { parse } = require('csv-parse');
const { mapGoogleAssessmentRow } = require('../src/utils/googleFormsParser');

const parser = parse({ columns: true, skip_empty_lines: true, trim: true });

fs.createReadStream('../../test_data/03_manager_validations_sinhala.csv')
  .pipe(parser)
  .on('data', (row) => {
    console.log("RAW ROW:", row);
    try {
      const mapped = mapGoogleAssessmentRow(row);
      console.log("MAPPED:", mapped);
    } catch(e) {
      console.log("ERROR MAPPING:", e.message);
    }
  })
  .on('end', () => console.log("DONE"));
