const AHP_LABELS = [
  'expertiseUniqueness',
  'documentationGap',
  'projectCriticality',
  'collaborationDependency',
  'tenure',
];

const AHP_SIZE = AHP_LABELS.length;
const AHP_RANDOM_INDEX = 1.12;
const AHP_CONSISTENCY_THRESHOLD = 0.10;

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validatePairwiseMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== AHP_SIZE) {
    throw validationError('A 5x5 AHP comparison matrix is required.');
  }

  matrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== AHP_SIZE) {
      throw validationError('A 5x5 AHP comparison matrix is required.');
    }

    row.forEach((value, columnIndex) => {
      if (!Number.isFinite(value) || value <= 0) {
        throw validationError('AHP comparison values must be positive finite numbers.');
      }
      if (rowIndex === columnIndex && Math.abs(value - 1) > 0.0001) {
        throw validationError('AHP comparison-matrix diagonal values must be 1.');
      }
    });
  });

  for (let row = 0; row < AHP_SIZE; row += 1) {
    for (let column = row + 1; column < AHP_SIZE; column += 1) {
      const reciprocalProduct = matrix[row][column] * matrix[column][row];
      if (Math.abs(reciprocalProduct - 1) > 0.05) {
        throw validationError('AHP comparison-matrix values must be reciprocal.');
      }
    }
  }
}

function calculateAHP(matrix) {
  validatePairwiseMatrix(matrix);

  const columnSums = Array(AHP_SIZE).fill(0);
  matrix.forEach(row => row.forEach((value, column) => {
    columnSums[column] += value;
  }));

  const normalized = matrix.map(row => row.map((value, column) => value / columnSums[column]));
  const weights = normalized.map(row => row.reduce((sum, value) => sum + value, 0) / AHP_SIZE);
  const weightedSumVector = matrix.map(row => row.reduce((sum, value, column) => sum + value * weights[column], 0));
  const lambdaMax = weightedSumVector.reduce((sum, value, row) => sum + value / weights[row], 0) / AHP_SIZE;
  const consistencyIndex = (lambdaMax - AHP_SIZE) / (AHP_SIZE - 1);
  const consistencyRatio = consistencyIndex / AHP_RANDOM_INDEX;
  const weightObject = {};

  AHP_LABELS.forEach((label, index) => {
    weightObject[label] = Number(weights[index].toFixed(4));
  });

  return {
    weights: weightObject,
    consistencyRatio: Number(consistencyRatio.toFixed(4)),
    lambdaMax: Number(lambdaMax.toFixed(4)),
    isConsistent: consistencyRatio < AHP_CONSISTENCY_THRESHOLD,
  };
}

module.exports = {
  AHP_CONSISTENCY_THRESHOLD,
  calculateAHP,
  validatePairwiseMatrix,
};
