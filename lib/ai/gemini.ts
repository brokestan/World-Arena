import { parseSSEStream } from './stream'

// gemini-2.0-flash was shut down June 1 2026.
// gemini-2.5-flash is the current GA price-performance model.
// Verify at https://ai.google.dev/gemini-api/docs/models
const MODEL = 'gemini-2.5-flash'

type GeminiMessage = { role: 'user' | 'model'; text: string }

/**
 * Stream a Gemini response, calling onToken for each text chunk.
 * Returns the full concatenated response text.
 *
 * thinkingConfig.thinkingBudget = 0 disables thinking tokens so they
 * never appear in the stream. Without this, gemini-2.5-flash may emit
 * thought parts that would leak into user-visible text.
 */
export async function streamGemini(
  systemPrompt: string,
  messages: GeminiMessage[],
  onToken: (token: string) => void
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`

  const body = {
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.82,
      thinkingConfig: { thinkingBudget: 0 }, // disable thinking tokens
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini ${response.status}: ${err}`)
  }

  let fullText = ''

  for await (const line of parseSSEStream(response.body!)) {
    if (!line || line === '[DONE]') continue
    try {
      const data = JSON.parse(line)
      // Filter out thought parts (thought: true) — only emit actual text
      const parts: Array<{ text?: string; thought?: boolean }> =
        data?.candidates?.[0]?.content?.parts ?? []
      for (const part of parts) {
        if (part.thought) continue
        const token = part.text ?? ''
        if (token) {
          fullText += token
          onToken(token)
        }
      }
    } catch {
      // skip malformed chunk
    }
  }

  return fullText
}

/**
 * Non-streaming Gemini call — used for extraction only (Phase B).
 */
export async function generateGemini(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

  const body = {
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 },
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(`Gemini extraction error: ${response.status}`)

  const data = await response.json()
  // Collect only non-thought text parts
  const parts: Array<{ text?: string; thought?: boolean }> =
    data?.candidates?.[0]?.content?.parts ?? []
  return parts
    .filter(p => !p.thought)
    .map(p => p.text ?? '')
    .join('')
        }
