import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { Client, Profile } from '../../types'
import { RateSheetPDF, RateSheetCategoryPDF } from '../PDF/RateSheetPDF'

interface ExportRateSheetArgs {
  client: Client & { contact_role?: string; office_phone?: string }
  issuer: Profile
  referenceId: string
  dateStr: string
  categories: RateSheetCategoryPDF[]
  terms?: string[]
}

export async function exportRateSheetToPdf({
  client,
  issuer,
  referenceId,
  dateStr,
  categories,
  terms,
}: ExportRateSheetArgs) {
  const blob = await pdf(
    <RateSheetPDF
      client={client}
      issuer={issuer}
      referenceId={referenceId}
      dateStr={dateStr}
      categories={categories}
      terms={terms}
    />
  ).toBlob()

  const safeClient = (client.company_name || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_')
  saveAs(blob, `Vingrity_RateSheet_${safeClient}_${referenceId}.pdf`)
}