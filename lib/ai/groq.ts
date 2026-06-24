import { parseSSEStream } from './stream'

// llama-3.3-70b-versatile was deprecated June 17, 2026.
// qwen/qwen3.6-27b is Groq's recommended replacement.
// reasoning_effort: 'none' puts it in non-thinking mode (fast conversational dialogue).
// Verify at https://console.groq.com/docs/models
const MODEL = 'qwen/qwen3.6-27b'

type GroqMessage = { role: 'user' | 'assistant' | 'system'; content: string }

export async function streamGroq(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; text: string }[],
  onToken: (token: string) => void
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const groqMessages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.text,
    })),
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: groqMessages,
      max_tokens: 600,
      temperature: 0.7,   // recommended for qwen non-thinking mode
      top_p: 0.80,
      stream: true,
      reasoning_effort: 'none',  // disable thinking — keep dialogue fast and clean
    }),
  })

  if (!response.ok) throw new Error(`Groq ${response.status}`)

  let fullText = ''

  for await (const line of parseSSEStream(response.body!)) {
    if (!line || line === '[DONE]') continue
    try {
      const data = JSON.parse(line)
      const token: string = data?.choices?.[0]?.delta?.content ?? ''
      if (token) {
        fullText += token
        onToken(token)
      }
    } catch {
      // skip
    }
  }

  return fullText
}

export async function generateGroq(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.1,
      stream: false,
      reasoning_effort: 'none',
    }),
  })

  if (!response.ok) throw new Error(`Groq extraction error: ${response.status}`)
  const data = await response.json()
  return data?.choices?.[0]?.message?.content ?? ''
    }
