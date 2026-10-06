const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAHP } = require('../src/utils/ahp');

test('accepts a consistent AHP matrix', () => {
  const result = calculateAHP([
    [1, 2, 4, 4, 5],
    [0.5, 1, 2, 2, 2.5],
    [0.25, 0.5, 1, 1, 1.25],
    [0.25, 0.5, 1, 1, 1.25],
    [0.2, 0.4, 0.8, 0.8, 1],
  ]);

  assert.equal(result.isConsistent, true);
  assert.ok(result.consistencyRatio < 0.10);
  assert.ok(Math.abs(Object.values(result.weights).reduce((sum, value) => sum + value, 0) - 1) < 0.001);
});

test('marks a controlled inconsistent AHP matrix as ineligible for application', () => {
  const result = calculateAHP([
    [1, 2.2442, 2.4785, 2.4785, 2.4464],
    [0.4456, 1, 5.0713, 5.0386, 3.4968],
    [0.4035, 0.1972, 1, 4.9274, 3.0514],
    [0.4035, 0.1985, 0.2029, 1, 2.9113],
    [0.4088, 0.2860, 0.3277, 0.3435, 1],
  ]);

  assert.equal(result.isConsistent, false);
  assert.equal(result.consistencyRatio, 0.2);
});

test('rejects an invalid non-reciprocal AHP matrix', () => {
  assert.throws(
    () => calculateAHP([
      [1, 2, 3, 4, 5],
      [0.5, 1, 2, 2, 2],
      [0.5, 0.5, 1, 2, 2],
      [0.25, 0.5, 0.5, 1, 2],
      [0.2, 0.5, 0.5, 0.5, 1],
    ]),
    /reciprocal/,
  );
});
