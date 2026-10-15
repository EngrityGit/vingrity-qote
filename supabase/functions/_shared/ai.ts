// Shared, provider-agnostic AI calling helper used by both the
// ai-quote-generate and ai-quote-chat Edge Functions.
//
// IMPORTANT: model names change over time — providers routinely retire old
// snapshots. The defaults below are current as of July 2026. If a request
// starts failing with a "model not found" / 404 / "deprecated" style error,
// check the provider's current model list and override via the matching
// secret (ANTHROPIC_MODEL / OPENAI_MODEL / GOOGLE_MODEL) rather than editing
// this file — e.g. `supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5`.

export type AIProvider = 'anthropic' | 'openai' | 'google'

export interface ImagePart {
  type: 'image'
  mediaType: string // e.g. "image/png"
  base64: string
}

export interface TextPart {
  type: 'text'
  text: string
}

export type ContentPart = TextPart | ImagePart

interface CallAIArgs {
  provider: AIProvider
  system: string
  userContent: ContentPart[]
  maxTokens?: number
}

function getEnv(name: string, fallback?: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required secret: ${name}. Set it with "supabase secrets set ${name}=..."`)
  }
  return value
}

export async function callAI({ provider, system, userContent, maxTokens = 4096 }: CallAIArgs): Promise<string> {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(system, userContent, maxTokens)
    case 'openai':
      return callOpenAI(system, userContent, maxTokens)
    case 'google':
      return callGoogle(system, userContent, maxTokens)
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

async function callAnthropic(system: string, userContent: ContentPart[], maxTokens: number): Promise<string> {
  const apiKey = getEnv('ANTHROPIC_API_KEY')
  const model = getEnv('ANTHROPIC_MODEL', 'claude-sonnet-4-6')

  const content = userContent.map((part) =>
    part.type === 'text'
      ? { type: 'text', text: part.text }
      : { type: 'image', source: { type: 'base64', media_type: part.mediaType, data: part.base64 } }
  )

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  const textBlock = data.content?.find((b: any) => b.type === 'text')
  return textBlock?.text ?? ''
}

async function callOpenAI(system: string, userContent: ContentPart[], maxTokens: number): Promise<string> {
  const apiKey = getEnv('OPENAI_API_KEY')
  // gpt-4o was removed from the ChatGPT product in Feb 2026 but remains
  // available via the API — if that changes, override with OPENAI_MODEL.
  const model = getEnv('OPENAI_MODEL', 'gpt-4o')

  const content = userContent.map((part) =>
    part.type === 'text'
      ? { type: 'text', text: part.text }
      : { type: 'image_url', image_url: { url: `data:${part.mediaType};base64,${part.base64}` } }
  )

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGoogle(system: string, userContent: ContentPart[], maxTokens: number): Promise<string> {
  const apiKey = getEnv('GOOGLE_API_KEY')
  const model = getEnv('GOOGLE_MODEL', 'gemini-flash-latest')

  const parts = userContent.map((part) =>
    part.type === 'text' ? { text: part.text } : { inline_data: { mime_type: part.mediaType, data: part.base64 } }
  )

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
}

/**
 * Extracts the first valid JSON object from a model's text response, in case
 * it wrapped the JSON in markdown fences or added commentary despite
 * instructions not to.
 */
export function extractJson(text: string): any {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse a JSON object from the AI response.')
  }
}
