import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Client, Profile } from '../../types'

export interface RateSheetItemPDF {
  id: string
  name: string
  qualification?: string | null
  rateDisplay: string
}

export interface RateSheetCategoryPDF {
  categoryName: string
  items: RateSheetItemPDF[]
}

interface RateSheetData {
  client: Client & { contact_role?: string; office_phone?: string }
  issuer: Profile
  referenceId: string
  dateStr: string
  categories: RateSheetCategoryPDF[]
  terms?: string[]
}

const BRAND = '#0071fe'
const BRAND_NAVY = '#202060'
const INK_900 = '#0f172a'
const INK_600 = '#475569'
const INK_400 = '#94a3b8'
const INK_100 = '#e2e8f0'
const BG_SOFT = '#f8fafc'

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 55,
    paddingHorizontal: 40,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: INK_900,
    lineHeight: 1.35,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 12,
    marginBottom: 16,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 95,
    height: 44,
    marginRight: 12,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_NAVY,
  },
  companySub: {
    fontSize: 7.5,
    color: INK_600,
    marginTop: 1,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: INK_400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_NAVY,
    marginBottom: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: BRAND_NAVY,
    letterSpacing: 0.5,
  },
  badgeProposal: {
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  badgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: INK_100,
    borderRadius: 6,
    padding: 9,
    backgroundColor: BG_SOFT,
  },
  infoLabel: {
    fontSize: 6.5,
    color: INK_400,
    marginBottom: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 8.5,
    color: INK_900,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  infoSubValue: {
    fontSize: 8,
    color: INK_600,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: INK_100,
    paddingBottom: 3,
  },
  sectionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  table: {
    borderWidth: 1,
    borderColor: INK_100,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: INK_100,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: INK_100,
    minHeight: 18,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#fafbfc',
  },
  th: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: INK_600,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  td: {
    fontSize: 8,
    color: INK_900,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
  },
  tdRate: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_NAVY,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
  },
  termsGrid: {
    marginTop: 4,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 3.5,
    alignItems: 'flex-start',
  },
  termNumberBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 0.5,
  },
  termNumberText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_NAVY,
  },
  termText: {
    flex: 1,
    fontSize: 7.5,
    color: INK_600,
    lineHeight: 1.25,
    textAlign: 'justify',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: INK_100,
  },
  signatureBox: {
    width: '45%',
  },
  sigScript: {
    fontFamily: 'Times-Italic',
    fontSize: 20,
    color: BRAND,
    paddingVertical: 4,
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: INK_400,
    paddingTop: 4,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: INK_100,
    paddingTop: 8,
  },
  footerValidity: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_NAVY,
  },
  footerPage: {
    fontSize: 7,
    color: INK_400,
  },
})

export const DEFAULT_RATESHEET_TERMS = [
  'The rates mentioned above are in CAD, excluding Goods and Services Tax (GST).',
  'Electronic reports for all examinations will be submitted within 24 hours of the completed shift.',
  'Straight-time hours will be billed for all hours up to 8 hours per day.',
  'Hours worked beyond 8 hours per day will be charged at 1.5 times the straight-time hourly rate.',
  'Work performed on weekends and/or statutory holidays will be billed at 1.5 times the straight-time hourly rate.',
  'A night shift premium will be charged 10% above the base rate, if applicable.',
  'Night shifts are applicable when 75% of the work shift occurs after 5 PM or starts at 5 PM.',
  'The minimum call-out charge is 4 hours plus 1 hour reporting plus 1 hour for travel.',
  'Cancellations made less than 24 hours before the scheduled work date will incur the minimum call-out charge.',
  'Technical assistance, when required to maintain safety and/or productivity, will be charged to the customer.',
  'Subsistence applies when working hours and travel time cumulatively exceed 12 hours.',
  'The cost of Alcohol and Drug (A&D) testing, if required, is the responsibility of the Client.',
  'When the Client requests multiple skill sets within one shift, multi-ticketed technicians (if available) will be billed at the highest applicable technician rate for the duties performed during the shift.',
  'Utilization of any services constitutes acceptance of these rates.',
  'For the first inspection, signed reports will be issued only after payment confirmation.',
  'Payment terms are net 28 days. Late payments will incur an interest charge of 2% per month.',
]

