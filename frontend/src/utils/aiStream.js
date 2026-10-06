// Consume the chat protocol independently of React so error and chunk handling
// can be verified without provider calls or employee data.
export async function consumeAIStream(response, onText) {
  if (!response.ok) {
    let details;
    try { details = await response.json() } catch { /* non-JSON gateway error */ }
    throw new Error(details?.message || `AI request failed (HTTP ${response.status}). Please try again.`)
  }
  if (!response.body) throw new Error('The AI response was empty. Please try again.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let receivedText = false
  let completed = false
  function processFrame(frame) {
    for (const line of frame.split('\n')) {
      if (!line.startsWith('data:')) continue
      const value = line.slice(5).trim()
      if (value === '[DONE]') { completed = true; continue }
      let event
      try { event = JSON.parse(value) } catch { throw new Error('The AI response was malformed. Please try again.') }
      if (event.error) throw new Error(event.error)
      if (event.text) { receivedText = true; onText(event.text) }
    }
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      // Split both LF and CRLF delimiters, including delimiters across chunks.
      let boundary
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        processFrame(buffer.slice(0, boundary.index))
        buffer = buffer.slice(boundary.index + boundary[0].length)
      }
      if (done) break
    }
    if (buffer.trim()) processFrame(buffer)
    if (!completed) throw new Error('The AI response was interrupted. Please try again.')
    if (!receivedText) throw new Error('The AI returned no answer. Please try again.')
  } finally {
    try { await reader.cancel() } catch { /* already closed */ }
    reader.releaseLock()
  }
}
