import { useState, useEffect } from 'react'
import { 
  X, 
  FileDown, 
  Building2, 
  User, 
  Phone, 
  Calendar, 
  Loader2, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react'
import { Client } from '../../types'
import { useClients } from '../../hooks/useClients'
import { useRateItems } from '../../hooks/useRateItems'
import { useRateCategories } from '../../hooks/useRateCategories'
import { useAppStore } from '../../store/useAppStore'
import { exportRateSheetToPdf } from '../Export/exportRateSheetPdf'
import { DEFAULT_RATESHEET_TERMS, RateSheetCategoryPDF } from '../PDF/RateSheetPDF'
import { toast } from '../../store/useToastStore'
import { formatDate, formatCurrency, uid } from '../../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  initialClient?: Client | null
}

interface EditableItem {
  id: string
  name: string
  qualification: string
  rateDisplay: string
}

interface EditableCategory {
  categoryName: string
  items: EditableItem[]
}

// Fallback baseline standard rates if database rate_items is empty
const BASELINE_CATEGORIES: EditableCategory[] = [
  {
    categoryName: 'Hourly Rates: Non-Destructive Testing Services',
    items: [
      { id: '1', name: 'Single Ticket (VT)', qualification: 'CWB Level 2', rateDisplay: '$116.00 / Hour' },
      { id: '2', name: 'Dual Tickets (VT + MT or PT)', qualification: 'CWB Level 2 & CGSB level 2', rateDisplay: '$121.00 / Hour' },
      { id: '3', name: 'Dual Tickets (VT + UT/PMI)', qualification: 'CWB Level 2 & CGSB level 2', rateDisplay: '$128.00 / Hour' },
      { id: '4', name: 'Multi Tickets (VT + MT/PT + UT)', qualification: 'CWB Level 2 & CGSB level 2', rateDisplay: '$135.00 / Hour' },
    ],
  },
  {
    categoryName: 'Consumables',
    items: [
      { id: '5', name: 'MT – Wet and Dry Methods', qualification: '', rateDisplay: '$38.00 / Can' },
      { id: '6', name: 'PT – Liquid Penetrant and Developer', qualification: '', rateDisplay: '$38.00 / Can' },
      { id: '7', name: 'UT – High Temperature Couplant', qualification: '', rateDisplay: '$26.00 / oz.' },
    ],
  },
  {
    categoryName: 'Equipment and Other Charges',
    items: [
      { id: '8', name: 'Ultrasonic Thickness Meter', qualification: '', rateDisplay: '$100.00 / Day – non-high temperature couplant included' },
      { id: '9', name: 'UT Shear Wave Kit', qualification: '', rateDisplay: '$135.00 / Day – non-high temperature couplant included' },
      { id: '10', name: 'Hardness Testing – Mic 10 / Equivalent', qualification: '', rateDisplay: '$65.00 / Hour – All welds included' },
      { id: '11', name: 'Hardness Testing – Rebound Tester', qualification: '', rateDisplay: '$50.00 / Hour – All welds included' },
      { id: '12', name: 'XRF Testing Unit (PMI)', qualification: '', rateDisplay: '$145.00 / Day' },
      { id: '13', name: 'Ferrite Testing Unit', qualification: '', rateDisplay: '$145.00 / Day' },
      { id: '14', name: 'Meal Allowance (for projects more than a day (outside city))', qualification: '', rateDisplay: '$100.00 / Day' },
      { id: '15', name: 'Accommodations (Hotel)', qualification: '', rateDisplay: 'Charged as Actuals' },
      { id: '16', name: 'Vehicle to be charged within 100 km of Vingrity’s office', qualification: '', rateDisplay: '$79.00 / Shift' },
      { id: '17', name: 'Vehicle to be charged after 100 km Vingrity’s office', qualification: '', rateDisplay: '$155.00 / Day' },
      { id: '18', name: 'Mileage – To be charged after 100 km', qualification: '', rateDisplay: '$1.15 / km' },
    ],
  },
]