export function RateSheetPDF({ client, issuer, referenceId, dateStr, categories, terms }: RateSheetData) {
  const termsToUse = terms || DEFAULT_RATESHEET_TERMS

  return (
    <Document title={`Vingrity_RateSheet_${client.company_name || 'Client'}_${referenceId}`}>
      <Page size="LETTER" style={styles.page} wrap={true}>
        {/* Running Header */}
        <View style={styles.headerRow} fixed>
          <View style={styles.brandBlock}>
            <Image src="/logo.png" style={styles.logo} />
            <View>
              <Text style={styles.companyName}>Vingrity NDT & Technical Inc.</Text>
              <Text style={styles.companySub}>201-9403 63 Ave NW, Edmonton, AB T6E 0G2</Text>
              <Text style={styles.companySub}>Phone: (780) 800-6297  ·  Email: info@vingrity.com  ·  www.vingrity.com</Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Proposal Ref</Text>
            <Text style={styles.metaValue}>{referenceId}</Text>
            <Text style={styles.metaLabel}>Date Issued</Text>
            <Text style={[styles.metaValue, { marginBottom: 0 }]}>{dateStr}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Technical and Commercial Proposal</Text>
          <View style={styles.badgeProposal}>
            <Text style={styles.badgeText}>Master Rate Agreement</Text>
          </View>
        </View>

        {/* Client & Issuer Info Cards */}
        <View style={styles.infoGrid}>
          {/* Client Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Client Details</Text>
            <Text style={styles.infoValue}>{client.company_name || '—'}</Text>
            
            <Text style={styles.infoLabel}>Office Address</Text>
            <Text style={styles.infoSubValue}>{client.address || '—'}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <View style={{ width: '48%' }}>
                <Text style={styles.infoLabel}>Representative</Text>
                <Text style={styles.infoSubValue}>{client.contact_name || '—'}</Text>
                <Text style={[styles.infoLabel, { marginTop: 2 }]}>Role</Text>
                <Text style={styles.infoSubValue}>{client.contact_role || 'Business Development Manager'}</Text>
              </View>
              <View style={{ width: '48%' }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoSubValue}>{client.email || '—'}</Text>
                <Text style={[styles.infoLabel, { marginTop: 2 }]}>Phone</Text>
                <Text style={styles.infoSubValue}>
                  {client.phone || '—'}
                  {client.office_phone ? `\nOff: ${client.office_phone}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Issuer Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Prepared & Issued By</Text>
            <Text style={styles.infoValue}>{issuer.full_name || 'Prathikson Jeyakumar'}</Text>
            
            <Text style={styles.infoLabel}>Department / Office</Text>
            <Text style={styles.infoSubValue}>Operations & Technical Estimation</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <View style={{ width: '48%' }}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoSubValue}>Operations Coordinator</Text>
                <Text style={[styles.infoLabel, { marginTop: 2 }]}>Dispatch Office</Text>
                <Text style={styles.infoSubValue}>Edmonton Hub</Text>
              </View>
              <View style={{ width: '48%' }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoSubValue}>{issuer.email || 'dispatch@vingrity.com'}</Text>
                <Text style={[styles.infoLabel, { marginTop: 2 }]}>Contact</Text>
                <Text style={styles.infoSubValue}>
                  (780) 800-6297
                  {issuer.phone ? `\nMob: ${issuer.phone}` : '\nMob: (780) 667-4895'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Categorized Rate Tables */}
        {categories.map((cat, catIdx) => {
          if (!cat.items || cat.items.length === 0) return null
          const hasQualifications = cat.items.some((it) => it.qualification && it.qualification.trim().length > 0)

          return (
            <View key={cat.categoryName || catIdx} wrap={false}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{cat.categoryName}</Text>
              </View>

              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  {hasQualifications ? (
                    <>
                      <Text style={[styles.th, { width: '42%' }]}>Description</Text>
                      <Text style={[styles.th, { width: '38%' }]}>Qualification Level</Text>
                      <Text style={[styles.th, { width: '20%', textAlign: 'right' }]}>Rate (CAD)</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.th, { width: '65%' }]}>Item Description / Specification</Text>
                      <Text style={[styles.th, { width: '35%', textAlign: 'right' }]}>Rate / Billing Term</Text>
                    </>
                  )}
                </View>

                {/* Table Rows */}
                {cat.items.map((item, itemIdx) => (
                  <View
                    key={item.id || itemIdx}
                    style={[
                      styles.tableRow,
                      itemIdx % 2 === 1 ? styles.tableRowEven : {},
                      itemIdx === cat.items.length - 1 ? { borderBottomWidth: 0 } : {},
                    ]}
                  >
                    {hasQualifications ? (
                      <>
                        <Text style={[styles.td, { width: '42%' }]}>{item.name}</Text>
                        <Text style={[styles.td, { width: '38%' }]}>{item.qualification || '—'}</Text>
                        <Text style={[styles.tdRate, { width: '20%', textAlign: 'right' }]}>{item.rateDisplay}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.td, { width: '65%' }]}>{item.name}</Text>
                        <Text style={[styles.tdRate, { width: '35%', textAlign: 'right' }]}>{item.rateDisplay}</Text>
                      </>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )
        })}

        {/* Terms and Conditions Block */}
        <View wrap={false}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>General Terms and Conditions</Text>
          </View>
          <View style={styles.termsGrid}>
            {termsToUse.map((term, idx) => (
              <View key={idx} style={styles.termItem}>
                <View style={styles.termNumberBadge}>
                  <Text style={styles.termNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Signature & Execution */}
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.infoLabel}>Authorized Representative (Vingrity)</Text>
            <Text style={styles.sigScript}>{issuer.full_name || 'Prathikson Jeyakumar'}</Text>
            <View style={styles.sigLine}>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: BRAND_NAVY }}>
                {issuer.full_name || 'Prathikson Jeyakumar'}
              </Text>
              <Text style={{ fontSize: 7.5, color: INK_400 }}>
                Operations Coordinator  ·  {dateStr}
              </Text>
            </View>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.infoLabel}>Client Acceptance & Authorization</Text>
            <View style={{ height: 26 }} />
            <View style={styles.sigLine}>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: INK_600 }}>
                Authorized Signature & Stamp
              </Text>
              <Text style={{ fontSize: 7.5, color: INK_400 }}>
                {client.company_name || 'Client Name'}  ·  Date: ____________
              </Text>
            </View>
          </View>
        </View>

        {/* Running Footer with Dynamic Page Number */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerValidity}>
            Valid for 30 days from date of issue · Subject to technician availability
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}