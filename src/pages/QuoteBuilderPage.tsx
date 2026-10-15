import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  FileDown, 
  FileText as FileWord, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Lightbulb, 
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  ShieldCheck,
  CalendarDays,
  Navigation
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuote, useCreateQuote, useUpdateQuote, generateReferenceId } from '../hooks/useQuotes'
import { useClients } from '../hooks/useClients'
import { useAppStore } from '../store/useAppStore'
import { useAIDraftStore } from '../store/useAIDraftStore'
import { ClientSelect } from '../components/Quotes/ClientSelect'
import { LineItemsTable } from '../components/Quotes/LineItemsTable'
import { SignaturePad } from '../components/Quotes/SignaturePad'
import { AIQuoteGenerator } from '../components/Quotes/AIQuoteGenerator'
import { AIChatPanel } from '../components/Quotes/AIChatPanel'
import { AISummary, Client, DEFAULT_TERMS, LineItem, Quote, QuoteStatus } from '../types'
import { calculateQuoteTotals, formatCurrency, uid } from '../lib/utils'
import { exportQuoteToPdf } from '../components/Export/exportPdf'
import { exportQuoteToWord } from '../components/Export/exportWord'
import { toast } from '../store/useToastStore'
import { CANADIAN_PROVINCES, ProvinceCode } from '../lib/canadianTax'
import clsx from 'clsx'

const STATUS_OPTIONS: QuoteStatus[] = ['Draft', 'Sent', 'Approved', 'Won', 'Lost', 'No Reply', 'N/A']

