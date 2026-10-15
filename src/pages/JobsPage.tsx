import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useJobs, useUpdateJob } from '../hooks/useJobs'
import { formatDate } from '../lib/utils'
import { JobStatus } from '../types'
import { 
  CalendarClock, 
  ChevronDown, 
  MessageSquare, 
  ArrowUpRight, 
  Search, 
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_OPTIONS: (JobStatus | 'All')[] = ['All', 'Pending', 'Won', 'Lost', 'No Reply', 'N/A']

export function JobsPage() {
  const { data: jobs = [], isLoading } = useJobs()
  const updateJob = useUpdateJob()
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'All'>('All')
  const [editingReason, setEditingReason] = useState<string | null>(null)
  const [reasonText, setReasonText] = useState('')

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesStatus = statusFilter === 'All' || j.status === statusFilter
      const term = search.toLowerCase()
      const matchesSearch = 
        !term || 
        (j.job_name || '').toLowerCase().includes(term) || 
        (j.client?.company_name || '').toLowerCase().includes(term) ||
        (j.quote?.reference_id || '').toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [jobs, search, statusFilter])

  const stats = {
    total: jobs.length,
    won: jobs.filter(j => j.status === 'Won').length,
    pending: jobs.filter(j => j.status === 'Pending').length
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-[#202060]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* 1. TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <Activity size={14} className="text-[#00adee]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Ledger</p>
            </div>
            <p className="text-3xl font-bold text-[#202060]">{stats.total} Projects</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversion Rate</p>
            </div>
            <p className="text-3xl font-bold text-[#202060]">
                {jobs.length > 0 ? Math.round((stats.won / jobs.length) * 100) : 0}%
            </p>
          </div>
          <div className="bg-[#202060] p-6 rounded-[32px] shadow-xl shadow-navy-900/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Awaiting Decision</p>
              <p className="text-3xl font-bold text-white">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* 2. FILTER & SEARCH BAR */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm">
          <div className="relative flex-1 max-w-md group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071fe] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name or reference..."
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 overflow-x-auto">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === s 
                    ? 'bg-white text-[#202060] shadow-sm' 
                    : 'text-gray-400 hover:text-[#202060]'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 3. MAIN TABLE MODULE */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-32 text-center">
                 <div className="w-8 h-8 border-4 border-[#00adee] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Syncing Ledger...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-32 text-center">
                <CalendarClock size={40} className="mx-auto text-gray-100 mb-4" />
                <p className="text-sm font-bold text-gray-400">No matching outcomes found</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project & Client</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Engine</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Follow-up</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Intelligence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="group hover:bg-[#F8FAFC] transition-colors">
                      {/* Name & Client */}
                      <td className="px-8 py-6">
                        <p className="font-bold text-[#202060] text-sm group-hover:text-[#0071fe] transition-colors">{j.job_name}</p>
                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">{j.client?.company_name || 'Individual Entity'}</p>
                      </td>

                      {/* Reference ID */}
                      <td className="px-8 py-6">
                        {j.quote?.id ? (
                          <Link to={`/quotes/${j.quote.id}`} className="inline-flex items-center gap-2 group/ref">
                            <span className="font-mono text-xs font-bold text-[#0071fe] bg-blue-50 px-3 py-1 rounded-lg group-hover/ref:bg-[#0071fe] group-hover/ref:text-white transition-all">
                                {j.quote?.reference_id}
                            </span>
                            <ArrowUpRight size={14} className="text-gray-300 group-hover/ref:text-[#0071fe]" />
                          </Link>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-8 py-6">
                        <div className="relative inline-block w-40">
                          <select
                            value={j.status}
                            onChange={(e) => updateJob.mutate({ id: j.id, status: e.target.value as JobStatus })}
                            className={clsx(
                                "appearance-none w-full border-none rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer transition-all",
                                j.status === 'Won' ? 'bg-emerald-50 text-emerald-600' :
                                j.status === 'Lost' ? 'bg-red-50 text-[#fa0202]' :
                                j.status === 'Pending' ? 'bg-blue-50 text-[#0071fe]' : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            {STATUS_OPTIONS.filter(s => s !== 'All').map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={14} className="text-gray-300" />
                            <span className="text-xs font-bold tabular-nums">{formatDate(j.follow_up_date)}</span>
                        </div>
                      </td>

                      {/* Notes / Reason */}
                      <td className="px-8 py-6 min-w-[300px]">
                        {editingReason === j.id ? (
                          <input
                            className="w-full bg-[#F8FAFC] border-none rounded-xl py-2 px-4 text-xs outline-none ring-2 ring-[#0071fe]/20 focus:bg-white transition-all"
                            value={reasonText}
                            onChange={(e) => setReasonText(e.target.value)}
                            autoFocus
                            onBlur={() => {
                              updateJob.mutate({ id: j.id, won_lost_reason: reasonText })
                              setEditingReason(null)
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setEditingReason(j.id)
                              setReasonText(j.won_lost_reason || '')
                            }}
                            className="flex items-center gap-3 text-gray-400 hover:text-[#202060] transition-colors w-full group/note"
                          >
                            <MessageSquare size={16} className="opacity-20 group-hover/note:opacity-100 transition-opacity" />
                            <span className="text-xs italic truncate">
                              {j.won_lost_reason || 'Enter outcome intelligence...'}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-[#00adee]" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Follow-ups are automatically prioritized by project value
              </p>
            </div>
            <p className="text-[10px] font-bold text-gray-400">Total Entries: {filteredJobs.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}