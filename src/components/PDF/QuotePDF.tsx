import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Quote } from '../../types'
import { formatCurrency, formatDate, lineItemTotal } from '../../lib/utils'

const BRAND = '#0071fe'
const INK_900 = '#101828'
const INK_600 = '#4b5563'
const INK_400 = '#8f97a6'
const INK_100 = '#eceef2'

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 65,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: INK_900,
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 15,
    marginBottom: 20,
  },
  brandBlock: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 100,
    height: 50,
    marginRight: 15,
    objectFit: 'contain',
  },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: INK_900 },
  companySub: { fontSize: 8, color: INK_600, marginTop: 1 },
  
  metaRight: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 7, color: INK_400, textTransform: 'uppercase' },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 15, textTransform: 'uppercase' },
  
  infoGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: INK_100,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fafbfc',
  },
  infoLabel: { fontSize: 7, color: INK_400, marginBottom: 2, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  infoValue: { fontSize: 9, color: INK_900, marginBottom: 6 },

  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: INK_100,
    paddingBottom: 3,
  },
  
  table: { borderWidth: 1, borderColor: INK_100, borderRadius: 4, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f6f8fc' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: INK_100 },
  th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: INK_600, padding: 8 },
  td: { fontSize: 9, color: INK_900, padding: 8 },
  colDesc: { width: '40%' },
  colQty: { width: '10%' },
  colUnit: { width: '15%' },
  colRate: { width: '15%' },
  colTotal: { width: '20%', textAlign: 'right' },

  totalsBlock: { alignItems: 'flex-end', marginTop: 15 },
  totalsRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 4 },
  grandTotalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    backgroundColor: '#eef6ff',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },

  termsList: { marginTop: 5 },
  termItem: { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  termNumber: { width: 20, fontSize: 9, fontFamily: 'Helvetica-Bold', color: INK_900 },
  termText: { flex: 1, fontSize: 9, color: INK_600, textAlign: 'justify' },
  
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: INK_100,
  },
  signatureBlock: { width: '45%' },
  signatureText: { 
    fontFamily: 'Times-Italic', 
    fontSize: 18, 
    color: BRAND,
    paddingVertical: 8,
  },
  signatureImg: { width: 120, height: 50, objectFit: 'contain' },
  signatureLine: { borderTopWidth: 1, borderTopColor: INK_400, paddingTop: 5, marginTop: 5 },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7.5,
    color: INK_400,
    borderTopWidth: 1,
    borderTopColor: INK_100,
    paddingTop: 10,
  },
})