export function ExportRateSheetModal({ open, onClose, initialClient }: Props) {
  const { data: clients = [] } = useClients()
  const { data: dbRates = [] } = useRateItems()
  const { data: dbCategories = [] } = useRateCategories()
  const { currentUser } = useAppStore()

  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [contactRole, setContactRole] = useState('Business Development Manager')
  const [officePhone, setOfficePhone] = useState('')
  const [customRefId, setCustomRefId] = useState('')
  const [exporting, setExporting] = useState(false)

  // Editable dynamic categories & rate rows
  const [categories, setCategories] = useState<EditableCategory[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // Converts database rate items into the structured proposal categories
  const buildCategoriesFromDB = (): EditableCategory[] => {
    if (!dbRates || dbRates.length === 0) {
      return JSON.parse(JSON.stringify(BASELINE_CATEGORIES))
    }

    const map: Record<string, EditableItem[]> = {}
    
    // Sort items into their category names
    for (const r of dbRates) {
      const catName = r.category?.name || 'General Services'
      if (!map[catName]) map[catName] = []
      
      map[catName].push({
        id: r.id || uid(),
        name: r.name,
        qualification: r.qualification || '',
        rateDisplay: `${formatCurrency(r.rate)} / ${r.unit}`,
      })
    }

    // Preserve sort order from rate categories table
    const result: EditableCategory[] = []
    for (const cat of dbCategories) {
      if (map[cat.name] && map[cat.name].length > 0) {
        result.push({
          categoryName: cat.name,
          items: map[cat.name],
        })
        delete map[cat.name]
      }
    }

    // Append any remaining categories
    for (const [name, items] of Object.entries(map)) {
      result.push({ categoryName: name, items })
    }

    return result
  }

  // Initialize on modal open
  useEffect(() => {
    if (open) {
      const selected = initialClient || clients[0]
      if (selected) {
        setSelectedClientId(selected.id)
        setOfficePhone(selected.phone || '')
      }

      const now = new Date()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const yy = String(now.getFullYear()).slice(-2)
      const inits = (currentUser?.initials || 'PJ').toUpperCase()
      setCustomRefId(`${mm}${dd}${yy}${inits}01`)

      // Preload categories from Settings / DB rates
      setCategories(buildCategoriesFromDB())
    }
  }, [open, initialClient, clients, currentUser, dbRates, dbCategories])

  if (!open) return null

  const selectedClient = clients.find((c) => c.id === selectedClientId) || initialClient

  // Row update helpers
  const handleUpdateItem = (catIdx: number, itemIdx: number, field: keyof EditableItem, value: string) => {
    setCategories((prev) => {
      const copy = [...prev]
      copy[catIdx].items[itemIdx] = { ...copy[catIdx].items[itemIdx], [field]: value }
      return copy
    })
  }

  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev]
      copy[catIdx].items.splice(itemIdx, 1)
      return copy
    })
  }

  const handleAddItem = (catIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev]
      copy[catIdx].items.push({
        id: uid(),
        name: 'New Inspection Item',
        qualification: '',
        rateDisplay: '$100.00 / Hour',
      })
      return copy
    })
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    setCategories((prev) => [
      ...prev,
      {
        categoryName: newCatName.trim(),
        items: [
          {
            id: uid(),
            name: 'Service Item',
            qualification: '',
            rateDisplay: '$100.00 / Unit',
          },
        ],
      },
    ])
    setNewCatName('')
    setAddingCategory(false)
  }

  async function handleDownload() {
    if (!selectedClient) {
      toast({ type: 'warning', title: 'Select Client', description: 'Please select a client to issue the rate sheet to.' })
      return
    }

    setExporting(true)
    try {
      const issuer = currentUser || {
        id: 'user',
        full_name: 'Prathikson Jeyakumar',
        initials: 'PJ',
        email: 'dispatch@vingrity.com',
        phone: '(780)-667-4895',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
      }

      await exportRateSheetToPdf({
        client: {
          ...selectedClient,
          contact_role: contactRole,
          office_phone: officePhone,
        },
        issuer,
        referenceId: customRefId,
        dateStr: formatDate(new Date()),
        categories: categories as RateSheetCategoryPDF[],
        terms: DEFAULT_RATESHEET_TERMS,
      })

      toast({ type: 'success', title: 'Rate Sheet Proposal Generated' })
      onClose()
    } catch (err: any) {
      console.error(err)
      toast({ type: 'error', title: 'Export Failed', description: err.message || 'Could not generate PDF.' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202060]/30 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[36px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 text-[#202060] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0071fe] shadow-sm">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Client Rate Sheet Proposal</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                Technical & Commercial Format · Live Rate Editor
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-gray-400 hover:text-[#202060] transition-colors rounded-full hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* SECTION 1: PROPOSAL & CLIENT DETAILS */}
          <div className="bg-[#F8FAFC] p-6 rounded-[28px] border border-gray-100 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#0071fe] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={13} /> Proposal Metadata & Client Entity
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Target: {selectedClient?.company_name || 'Select Entity'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Recipient Client
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value)
                      const c = clients.find((item) => item.id === e.target.value)
                      if (c?.phone) setOfficePhone(c.phone)
                    }}
                    className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-8 text-xs font-bold text-[#202060] outline-none focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer shadow-sm"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} {c.contact_name ? `(${c.contact_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Proposal Reference ID
                </label>
                <input
                  value={customRefId}
                  onChange={(e) => setCustomRefId(e.target.value)}
                  placeholder="092926PJ01"
                  className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-4 text-xs font-mono font-bold text-[#202060] outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Contact Title / Role
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="Business Development Manager"
                    className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-9 pr-3 text-xs font-medium text-[#202060] outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Office / Direct Phone
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={officePhone}
                    onChange={(e) => setOfficePhone(e.target.value)}
                    placeholder="780-462-2251"
                    className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-9 pr-3 text-xs font-medium text-[#202060] outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Issue Date
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled
                    value={formatDate(new Date())}
                    className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-9 pr-3 text-xs font-bold text-gray-500 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: EDITABLE RATES AND CATEGORIES */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#202060]">Proposal Rates & Inclusions</h3>
                <p className="text-xs text-gray-400 font-medium">
                  Preloaded from your Settings Rate Sheet. Edits made here only affect this proposal document.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategories(buildCategoriesFromDB())}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-[#0071fe] bg-gray-50 hover:bg-blue-50 transition-all border border-gray-100"
                  title="Reload default rates from settings"
                >
                  <RotateCcw size={13} />
                  <span>Reset to Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#202060] hover:bg-[#0071fe] transition-all shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Category</span>
                </button>
              </div>
            </div>

            {/* Inline Add Category Bar */}
            {addingCategory && (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-3 animate-in fade-in-50 duration-200">
                <input
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name (e.g. Specialized Inspection / NDE)"
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-5 py-2.5 rounded-xl bg-[#0071fe] text-white text-xs font-bold hover:bg-[#202060] transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setAddingCategory(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Categories & Line Items */}
            <div className="space-y-6">
              {categories.map((cat, catIdx) => (
                <div key={catIdx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <input
                      value={cat.categoryName}
                      onChange={(e) => {
                        const val = e.target.value
                        setCategories((prev) => {
                          const copy = [...prev]
                          copy[catIdx].categoryName = val
                          return copy
                        })
                      }}
                      className="font-bold text-xs uppercase tracking-wider text-[#202060] bg-transparent border-none outline-none focus:bg-white px-2 py-1 rounded-lg transition-colors flex-1 max-w-md"
                    />

                    <button
                      type="button"
                      onClick={() => handleAddItem(catIdx)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0071fe] hover:text-[#202060] transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs"
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  </div>

                  <div className="p-4 space-y-2.5">
                    {cat.items.map((item, itemIdx) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 group/row p-2 rounded-2xl hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-gray-100">
                        {/* Description */}
                        <div className="flex-1">
                          <input
                            value={item.name}
                            onChange={(e) => handleUpdateItem(catIdx, itemIdx, 'name', e.target.value)}
                            placeholder="Description"
                            className="w-full bg-white sm:bg-transparent border border-gray-100 sm:border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-[#202060] focus:bg-white focus:border-blue-200 outline-none transition-all"
                          />
                        </div>

                        {/* Qualification (optional) */}
                        <div className="w-full sm:w-48">
                          <input
                            value={item.qualification}
                            onChange={(e) => handleUpdateItem(catIdx, itemIdx, 'qualification', e.target.value)}
                            placeholder="Qualification (optional)"
                            className="w-full bg-white sm:bg-transparent border border-gray-100 sm:border-transparent rounded-xl px-3 py-2 text-xs text-gray-500 placeholder:text-gray-300 focus:bg-white focus:border-blue-200 outline-none transition-all"
                          />
                        </div>

                        {/* Rate String / Terms */}
                        <div className="w-full sm:w-56">
                          <input
                            value={item.rateDisplay}
                            onChange={(e) => handleUpdateItem(catIdx, itemIdx, 'rateDisplay', e.target.value)}
                            placeholder="$116.00 / Hour"
                            className="w-full bg-white sm:bg-transparent border border-gray-100 sm:border-transparent rounded-xl px-3 py-2 text-xs font-bold text-[#0071fe] focus:bg-white focus:border-blue-200 outline-none transition-all text-left sm:text-right"
                          />
                        </div>

                        {/* Delete row */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(catIdx, itemIdx)}
                          className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors self-end sm:self-center"
                          title="Remove item from proposal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    {cat.items.length === 0 && (
                      <p className="text-center py-4 text-xs text-gray-400 font-medium">
                        No items in this category. Click "+ Add Item" above.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 md:p-8 pt-5 border-t border-gray-100 bg-white shrink-0 rounded-b-[36px]">
          <p className="text-[11px] text-gray-400 font-medium">
            Produces a styled 2-page PDF branded for Vingrity NDT & Technical Inc.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-gray-400 hover:text-[#202060] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={exporting || !selectedClient}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#0071fe] text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-[#202060] transition-all disabled:opacity-50"
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              <span>{exporting ? 'Generating PDF…' : 'Download Rate Sheet PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}