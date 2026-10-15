// supabase/functions/ai-quote-chat/index.ts
//
// Lets the user keep talking to the AI after a quote draft has been
// generated (or on any existing quote): "reduce technician hours to 12",
// "add 2 more consumable cans", "this is actually a 2-day job", etc.
// Takes the current line items + quote meta + the user's instruction, and
// returns the updated fields plus a short assistant reply.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'
import { callAI, extractJson, ContentPart, AIProvider } from '../_shared/ai.ts'

interface RateItemInput {
  id: string
  name: string
  qualification: string | null
  unit: string
  rate: number
  category_name: string
}

interface CurrentLineItem {
  id: string
  description: string
  qualification?: string | null
  quantity: number
  unit: string
  rate: number
  category_name: string
  is_call_out: boolean
}

interface RequestBody {
  provider: AIProvider
  instruction: string
  currentState: {
    project_name: string
    project_location: string | null
    line_items: CurrentLineItem[]
    notes: string | null
  }
  rateSheet: RateItemInput[]
  history?: { role: 'user' | 'assistant'; content: string }[]
}

function buildSystemPrompt(rateSheet: RateItemInput[]) {
  const rateSheetText = rateSheet
    .map((r) => `- [${r.category_name}] "${r.name}" — $${r.rate}/${r.unit} (id: ${r.id})`)
    .join('\n')

  return `You are an editing assistant for a quote in Vingrity NDT & Technical Inc.'s quoting tool. The user will give you a plain-English instruction to change the current quote draft (adjust hours, add/remove line items, change quantities, change the project name or location, etc).

RATE SHEET AVAILABLE FOR NEW LINE ITEMS (use exact name/unit/rate; you may still hand-adjust a rate if the user explicitly asks for a discount or override):
${rateSheetText}

Apply the user's instruction to the current quote state provided. Keep every line item the user didn't ask to change exactly as-is (same id, description, quantity, etc) unless the instruction implies otherwise. When adding a new line item, invent a new unique "id" as a short random string.

Respond with ONLY a single JSON object (no markdown fences, no commentary) matching this exact shape:
{
  "project_name": string,
  "project_location": string | null,
  "line_items": [
    {
      "id": string,
      "description": string,
      "qualification": string | null,
      "quantity": number,
      "unit": string,
      "rate": number,
      "category_name": string,
      "is_call_out": boolean
    }
  ],
  "notes": string | null,
  "assistant_reply": string
}

"assistant_reply" should be a short, friendly, 1-3 sentence confirmation of what you changed — this is shown directly to the user in a chat bubble.`
}

serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const body: RequestBody = await req.json()
    const { provider, instruction, currentState, rateSheet, history = [] } = body

    if (!instruction?.trim()) {
      throw new Error('Provide an instruction, e.g. "reduce technician hours to 12".')
    }

    const system = buildSystemPrompt(rateSheet)

    const historyText = history
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n')

    const userContent: ContentPart[] = [
      {
        type: 'text',
        text: `CURRENT QUOTE STATE:\n${JSON.stringify(currentState, null, 2)}\n\n${
          historyText ? `RECENT CONVERSATION:\n${historyText}\n\n` : ''
        }NEW INSTRUCTION:\n${instruction}`,
      },
    ]

    const rawResponse = await callAI({ provider, system, userContent, maxTokens: 4096 })
    const updated = extractJson(rawResponse)

    return new Response(JSON.stringify({ updated }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
      status: 400,
    })
  }
})
