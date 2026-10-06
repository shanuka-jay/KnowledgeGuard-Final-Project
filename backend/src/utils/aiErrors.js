function describeAIError(error) {
  const status = error?.status;
  if (status === 401) return { status: 503, code: 'AI_AUTH', message: 'The AI provider rejected the configured API key. Ask the administrator to check it.' };
  if (status === 403) return { status: 503, code: 'AI_ACCESS', message: 'The AI provider denied access. Ask the administrator to check the account permissions.' };
  if (status === 404) return { status: 503, code: 'AI_MODEL', message: 'The configured AI model is unavailable to this account. Ask the administrator to check GROQ_MODEL.' };
  if (status === 429) return { status: 429, code: 'AI_RATE_LIMIT', message: 'The AI provider is rate-limited or has exhausted its quota. Please try again later.' };
  if (status === 400 || status === 422) return { status: 503, code: 'AI_REQUEST', message: 'The AI provider could not accept this request. Ask the administrator to check the model configuration.' };
  if (error?.code === 'AI_NOT_CONFIGURED') return { status: 503, code: 'AI_NOT_CONFIGURED', message: 'AI is not configured. Ask the administrator to set GROQ_API_KEY and restart the backend.' };
  return { status: 503, code: 'AI_UNAVAILABLE', message: 'The AI provider could not be reached or the response was interrupted. Please try again.' };
}

module.exports = { describeAIError };
