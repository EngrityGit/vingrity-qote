import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
} from 'docx'
import { saveAs } from 'file-saver'
import { Quote } from '../../types'
import { formatCurrency, formatDate, lineItemTotal } from '../../lib/utils'

const BRAND_HEX = '0071FE'
const INK_HEX = '4B5563'

function cell(text: string, opts: { bold?: boolean; width?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; shaded?: boolean } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shaded ? { type: ShadingType.CLEAR, fill: 'F6F8FC' } : undefined,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts.bold, size: 18, color: opts.bold ? INK_HEX : undefined })],
      }),
    ],
  })
}

export async function exportQuoteToWord(quote: Quote) {
  const terms = quote.terms_and_conditions.split('\n').filter(Boolean)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'VINGRITY NDT & TECHNICAL INC.', bold: true, size: 32, color: BRAND_HEX }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '201, 9403 63 Ave NW, Edmonton, AB, T6E 0G2, Canada · Phone: (780) 800-6297 · info@vingrity.com',
                size: 18,
                color: INK_HEX,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'Technical and Commercial Proposal', color: BRAND_HEX })],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: `Reference: ${quote.reference_id}    `, bold: true }),
              new TextRun({ text: `Date: ${formatDate(quote.created_at)}` }),
            ],
            spacing: { after: 200 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  cell('Client', { bold: true, width: 25, shaded: true }),
                  cell(quote.client?.company_name ?? '—', { width: 25 }),
                  cell('Contact', { bold: true, width: 25, shaded: true }),
                  cell(quote.client?.contact_name ?? '—', { width: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  cell('Address', { bold: true, width: 25, shaded: true }),
                  cell(quote.client?.address ?? '—', { width: 25 }),
                  cell('Email', { bold: true, width: 25, shaded: true }),
                  cell(quote.client?.email ?? '—', { width: 25 }),
                ],
              }),
              new TableRow({
                children: [
                  cell('Project', { bold: true, width: 25, shaded: true }),
                  cell(quote.project_name, { width: 25 }),
                  cell('Issued By', { bold: true, width: 25, shaded: true }),
                  cell(quote.issued_by, { width: 25 }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Scope of Work & Rates', color: BRAND_HEX })],
            spacing: { before: 200, after: 150 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  cell('Description', { bold: true, width: 40, shaded: true }),
                  cell('Qty', { bold: true, width: 12, shaded: true }),
                  cell('Unit', { bold: true, width: 13, shaded: true }),
                  cell('Rate', { bold: true, width: 15, shaded: true }),
                  cell('Cost', { bold: true, width: 20, shaded: true, align: AlignmentType.RIGHT }),
                ],
              }),
              ...quote.line_items.map(
                (item) =>
                  new TableRow({
                    children: [
                      cell(item.description + (item.qualification ? ` (${item.qualification})` : ''), {
                        width: 40,
                      }),
                      cell(String(item.quantity), { width: 12 }),
                      cell(item.unit, { width: 13 }),
                      cell(formatCurrency(item.rate), { width: 15 }),
                      cell(formatCurrency(lineItemTotal(item)), { width: 20, align: AlignmentType.RIGHT }),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 150 } }),

          new Paragraph({
  alignment: AlignmentType.RIGHT,
  children: [new TextRun({ text: `Subtotal: ${formatCurrency(quote.subtotal)}`, size: 20 })],
}),
new Paragraph({
  alignment: AlignmentType.RIGHT,
  children: [
    new TextRun({
      text: `${quote.gst_rate >= 0.13 ? 'HST' : 'GST'} (${(quote.gst_rate * 100).toFixed(0)}%): ${formatCurrency(quote.gst_amount)}`,
      size: 20,
    }),
  ],
}),
...(quote.pst_amount > 0
  ? [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `PST/QST (${(quote.pst_rate * 100).toFixed(2)}%): ${formatCurrency(quote.pst_amount)}`,
            size: 20,
          }),
        ],
      }),
    ]
  : []),
new Paragraph({
  alignment: AlignmentType.RIGHT,
  children: [
    new TextRun({ text: `Grand Total: ${formatCurrency(quote.grand_total)}`, size: 24, bold: true, color: BRAND_HEX }),
  ],
  spacing: { after: 300 },
}),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'General Terms and Conditions', color: BRAND_HEX })],
            spacing: { before: 200, after: 150 },
          }),

          ...terms.map(
            (line) =>
              new Paragraph({
                children: [new TextRun({ text: line, size: 18, color: INK_HEX })],
                spacing: { after: 80 },
              })
          ),

          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'ECEEF2' } },
            children: [],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: quote.signature_name ? quote.signature_name : '',
                italics: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${quote.issued_by}    ·    ${formatDate(quote.created_at)}`, size: 18, color: INK_HEX }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `This quote is valid for ${quote.valid_days} days from the date of issue and is subject to the availability of technicians.`,
                size: 16,
                color: INK_HEX,
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `Vingrity_Quote_${quote.reference_id}.docx`)
}
