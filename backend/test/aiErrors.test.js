const test = require('node:test');
const assert = require('node:assert/strict');
const { describeAIError } = require('../src/utils/aiErrors');

test('distinguishes unavailable models from invalid keys', () => {
  assert.equal(describeAIError({ status: 404 }).code, 'AI_MODEL');
  assert.match(describeAIError({ status: 404 }).message, /GROQ_MODEL/);
  assert.equal(describeAIError({ status: 401 }).code, 'AI_AUTH');
});
test('preserves rate limits and recognizes missing configuration', () => {
  assert.equal(describeAIError({ status: 429 }).status, 429);
  assert.equal(describeAIError({ code: 'AI_NOT_CONFIGURED' }).code, 'AI_NOT_CONFIGURED');
});
test('does not expose upstream exception bodies or credentials', () => {
  assert.ok(!describeAIError(new Error('private credential and employee data')).message.includes('private'));
  assert.equal(describeAIError({ status: 500 }).status, 503);
});
