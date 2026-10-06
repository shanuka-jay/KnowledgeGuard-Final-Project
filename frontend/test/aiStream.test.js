import test from 'node:test'
import assert from 'node:assert/strict'
import { consumeAIStream } from '../src/utils/aiStream.js'

function stream(chunks) {
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({
    start(controller) { chunks.forEach(c => controller.enqueue(encoder.encode(c))); controller.close() },
  }))
}
test('joins split SSE frames and recognizes completion', async () => {
  let text = ''
  await consumeAIStream(stream(['data: {"text":"Hel', 'lo"}\n', '\ndata: {"text":" world"}\n\ndata: [DONE]\n\n']), t => text += t)
  assert.equal(text, 'Hello world')
})
test('supports CRLF frames and a final delimiter-free DONE', async () => {
  let text = ''
  await consumeAIStream(stream(['data: {"text":"OK"}\r\n\r', '\ndata: [DONE]']), t => text += t)
  assert.equal(text, 'OK')
})
test('shows the server model error rather than incorrectly blaming the key', async () => {
  const response = new Response(JSON.stringify({ message: 'Check GROQ_MODEL.' }), { status: 503 })
  await assert.rejects(consumeAIStream(response, () => {}), /Check GROQ_MODEL/)
})
test('does not silently swallow stream errors', async () => {
  await assert.rejects(consumeAIStream(stream(['data: {"error":"Quota exhausted"}\n\n']), () => {}), /Quota exhausted/)
})
test('rejects interrupted or empty answers', async () => {
  await assert.rejects(consumeAIStream(stream(['data: {"text":"partial"}\n\n']), () => {}), /interrupted/)
  await assert.rejects(consumeAIStream(stream(['data: [DONE]\n\n']), () => {}), /no answer/)
})
