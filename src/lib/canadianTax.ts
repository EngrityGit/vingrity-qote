// Canadian GST/HST/PST rates by province/territory. Verified July 2026 —
// double-check with your accountant/CRA before relying on this for filing.
//
// NDT/inspection services are GST/HST-taxable everywhere in Canada.
// Provincial PST/RST/QST (BC, SK, MB, QC) mainly targets goods and a few
// listed services — most inspection labour is PST-exempt in BC/SK/MB, but
// equipment rental or other taxable line items can still apply. That's why
// PST is toggleable per quote below rather than always-on.

export type ProvinceCode = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT'

export interface ProvinceTaxInfo {
  code: ProvinceCode
  label: string
  gstRate: number   // the GST rate, or the full HST rate if isHst is true
  isHst: boolean
  pstRate: number    // 0 if no separate provincial tax
  pstLabel: string   // "PST" | "QST" | "RST" | ""
}

export const CANADIAN_PROVINCES: ProvinceTaxInfo[] = [
  { code: 'AB', label: 'Alberta', gstRate: 0.05, isHst: false, pstRate: 0, pstLabel: '' },
  { code: 'BC', label: 'British Columbia', gstRate: 0.05, isHst: false, pstRate: 0.07, pstLabel: 'PST' },
  { code: 'MB', label: 'Manitoba', gstRate: 0.05, isHst: false, pstRate: 0.07, pstLabel: 'RST' },
  { code: 'NB', label: 'New Brunswick', gstRate: 0.15, isHst: true, pstRate: 0, pstLabel: '' },
  { code: 'NL', label: 'Newfoundland and Labrador', gstRate: 0.15, isHst: true, pstRate: 0, pstLabel: '' },
  { code: 'NS', label: 'Nova Scotia', gstRate: 0.14, isHst: true, pstRate: 0, pstLabel: '' },
  { code: 'NT', label: 'Northwest Territories', gstRate: 0.05, isHst: false, pstRate: 0, pstLabel: '' },
  { code: 'NU', label: 'Nunavut', gstRate: 0.05, isHst: false, pstRate: 0, pstLabel: '' },
  { code: 'ON', label: 'Ontario', gstRate: 0.13, isHst: true, pstRate: 0, pstLabel: '' },
  { code: 'PE', label: 'Prince Edward Island', gstRate: 0.15, isHst: true, pstRate: 0, pstLabel: '' },
  { code: 'QC', label: 'Quebec', gstRate: 0.05, isHst: false, pstRate: 0.09975, pstLabel: 'QST' },
  { code: 'SK', label: 'Saskatchewan', gstRate: 0.05, isHst: false, pstRate: 0.06, pstLabel: 'PST' },
  { code: 'YT', label: 'Yukon', gstRate: 0.05, isHst: false, pstRate: 0, pstLabel: '' },
]

export function getProvinceTaxInfo(code: ProvinceCode | string | null | undefined): ProvinceTaxInfo {
  return CANADIAN_PROVINCES.find((p) => p.code === code) ?? CANADIAN_PROVINCES.find((p) => p.code === 'AB')!
}

export function taxLineLabel(info: ProvinceTaxInfo): string {
  return info.isHst ? `HST (${(info.gstRate * 100).toFixed(0)}%)` : `GST (${(info.gstRate * 100).toFixed(0)}%)`
}