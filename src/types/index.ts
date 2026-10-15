export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Won' | 'Lost' | 'N/A' | 'No Reply'

export type JobStatus = 'Won' | 'Lost' | 'N/A' | 'No Reply' | 'Pending'

export type AIProvider = 'anthropic' | 'openai' | 'google'

export interface Client {
  id: string
  company_name: string
  address: string | null
  province: string | null
  email: string | null
  contact_name: string | null
  phone: string | null
  po_number: string | null
  created_at: string
  updated_at: string
}

export interface RateCategory {
  id: string
  name: string
  sort_order: number
  is_system: boolean
  created_at: string
}

export interface RateItem {
  id: string
  name: string
  description: string | null
  qualification: string | null
  unit: string // e.g. "hour", "visit", "can", "day", "night", "km"
  rate: number
  category_id: string
  category?: RateCategory
  is_default: boolean
  created_at: string
}

export interface LineItem {
  id: string
  description: string
  qualification?: string
  quantity: number
  unit: string
  rate: number
  is_call_out: boolean
  call_out_min_hours?: number
  reporting_hours?: number
  category_id?: string
  category_name: string // denormalized so line items still make sense if a category is later renamed/removed
}

export interface HubLocation {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
}

export interface AISummary {
  provider: AIProvider
  assumptions: string[]
  estimated_hours?: number
  estimated_shifts?: number
  travel_required?: boolean
  distance_km?: number
  nights_away?: number
  hub_used?: string
  raw_request_text?: string
  generated_at: string
}

export interface QuoteAttachment {
  id: string
  quote_id: string | null
  file_name: string
  storage_path: string
  content_type: string | null
  size_bytes: number | null
  created_at: string
}

export interface Quote {
  id: string
  reference_id: string
  client_id: string
  client?: Client
  project_name: string
  project_location: string | null
  issued_by: string
  issued_by_email: string | null
  issued_by_phone: string | null
  status: QuoteStatus
  line_items: LineItem[]
  terms_and_conditions: string
subtotal: number
  province: string
  gst_rate: number
  gst_amount: number
  apply_pst: boolean
  pst_rate: number
  pst_amount: number
  grand_total: number
  signature_type: 'typed' | 'drawn' | null
  signature_data: string | null
  signature_name: string | null
  valid_days: number
  notes: string | null
  source: 'manual' | 'ai'
  ai_summary: AISummary | null
  created_at: string
  updated_at: string
  sent_at: string | null
  follow_up_at: string | null
}

export interface Job {
  id: string
  quote_id: string
  quote?: Quote
  client_id: string
  client?: Client
  job_name: string
  status: JobStatus
  won_lost_reason: string | null
  follow_up_date: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

export interface AppNotification {
  id: string
  user_id: string | null
  quote_id: string | null
  job_id: string | null
  title: string
  message: string
  type: 'follow_up' | 'status_change' | 'system'
  is_read: boolean
  due_at: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  initials: string
  email: string
  phone: string | null
  role: 'admin' | 'member'
  status: 'invited' | 'active' | 'disabled'
  created_at: string
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const DEFAULT_TERMS = `1. The rates mentioned above are in CAD, excluding 5% GST.
2. Regular straight time rates include Monday to Friday for the first 8 hours of shift.
3. Overtime (OT) applies after 8 hours on weekdays, and all hours worked on weekends and statutory holidays at 1.5x regular time rate.
4. Minimum 4 hours call out charges plus 1 hour for reporting.
5. Minimum call out hours will be charged if a scheduled visit is cancelled with less than 24 hours' notice.
6. MT/PT consumables will be charged for each can of contrast and wet powder used.
7. Electronic reports for all examinations will be submitted within 24 hours of completed shift.
8. This quote assumes continuous workflow without delays due to material handling, and that all components are staged and accessible.
9. Travel, meals, and living out allowance (LOA) apply when work is performed outside the local service area of the issuing hub.
10. Payment term: Net 30 days of the invoice date. A 2% monthly interest will be charged for late payment.
11. This quote is valid for 90 days from the date of creation and is subject to the availability of technicians.`
