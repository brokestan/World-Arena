/**
 * SSE line-buffering utility.
 *
 * Gemini and Groq both send SSE over HTTP. TCP may deliver multiple
 * lines in one chunk, or split a single line across chunks.
 * This generator buffers correctly for both cases.
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''   // keep the (possibly incomplete) last line

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) {
        yield trimmed.slice(5).trim()
      }
    }
  }

  // flush remaining buffer
  if (buffer.trim().startsWith('data:')) {
    yield buffer.trim().slice(5).trim()
  }
}

/**
 * Emit a single SSE event to a ReadableStream controller.
 */
export function emitSSE(
  controller: ReadableStreamDefaultController,
  payload: Record<string, unknown>
): void {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
  )
  }