export function QuoteBuilderPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  const { data: clients = [] } = useClients()
  const { pendingDraft, clearPendingDraft, pendingAttachments, pendingProvider } = useAIDraftStore()

  const { data: existingQuote, isLoading } = useQuote(isNew ? undefined : id)
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()

  // --- CORE FORM STATE ---
  const [province, setProvince] = useState<ProvinceCode>('AB')
  const [applyPst, setApplyPst] = useState(false)
  const [referenceId, setReferenceId] = useState<string>('')
  const [generatingRef, setGeneratingRef] = useState(isNew)
  const [client, setClient] = useState<Client | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectLocation, setProjectLocation] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('Draft')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  const [validDays, setValidDays] = useState(90)
  const [source, setSource] = useState<'manual' | 'ai'>('manual')
  const [aiSummary, setAISummary] = useState<AISummary | null>(null)
  const [notes, setNotes] = useState('')
  const [signature, setSignature] = useState<{
    signature_type: 'typed' | 'drawn' | null
    signature_data: string | null
    signature_name: string | null
  }>({ signature_type: 'typed', signature_data: null, signature_name: currentUser?.full_name ?? '' })

  // --- UI TOGGLES ---
  const [showAIChat, setShowAIChat] = useState(false)
  const [intelExpanded, setIntelExpanded] = useState(false) 
  const [fiscalExpanded, setFiscalExpanded] = useState(true)

  // 1. Initial Reference ID
  useEffect(() => {
    if (isNew && currentUser && !referenceId) {
      generateReferenceId(currentUser.initials)
        .then(setReferenceId)
        .finally(() => setGeneratingRef(false))
    }
  }, [isNew, currentUser, referenceId])

  // 2. Consume AI Drafts
  useEffect(() => {
    if (!isNew || !pendingDraft) return
    setProjectName(pendingDraft.project_name || '')
    setProjectLocation(pendingDraft.project_location || '')
    setSource('ai')
    setShowAIChat(true)
    setLineItems(pendingDraft.line_items.map(li => ({ 
        ...li, 
        id: uid(), 
        qualification: li.qualification ?? undefined,
        call_out_min_hours: 4, 
        reporting_hours: 1 
    })))
    setNotes(pendingDraft.notes || '')
    setAISummary({
      provider: pendingProvider ?? 'anthropic',
      assumptions: pendingDraft.assumptions || [],
      estimated_hours: pendingDraft.estimated_hours,
      estimated_shifts: pendingDraft.estimated_shifts,
      travel_required: pendingDraft.travel_required,
      generated_at: new Date().toISOString(),
    })
    if (pendingDraft.client_name_guess) {
      const match = clients.find(c => c.company_name.toLowerCase() === pendingDraft.client_name_guess!.toLowerCase())
      if (match) setClient(match)
    }
    clearPendingDraft()
    toast({ type: 'success', title: 'AI Draft Applied' })
  }, [isNew, pendingDraft, clients, clearPendingDraft, pendingProvider])

  // 3. Load Existing Quote
  useEffect(() => {
    if (existingQuote) {
      setProvince((existingQuote.province as ProvinceCode) ?? 'AB')
      setApplyPst(existingQuote.apply_pst ?? false)
      setReferenceId(existingQuote.reference_id)
      setClient(existingQuote.client ?? null)
      setProjectName(existingQuote.project_name)
      setProjectLocation(existingQuote.project_location ?? '')
      setStatus(existingQuote.status)
      setLineItems(existingQuote.line_items ?? [])
      setTerms(existingQuote.terms_and_conditions ?? DEFAULT_TERMS)
      setValidDays(existingQuote.valid_days ?? 90)
      setSource(existingQuote.source ?? 'manual')
      setAISummary(existingQuote.ai_summary ?? null)
      setSignature({
        signature_type: existingQuote.signature_type,
        signature_data: existingQuote.signature_data,
        signature_name: existingQuote.signature_name,
      })
      setNotes(existingQuote.notes ?? '')
    }
  }, [existingQuote])

  const totals = useMemo(() => calculateQuoteTotals(lineItems, province, applyPst), [lineItems, province, applyPst])

  // --- FINAL SAVE HANDLER ---
 function handleSave() {
  if (!currentUser?.id) {
    toast({ type: 'error', title: 'User not authenticated' });
    return;
  }

  if (!client) {
    toast({ type: 'warning', title: 'Select a client before saving' });
    return;
  }

  const payload = {
      reference_id: referenceId,
      client_id: client.id,
      // For the database, we store the ID in issued_by
      issued_by: currentUser.id, 
      // We also save the contact info so it's permanent on this record
      issued_by_email: currentUser.email || null,
      issued_by_phone: currentUser.phone || null, // adjust 'phone' to 'phone_number' if that's your store's key
      
      project_name: projectName,
      project_location: projectLocation || null,
      status,
      line_items: lineItems,
      terms_and_conditions: terms,
      subtotal: totals.subtotal,
      province,
      gst_rate: totals.gstRate,
      apply_pst: applyPst,
      pst_rate: totals.pstRate,
      pst_amount: totals.pstAmount,
      gst_amount: totals.gstAmount,
      grand_total: totals.grandTotal,
      signature_type: signature.signature_type,
      signature_data: signature.signature_data,
      signature_name: signature.signature_name,
      valid_days: validDays,
      notes: notes || null,
      source,
      ai_summary: aiSummary,
      sent_at: status === 'Sent' ? new Date().toISOString() : (existingQuote?.sent_at ?? null),
  }

  if (isNew) {
    createQuote.mutate(payload, {
      onSuccess: (q) => {
        toast({ type: 'success', title: 'Created Successfully' });
        navigate(`/quotes/${q.id}`, { replace: true });
      },
      onError: (err) => toast({ type: 'error', title: 'Save Failed', description: err instanceof Error ? err.message : 'Database error' })
    })
  } else {
    updateQuote.mutate({ id: id!, ...payload }, {
      onSuccess: () => toast({ type: 'success', title: 'Changes Saved' }),
      onError: (err) => toast({ type: 'error', title: 'Update Failed' })
    })
  }
}

  // Helper for internal use (Exports)
  const buildQuotePayload = () => ({
    reference_id: referenceId, 
    client_id: client?.id, 
    issued_by: currentUser?.id, // FIXED: Consistency for exports/logic
    project_name: projectName,
    project_location: projectLocation, 
    status, 
    line_items: lineItems,
    terms_and_conditions: terms, 
    subtotal: totals.subtotal, 
    province,
    gst_amount: totals.gstAmount, 
    pst_amount: totals.pstAmount, 
    grand_total: totals.grandTotal,
    signature_type: signature.signature_type, 
    signature_data: signature.signature_data,
    signature_name: signature.signature_name, 
    valid_days: validDays, 
    notes, 
    source, 
    ai_summary: aiSummary
  })

  const buildExportable = (): Quote => {
    // This object must contain EVERY field defined in your Quote interface
    const exportData: Quote = {
      // 1. Start with existing record data if available
      ...existingQuote,

      // 2. Overwrite with current form state
      id: id || 'temp-id',
      reference_id: referenceId,
      client_id: client?.id || '',
      client: client ?? undefined,
      project_name: projectName,
      project_location: projectLocation || null,
      
      // FIX: This is what shows up as the "Sender Name" in your PDF/Word
      issued_by: currentUser?.full_name || existingQuote?.issued_by || 'Local User',
      issued_by_email: currentUser?.email || existingQuote?.issued_by_email || null,
      issued_by_phone: currentUser?.phone || existingQuote?.issued_by_phone || null,

      status: status,
      line_items: lineItems,
      terms_and_conditions: terms,
      subtotal: totals.subtotal,
      province: province,
      
      // Tax calculations from your useMemo 'totals'
      gst_rate: totals.gstRate,
      gst_amount: totals.gstAmount,
      apply_pst: applyPst,
      pst_rate: totals.pstRate,
      pst_amount: totals.pstAmount,
      grand_total: totals.grandTotal,

      // Signature & Misc
      signature_type: signature.signature_type,
      signature_data: signature.signature_data,
      signature_name: signature.signature_name,
      valid_days: validDays,
      notes: notes || null,
      source: source,
      ai_summary: aiSummary,

      // Timestamps (required by interface)
      created_at: existingQuote?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sent_at: existingQuote?.sent_at || null,
      follow_up_at: existingQuote?.follow_up_at || null,
    };

    return exportData;
  };

  const handleExportPdf = async () => {
    if (!client || !projectName) {
      toast({ type: 'warning', title: 'Complete details first' });
      return;
    }
    try {
      const data = buildExportable();
      await exportQuoteToPdf(data);
      toast({ type: 'success', title: 'PDF Downloaded' });
    } catch (err) {
      console.error(err);
      toast({ type: 'error', title: 'Export Failed' });
    }
  };

  const handleExportWord = async () => {
    if (!client || !projectName) {
      toast({ type: 'warning', title: 'Complete details first' });
      return;
    }
    try {
      const data = buildExportable();
      await exportQuoteToWord(data);
      toast({ type: 'success', title: 'Word Doc Downloaded' });
    } catch (err) {
      console.error(err);
      toast({ type: 'error', title: 'Export Failed' });
    }
  };

  const saving = createQuote.isPending || updateQuote.isPending
  const showInlineGenerator = isNew && !projectName && lineItems.length === 0 && !aiSummary

  if (!isNew && isLoading) return <div className="p-20 text-center font-bold text-gray-400">Opening Record...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#202060]">
      
      {/* STICKY TOOLBAR */}
      <div className="sticky top-0 z-[60] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 md:px-10 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/quotes')} className="p-3 bg-gray-50 rounded-2xl hover:bg-white text-gray-400 hover:text-[#202060] transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Ledger</p>
               <p className="text-sm font-bold">{generatingRef ? 'GENERATING...' : referenceId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setShowAIChat(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#0071fe] font-bold text-xs border border-blue-50 shadow-sm hover:bg-blue-50 transition-all">
              <Sparkles size={14} />
              AI Assistant
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <button onClick={handleExportWord} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#202060] transition-all"><FileWord size={18} /></button>
            <button onClick={handleExportPdf} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#202060] transition-all"><FileDown size={18} /></button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex items-center gap-2 px-10 py-2.5 rounded-full bg-[#0071fe] text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:bg-[#202060] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isNew ? 'Create Quote' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 pb-40 space-y-10">
        
        {showInlineGenerator && <AIQuoteGenerator />}

        {/* 2. ESTIMATION INTELLIGENCE */}
        {aiSummary && (
          <section className="bg-[#ecf0f8] rounded-[40px] border border-[#d6e0f0] overflow-hidden shadow-sm">
            <button onClick={() => setIntelExpanded(!intelExpanded)} className="w-full flex items-center justify-between p-10 group text-left">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm"><Lightbulb size={28} className="text-[#0071fe]" /></div>
                <div><h3 className="text-xl font-bold">Operational Intelligence</h3><p className="text-[10px] font-black text-[#00adee] uppercase tracking-widest mt-1">AI Logic Analysis</p></div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-[#202060] group-hover:bg-white transition-all shadow-sm">
                 {intelExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </div>
            </button>
            <AnimatePresence>
              {intelExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-[#d6e0f0]">
                  <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Hours</p><p className="text-2xl font-bold">{aiSummary.estimated_hours || 0}</p></div>
                     <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Shifts</p><p className="text-2xl font-bold">{aiSummary.estimated_shifts || 0}</p></div>
                     <div className="md:col-span-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Key Assumptions</p>
                        <ul className="text-xs space-y-1 text-gray-600">
                           {aiSummary.assumptions.map((a, i) => <li key={i} className="flex gap-2"><div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"/>{a}</li>)}
                        </ul>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        <div className="grid grid-cols-12 gap-10 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block ml-1">Client Entity</label>
                  <ClientSelect value={client?.id ?? null} onChange={(c) => { setClient(c); if(c.province) setProvince(c.province as ProvinceCode); }} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block ml-1">Project Name</label>
                  <input className="w-full bg-[#F8FAFC] border-none rounded-2xl py-5 px-8 text-sm font-bold text-[#202060] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" value={projectName} onChange={e => setProjectName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block ml-1">Status</label>
                    <div className="relative">
                        <select className="w-full bg-[#F8FAFC] border-none rounded-2xl py-5 px-8 text-sm font-bold appearance-none cursor-pointer" value={status} onChange={e => setStatus(e.target.value as QuoteStatus)}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block ml-1">Validity (Days)</label>
                    <input type="number" className="w-full bg-[#F8FAFC] border-none rounded-2xl py-5 px-8 text-sm font-bold outline-none" value={validDays} onChange={e => setValidDays(parseInt(e.target.value) || 90)} />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm overflow-hidden">
               <LineItemsTable items={lineItems} onChange={setLineItems} />
            </section>

            <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block ml-1">Terms & Conditions</label>
               <textarea className="w-full h-[500px] bg-[#F8FAFC] border-none rounded-3xl p-10 text-[11px] font-mono leading-relaxed outline-none focus:bg-white transition-all text-gray-600 resize-none shadow-inner" value={terms} onChange={e => setTerms(e.target.value)} />
            </section>

            <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block ml-1">Internal Notes</label>
               <textarea className="w-full h-48 bg-[#F8FAFC] border-none rounded-3xl p-10 text-xs outline-none focus:bg-white transition-all text-gray-600 resize-none shadow-inner" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Confidential notes..." />
            </section>

            <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 block ml-1">Signature</label>
              <SignaturePad signatureType={signature.signature_type} signatureData={signature.signature_data} signatureName={signature.signature_name} onChange={(s:any) => setSignature(s)} />
            </section>
          </div>

          {/* FISCAL COLUMN */}
          <div className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <section className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-navy-900/5 overflow-hidden">
                <button onClick={() => setFiscalExpanded(!fiscalExpanded)} className={clsx("w-full p-8 flex items-center justify-between transition-colors", fiscalExpanded ? "bg-white" : "bg-[#202060] text-white")}>
                    <div className="flex items-center gap-3"><DollarSign size={20} className={fiscalExpanded ? "text-[#0071fe]" : "text-[#00adee]"} /><h3 className="text-xs font-black uppercase tracking-widest">Financial Ledger</h3></div>
                    {fiscalExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                    {fiscalExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="p-8 pt-0 space-y-8">
                                <div className="space-y-6 pt-6 border-t border-gray-50">
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Jurisdiction</label><div className="relative"><select className="w-full bg-[#F8FAFC] border-none rounded-xl py-3.5 px-5 text-xs font-bold outline-none appearance-none cursor-pointer" value={province} onChange={e => setProvince(e.target.value as ProvinceCode)}>{CANADIAN_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}</select><ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" /></div></div>
                                    <label className="flex items-center gap-4 p-5 bg-[#F8FAFC] rounded-2xl cursor-pointer hover:bg-[#ecf0f8] transition-colors border border-transparent hover:border-blue-100 group">
                                        <input type="checkbox" checked={applyPst} onChange={e => setApplyPst(e.target.checked)} className="w-6 h-6 rounded-lg border-2 border-gray-200 checked:bg-[#0071fe] checked:border-[#0071fe] appearance-none cursor-pointer transition-all" />
                                        <div><p className="text-xs font-bold text-[#202060]">Apply Provincial Tax</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Automatic Calculation</p></div>
                                    </label>
                                </div>
                                <div className="space-y-4 pt-8 border-t border-gray-50">
                                    <div className="flex justify-between text-sm text-gray-400"><span className="font-medium">Subtotal CAD</span><span className="text-[#202060] font-bold">{formatCurrency(totals.subtotal)}</span></div>
                                    <div className="flex justify-between text-sm text-gray-400"><span className="font-medium">Total Taxation</span><span className="text-[#202060] font-bold">{formatCurrency(totals.gstAmount + totals.pstAmount)}</span></div>
                                    <div className="pt-6"><div className="bg-[#ecf0f8] p-8 rounded-[32px] border border-blue-50"><p className="text-[10px] font-black text-[#00adee] uppercase tracking-[0.2em] mb-2">Grand Total Proposal</p><p className="text-4xl font-bold text-[#0071fe] tracking-tighter">{formatCurrency(totals.grandTotal)}</p></div></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {!fiscalExpanded && <div className="p-8 bg-[#202060] flex items-center justify-between border-t border-white/10"><p className="text-2xl font-bold text-white">{formatCurrency(totals.grandTotal)}</p><ShieldCheck size={20} className="text-emerald-500" /></div>}
            </section>
          </div>
        </div>
      </div>

      {/* AI CHAT PANEL */}
      <AnimatePresence>
        {showAIChat && (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAIChat(false)} className="fixed inset-0 bg-[#202060]/20 backdrop-blur-sm z-[100]" />
                <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white z-[110] flex flex-col shadow-2xl rounded-l-[40px] overflow-hidden">
                    <div className="p-8 bg-[#202060] text-white flex justify-between items-center">
                        <div className="flex items-center gap-4"><Sparkles size={24} className="text-[#00adee]" /><h3 className="text-lg font-bold">Assistant Panel</h3></div>
                        <button onClick={() => setShowAIChat(false)} className="p-2.5 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <AIChatPanel open={showAIChat} onClose={() => setShowAIChat(false)} projectName={projectName} projectLocation={projectLocation} lineItems={lineItems} notes={notes} defaultProvider={aiSummary?.provider} onApply={(c) => { 
                            if(c.project_name) setProjectName(c.project_name);
                            if(c.line_items) setLineItems(c.line_items);
                            toast({ type: 'success', title: 'Scope Updated' });
                        }} />
                    </div>
                </motion.aside>
            </>
        )}
      </AnimatePresence>
    </div>
  )
}