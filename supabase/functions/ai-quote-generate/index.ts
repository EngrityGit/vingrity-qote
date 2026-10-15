// supabase/functions/ai-quote-generate/index.ts
//
// Takes a pasted client request (email, RFQ text, verbal notes) plus optional
// image attachments (drawings/photos), and returns a structured quote draft:
// line items pulled from the real rate sheet, hours/shifts estimate, and
// travel/meals/LOA reasoning based on distance from the nearest hub.
//
// Deploy with: supabase functions deploy ai-quote-generate
// Requires one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY set via
// `supabase secrets set` depending on which provider(s) you want available.

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

interface HubLocationInput {
  name: string
  address: string
}

interface RequestBody {
  provider: AIProvider
  requestText: string
  attachments?: { fileName: string; mediaType: string; base64: string }[]
  rateSheet: RateItemInput[]
  hubLocations: HubLocationInput[]
  clientNames: string[]
}

function buildSystemPrompt(rateSheet: RateItemInput[], hubLocations: HubLocationInput[], clientNames: string[]) {
  const rateSheetText = rateSheet
    .map((r) => `- [${r.category_name}] "${r.name}"${r.qualification ? ` (${r.qualification})` : ''} — $${r.rate}/${r.unit} (id: ${r.id})`)
    .join('\n')

  const hubsText = hubLocations.map((h) => `- ${h.name}: ${h.address}`).join('\n')
  const clientsText = clientNames.length ? clientNames.join(', ') : '(no existing clients yet)'

  return `You are an estimating assistant for Vingrity NDT & Technical Inc., a Canadian NDT/NDE (Non-Destructive Testing/Examination) inspection company headquartered in Edmonton, AB with a secondary hub in Langley, BC.

Your job: read a client's request (an email, RFQ text, verbal notes, or a description of a job/drawing) and produce a complete, ready-to-send quote draft using ONLY the rates below. Never invent a rate that isn't listed. If something is needed that has no matching rate (e.g. a specific test method not in the sheet), include it as a line item with your best-estimate rate and clearly flag it in "assumptions" as needing manual review.

RATE SHEET (use exact "name", "unit", and "rate" values; reference the "id" when you use a rate item):
${rateSheetText}

HUB LOCATIONS (technicians are dispatched from here — use these to reason about travel):
${hubsText}

EXISTING CLIENTS ON FILE:
${clientsText}

REASONING RULES:
1. Estimate technician hours from the scope described (part counts, inspection method, complexity). State your reasoning briefly in "assumptions".
2. A standard shift is 8 hours. If total hours exceed what fits in reasonable shifts, calculate the number of shifts/visits needed.
3. If the project location is NOT within the same city/region as a hub, mark "travel_required": true, estimate one-way "distance_km" if you can reasonably infer it from the location named (state your estimate honestly; if you cannot infer distance, leave it null and say so in assumptions), and include a "Mileage" or "Service Vehicle" line item from the rate sheet as appropriate.
4. If travel requires an overnight stay (e.g. distance makes same-day return impractical, or the job spans multiple days), estimate "nights_away" and include LOA and Meals line items from the rate sheet for that many nights/days.
5. If the client name in the request matches (or closely resembles) an existing client on file, use that exact existing name in "client_name_guess". Otherwise put your best-guess company name from the request, or null if you can't tell.
6. Only recommend "is_call_out": true for technician labour lines where a minimum call-out charge genuinely applies (short jobs, single visits) — not for multi-day scopes.
7. If attached images show a drawing or nameplate, use them to refine part counts, weld lengths, or inspection scope.
8. Be conservative and transparent: when you're guessing, say so in "assumptions" rather than stating it as fact.

Respond with ONLY a single JSON object (no markdown fences, no commentary) matching this exact shape:
{
  "project_name": string,
  "project_location": string | null,
  "client_name_guess": string | null,
  "line_items": [
    {
      "rate_item_id": string | null,
      "description": string,
      "qualification": string | null,
      "quantity": number,
      "unit": string,
      "rate": number,
      "category_name": string,
      "is_call_out": boolean
    }
  ],
  "assumptions": string[],
  "estimated_hours": number,
  "estimated_shifts": number,
  "travel_required": boolean,
  "distance_km": number | null,
  "nights_away": number | null,
  "hub_used": string | null,
  "notes": string
}`
}

serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const body: RequestBody = await req.json()
    const { provider, requestText, attachments = [], rateSheet, hubLocations, clientNames } = body

    if (!requestText?.trim() && attachments.length === 0) {
      throw new Error('Provide some request text or at least one attachment.')
    }

    const system = buildSystemPrompt(rateSheet, hubLocations, clientNames)

    const userContent: ContentPart[] = [
      { type: 'text', text: `CLIENT REQUEST:\n${requestText || '(see attached image(s) only)'}` },
    ]

    for (const att of attachments) {
      if (att.mediaType.startsWith('image/')) {
        userContent.push({ type: 'image', mediaType: att.mediaType, base64: att.base64 })
      }
    }

    const rawResponse = await callAI({ provider, system, userContent, maxTokens: 4096 })
    const draft = extractJson(rawResponse)

    return new Response(JSON.stringify({ draft }), {
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
