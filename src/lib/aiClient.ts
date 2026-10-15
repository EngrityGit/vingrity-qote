import { supabase } from './supabase'
import { AIProvider, HubLocation, RateItem } from '../types'
import { AIQuoteDraft, PendingAttachment } from '../types/ai'

interface GenerateQuoteArgs {
  provider: AIProvider
  requestText: string
  attachments: PendingAttachment[]
  rateSheet: RateItem[]
  hubLocations: HubLocation[]
  clientNames: string[]
}

export async function generateQuoteWithAI({
  provider,
  requestText,
  attachments,
  rateSheet,
  hubLocations,
  clientNames,
}: GenerateQuoteArgs): Promise<AIQuoteDraft> {
  const { data, error } = await supabase.functions.invoke('ai-quote-generate', {
    body: {
      provider,
      requestText,
      attachments: attachments.map((a) => ({
        fileName: a.fileName,
        mediaType: a.mediaType,
        base64: a.base64,
      })),
      rateSheet: rateSheet.map((r) => ({
        id: r.id,
        name: r.name,
        qualification: r.qualification,
        unit: r.unit,
        rate: r.rate,
        category_name: r.category?.name ?? 'Other',
      })),
      hubLocations: hubLocations.map((h) => ({ name: h.name, address: h.address })),
      clientNames,
    },
  })

  if (error) throw new Error(error.message ?? 'AI request failed')
  if (data?.error) throw new Error(data.error)
  return data.draft as AIQuoteDraft
}

interface ChatEditArgs {
  provider: AIProvider
  instruction: string
  currentState: {
    project_name: string
    project_location: string | null
    line_items: any[]
    notes: string | null
  }
  rateSheet: RateItem[]
  history: { role: 'user' | 'assistant'; content: string }[]
}

export async function chatEditQuoteWithAI({
  provider,
  instruction,
  currentState,
  rateSheet,
  history,
}: ChatEditArgs) {
  const { data, error } = await supabase.functions.invoke('ai-quote-chat', {
    body: {
      provider,
      instruction,
      currentState,
      rateSheet: rateSheet.map((r) => ({
        id: r.id,
        name: r.name,
        qualification: r.qualification,
        unit: r.unit,
        rate: r.rate,
        category_name: r.category?.name ?? 'Other',
      })),
      history,
    },
  })

  if (error) throw new Error(error.message ?? 'AI request failed')
  if (data?.error) throw new Error(data.error)
  return data.updated
}
