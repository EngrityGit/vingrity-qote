import { LineItem } from '../types'
import { getProvinceTaxInfo, ProvinceCode } from './canadianTax'


/**
 * Builds a reference ID in the format MMDDYY + Initials + Daily Sequence
 * e.g. 070926PJ01
 */
export function buildReferenceId(date: Date, initials: string, sequence: number): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  const seq = String(sequence).padStart(2, '0')
  return `${mm}${dd}${yy}${initials.toUpperCase()}${seq}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value || 0)
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—'
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(d)
}

export function lineItemTotal(item: LineItem): number {
  let total = item.quantity * item.rate

  if (item.is_call_out) {
    const minHours = item.call_out_min_hours ?? 4
    const reportingHours = item.reporting_hours ?? 1
    const minTotal = (minHours + reportingHours) * item.rate
    total = Math.max(total, minTotal)
  }

  return total
}

export function calculateQuoteTotals(
  lineItems: LineItem[],
  province: ProvinceCode | string = 'AB',
  applyPst = false
) {
  const info = getProvinceTaxInfo(province)
  const subtotal = lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0)
  const gstAmount = subtotal * info.gstRate
  const pstAmount = applyPst ? subtotal * info.pstRate : 0
  const grandTotal = subtotal + gstAmount + pstAmount
  return {
    subtotal,
    gstRate: info.gstRate,
    gstAmount,
    isHst: info.isHst,
    pstRate: applyPst ? info.pstRate : 0,
    pstAmount,
    pstLabel: info.pstLabel,
    grandTotal,
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Draft':
      return 'bg-ink-100 text-ink-600'
    case 'Sent':
      return 'bg-brand-50 text-brand-600'
    case 'Approved':
      return 'bg-emerald-50 text-emerald-600'
    case 'Won':
      return 'bg-emerald-50 text-emerald-700'
    case 'Lost':
      return 'bg-red-50 text-red-600'
    case 'No Reply':
      return 'bg-amber-50 text-amber-700'
    case 'N/A':
    default:
      return 'bg-ink-100 text-ink-500'
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export function uid(): string {
  return crypto.randomUUID()
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:<mime>;base64," prefix — providers want raw base64.
      const base64 = result.split(',')[1] ?? result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
