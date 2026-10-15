import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  ArrowUpRight, 
  X,
  AlertCircle,
  Hash,
  Activity,
  DollarSign,
  PieChart
} from 'lucide-react'
import { useDeleteQuote, useQuotes } from '../hooks/useQuotes'
import { StatusBadge } from '../components/Dashboard/StatusBadge'
import { formatCurrency, formatDate } from '../lib/utils'
import { QuoteStatus } from '../types'
import clsx from 'clsx'

const STATUS_FILTERS: (QuoteStatus | 'All')[] = ['All', 'Draft', 'Sent', 'Approved', 'Won', 'Lost']

export function QuotesPage() {
  const { data: quotes = [], isLoading } = useQuotes()
  const deleteQuote = useDeleteQuote()
  
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QuoteStatus | 'All'>('All')
  const [quoteToDelete, setQuoteToDelete] = useState<{ id: string, ref: string } | null>(null)

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const matchesStatus = status === 'All' || q.status === status
      const term = search.toLowerCase()
      const matchesSearch =
        !term ||
        q.reference_id.toLowerCase().includes(term) ||
        q.project_name.toLowerCase().includes(term) ||
        (q.client?.company_name || '').toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [quotes, search, status])

  const stats = {
    totalValue: quotes.reduce((sum, q) => sum + (q.grand_total || 0), 0),
    activeCount: quotes.filter(q => q.status !== 'Won' && q.status !== 'Lost').length,
    winRate: quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'Won').length / quotes.length) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-[#202060]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* 1. TOP METRICS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <DollarSign size={16} className="text-[#00adee]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Value</p>
            </div>
            <p className="text-4xl font-bold text-[#202060] tracking-tighter">
                {formatCurrency(stats.totalValue).split('.')[0]}
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <Activity size={16} className="text-[#0071fe]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Negotiations</p>
            </div>
            <p className="text-4xl font-bold text-[#202060]">{stats.activeCount}</p>
          </div>
          <div className="bg-[#202060] p-8 rounded-[32px] shadow-xl shadow-navy-900/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Win Velocity</p>
              <p className="text-4xl font-bold text-white">{stats.winRate}%</p>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#00adee]">
              <PieChart size={28} />
            </div>
          </div>
        </div>

        {/* 2. ACTION & FILTER BAR */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm">
          <div className="relative flex-1 max-w-md group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071fe] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, client or project..."
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 overflow-x-auto">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  status === s 
                    ? 'bg-white text-[#202060] shadow-sm' 
                    : 'text-gray-400 hover:text-[#202060]'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <Link 
            to="/quotes/new" 
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#0071fe] text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-[#202060] transition-all"
          >
            <Plus size={18} />
            <span>New Quote</span>
          </Link>
        </div>

        {/* 3. MAIN TABLE MODULE */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-32 text-center">
                 <div className="w-8 h-8 border-4 border-[#00adee] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Syncing Pipeline...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-32 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">No quotes found in this view</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ref ID</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project & Client</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Value</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((q) => (
                    <tr key={q.id} className="group hover:bg-[#F8FAFC] transition-colors">
                      {/* Ref ID */}
                      <td className="px-8 py-6">
                        <Link to={`/quotes/${q.id}`} className="inline-flex items-center gap-2 group/ref">
                           <div className="p-2 bg-gray-50 rounded-lg group-hover/ref:bg-[#0071fe] group-hover/ref:text-white transition-colors">
                               <Hash size={14} className="opacity-40" />
                           </div>
                           <span className="font-mono text-xs font-bold text-[#202060] group-hover/ref:text-[#0071fe] transition-colors">
                                {q.reference_id}
                           </span>
                        </Link>
                      </td>

                      {/* Project & Client */}
                      <td className="px-8 py-6">
                        <p className="font-bold text-[#202060] text-sm group-hover:text-[#0071fe] transition-colors truncate max-w-[300px]">
                            {q.project_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            {q.client?.company_name || 'Individual Entity'}
                        </p>
                      </td>

                      {/* Value */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#202060] tabular-nums">
                                {formatCurrency(q.grand_total).split('.')[0]}
                                <span className="opacity-30 text-[10px]">.00</span>
                            </span>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">CAD Total</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-6">
                        <StatusBadge status={q.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Link 
                            to={`/quotes/${q.id}`} 
                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-[#202060] hover:text-[#0071fe] hover:shadow-md transition-all"
                          >
                            <ArrowUpRight size={18} />
                          </Link>
                          <button 
                            onClick={() => setQuoteToDelete({ id: q.id, ref: q.reference_id })}
                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-[#fa0202] hover:shadow-md transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Showing {filtered.length} quotes in active register
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#00adee]" /> Drafts</div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Won</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL DELETE COMPONENT */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#202060]/20 backdrop-blur-md" onClick={() => setQuoteToDelete(null)} />
          
          <div className="relative bg-white border border-gray-100 rounded-[40px] shadow-2xl w-full max-w-[440px] overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-10 space-y-8">
               <div className="flex justify-between items-center">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-[#fa0202]">
                    <AlertCircle size={28} />
                  </div>
                  <button onClick={() => setQuoteToDelete(null)} className="p-2 text-gray-300 hover:text-[#202060] transition-colors">
                    <X size={24} />
                  </button>
               </div>
               
               <div className="space-y-3">
                 <h3 className="text-2xl font-bold text-[#202060] tracking-tight">Archive Quote?</h3>
                 <p className="text-sm text-gray-500 leading-relaxed font-medium">
                   Are you sure you want to remove <span className="text-[#202060] font-bold">[{quoteToDelete.ref}]</span>? 
                   This action is recorded and cannot be undone from the active ledger.
                 </p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <button
                     onClick={() => setQuoteToDelete(null)}
                     className="py-4 rounded-2xl bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                     Keep Record
                  </button>
                  <button
                     onClick={() => {
                       deleteQuote.mutate(quoteToDelete.id)
                       setQuoteToDelete(null)
                     }}
                     className="py-4 rounded-2xl bg-[#fa0202] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                     Delete Permanent
                  </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}