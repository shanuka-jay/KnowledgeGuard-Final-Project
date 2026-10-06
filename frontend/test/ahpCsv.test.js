import test from 'node:test'
import assert from 'node:assert/strict'
import { formAnswerToAhpRatio, parseRawAHPGoogleFormsCsv } from '../src/utils/ahpCsv.js'

const headers = [
  'Compare: Expertise Uniqueness vs. Documentation Gap',
  'Compare: Expertise Uniqueness vs. Project Criticality',
  'Compare: Expertise Uniqueness vs. Collaboration Dependency',
  'Compare: Expertise Uniqueness vs. Tenure',
  'Compare: Documentation Gap vs. Project Criticality',
  'Compare: Documentation Gap vs. Collaboration Dependency',
  'Compare: Documentation Gap vs. Tenure',
  'Compare: Project Criticality vs. Collaboration Dependency',
  'Compare: Project Criticality vs. Tenure',
  'Compare: Collaboration Dependency vs. Tenure',
]

test('converts the form direction and neutral point to reciprocal AHP ratios', () => {
  const expected = [9, 7, 5, 3, 1, 1 / 3, 1 / 5, 1 / 7, 1 / 9]
  expected.forEach((ratio, index) => assert.equal(formAnswerToAhpRatio(index + 1), ratio))
  assert.throws(() => formAnswerToAhpRatio(0), /1 to 9/)
  assert.throws(() => formAnswerToAhpRatio('3.5'), /1 to 9/)
})

test('aggregates converted ratios by named columns, not numeric column position', () => {
  const reversedHeaders = [...headers].reverse()
  const csv = [
    ['Timestamp', ...reversedHeaders, 'Extra numeric field'].map(value => `"${value}"`).join(','),
    ['27/08/2026', ...Array(10).fill('5'), '99'].join(','),
    ['28/08/2026', ...Array(10).fill('5'), '88'].join(','),
  ].join('\r\n')
  const { matrix, responseCount } = parseRawAHPGoogleFormsCsv(csv)
  assert.equal(responseCount, 2)
  matrix.forEach((row, index) => row.forEach((value, other) =>
    assert.equal(value, index === other ? 1 : 1)))
})

test('uses geometric means after converting left and right preferences', () => {
  const csv = [
    ['Timestamp', ...headers].join(','),
    ['day one', 1, ...Array(9).fill(5)].join(','),
    ['day two', 3, ...Array(9).fill(5)].join(','),
  ].join('\n')
  const { matrix } = parseRawAHPGoogleFormsCsv(csv)
  assert.ok(Math.abs(matrix[0][1] - Math.sqrt(9 * 5)) < 1e-12)
  assert.ok(Math.abs(matrix[1][0] - 1 / Math.sqrt(9 * 5)) < 1e-12)
})

test('rejects incomplete responses instead of silently averaging them', () => {
  const csv = [
    ['Timestamp', ...headers].join(','),
    ['day one', ...Array(9).fill(5), ''].join(','),
  ].join('\n')
  assert.throws(() => parseRawAHPGoogleFormsCsv(csv), /Response row 2/)
})

test('rejects a CSV missing a required comparison column', () => {
  const csv = [['Timestamp', ...headers.slice(0, 9)].join(','), ['day one', ...Array(9).fill(5)].join(',')].join('\n')
  assert.throws(() => parseRawAHPGoogleFormsCsv(csv), /Expected exactly one column/)
})
