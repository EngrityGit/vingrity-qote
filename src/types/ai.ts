export interface AIDraftLineItem {
  rate_item_id: string | null
  description: string
  qualification: string | null
  quantity: number
  unit: string
  rate: number
  category_name: string
  is_call_out: boolean
}

export interface AIQuoteDraft {
  project_name: string
  project_location: string | null
  client_name_guess: string | null
  line_items: AIDraftLineItem[]
  assumptions: string[]
  estimated_hours: number
  estimated_shifts: number
  travel_required: boolean
  distance_km: number | null
  nights_away: number | null
  hub_used: string | null
  notes: string
}

export interface PendingAttachment {
  fileName: string
  mediaType: string
  base64: string
  file: File
}