export function QuotePDF({ quote }: { quote: Quote }) {
  // Regex to strip leading numbers from terms to avoid "1. 1. Description"
  const terms = quote.terms_and_conditions
    .split('\n')
    .filter(t => t.trim() !== '')
    .map(line => line.replace(/^\d+[\.\)\-\s]*\s*/, '').trim());

  return (
    <Document title={`Quote ${quote.reference_id}`}>
      <Page size="LETTER" style={styles.page}>
        
        {/* HEADER - repeats on every page via 'fixed' */}
        <View style={styles.headerRow} fixed>
          <View style={styles.brandBlock}>
            <Image src="/logo.png" style={styles.logo} />
            <View>
              <Text style={styles.companyName}>Vingrity NDT & Technical Inc.</Text>
              <Text style={styles.companySub}>201, 9403 63 Ave NW, Edmonton, AB, T6E 0G2</Text>
              <Text style={styles.companySub}>Phone: (780) 800-6297 · Email: info@vingrity.com</Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Reference</Text>
            <Text style={styles.metaValue}>{quote.reference_id}</Text>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(quote.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.title}>Technical and Commercial Proposal</Text>

        {/* CLIENT & ISSUER INFO */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Client Details</Text>
            <Text style={styles.infoValue}>{quote.client?.company_name}</Text>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{quote.client?.address || '—'}</Text>
            <Text style={styles.infoLabel}>Contact Person</Text>
            <Text style={styles.infoValue}>{quote.client?.contact_name || '—'}</Text>
            <Text style={styles.infoLabel}>Contact Email</Text>
            <Text style={styles.infoValue}>{quote.client?.email || '—'}</Text>
            <Text style={styles.infoLabel}>Contact Phone</Text>
            <Text style={styles.infoValue}>{quote.client?.phone || '—'}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Issued By</Text>
            <Text style={styles.infoValue}>{quote.issued_by}</Text>
            <Text style={styles.infoLabel}>Office</Text>
            <Text style={styles.infoValue}>Operations Department</Text>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{quote.issued_by_email || '—'}</Text>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{quote.issued_by_phone || '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Project Overview</Text>
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 9 }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Project:</Text> {quote.project_name}</Text>
          <Text style={{ fontSize: 9 }}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Location:</Text> {quote.project_location || 'Not specified'}</Text>
        </View>

        {/* TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colUnit]}>Unit</Text>
            <Text style={[styles.th, styles.colRate]}>Rate</Text>
            <Text style={[styles.th, styles.colTotal]}>Amount</Text>
          </View>
          {quote.line_items.map((item) => (
            <View style={styles.tableRow} key={item.id} wrap={false}>
              <Text style={[styles.td, styles.colDesc]}>
                {item.description} {item.qualification ? `\n(${item.qualification})` : ''}
              </Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.td, styles.colRate]}>{formatCurrency(item.rate)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatCurrency(lineItemTotal(item))}</Text>
            </View>
          ))}
        </View>

<View style={styles.totalsBlock} wrap={false}>
  {/* Subtotal */}
  <View style={styles.totalsRow}>
    <Text style={{ fontSize: 9 }}>Subtotal</Text>
    <Text style={{ fontSize: 9 }}>{formatCurrency(quote.subtotal)}</Text>
  </View>

  {/* Dynamic GST or HST Line */}
  <View style={styles.totalsRow}>
    <Text style={{ fontSize: 9 }}>
      {/* If it's Ontario/HST province, show HST. Otherwise show GST */}
      {quote.province === 'ON' || quote.province === 'NS' || quote.province === 'NB' || quote.province === 'NL' || quote.province === 'PE' 
        ? 'HST' 
        : 'GST'} ({(quote.gst_rate * 100).toFixed(0)}%)
    </Text>
    <Text style={{ fontSize: 9 }}>{formatCurrency(quote.gst_amount)}</Text>
  </View>

  {/* PST/QST/RST - Only shows if applicable (e.g., BC, SK, QC) */}
  {quote.pst_amount > 0 && (
    <View style={styles.totalsRow}>
      <Text style={{ fontSize: 9 }}>
        {'PST'} ({(quote.pst_rate * 100).toFixed(quote.pst_rate * 100 % 1 === 0 ? 0 : 2)}%)
      </Text>
      <Text style={{ fontSize: 9 }}>{formatCurrency(quote.pst_amount)}</Text>
    </View>
  )}

  {/* Grand Total */}
  <View style={styles.grandTotalRow}>
    <Text style={{ fontFamily: 'Helvetica-Bold', color: BRAND, fontSize: 10 }}>Grand Total (CAD)</Text>
    <Text style={{ fontFamily: 'Helvetica-Bold', color: BRAND, fontSize: 11 }}>
      {formatCurrency(quote.grand_total)}
    </Text>
  </View>
</View>

        {/* NUMBERED TERMS SECTION */}
        <View wrap={false}>
          <Text style={styles.sectionTitle}>General Terms and Conditions</Text>
          <View style={styles.termsList}>
            {terms.map((line, i) => (
              <View style={styles.termItem} key={i}>
                <Text style={styles.termNumber}>{i + 1}.</Text>
                <Text style={styles.termText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SIGNATURES */}
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={styles.infoLabel}>Prepared By</Text>
            {/* Logic: If signature_data (image) exists use it, else fallback to script text */}
            {quote.signature_data ? (
              <Image src={quote.signature_data} style={styles.signatureImg} />
            ) : (
              <Text style={styles.signatureText}>
                {quote.signature_name || quote.issued_by}
              </Text>
            )}
            <View style={styles.signatureLine}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{quote.issued_by}</Text>
              <Text style={{ fontSize: 8, color: INK_400 }}>{formatDate(quote.created_at)}</Text>
            </View>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.infoLabel}>Accepted By (Client)</Text>
            <View style={{ height: 50 }} /> 
            <View style={styles.signatureLine}>
              <Text style={{ fontSize: 8, color: INK_400 }}>Authorized Signature & Date</Text>
            </View>
          </View>
        </View>

        {/* FOOTER - repeats on every page via 'fixed' */}
        <Text 
          style={styles.footer} 
          fixed 
          render={({ pageNumber, totalPages }) => (
            `Vingrity NDT & Technical Inc.  ·  Ref: ${quote.reference_id}  ·  Page ${pageNumber} of ${totalPages}`
          )} 
        />
      </Page>
    </Document>
  )
}