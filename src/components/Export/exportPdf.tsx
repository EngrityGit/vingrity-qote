import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { Quote } from '../../types'
import { QuotePDF } from '../PDF/QuotePDF'

export async function exportQuoteToPdf(quote: Quote) {
  const blob = await pdf(<QuotePDF quote={quote} />).toBlob()
  saveAs(blob, `Vingrity_Quote_${quote.reference_id}.pdf`)
}
