import { useMemo, useState } from 'react'
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Building2, 
  Copy, 
  Check, 
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients'
import { ClientFormModal } from '../components/Clients/ClientFormModal'
import { Client } from '../types'
import { format } from 'date-fns'

// Helper for Clipboard Actions (Integrated Stone Style)
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-all ${
        copied ? 'bg-green-50 text-green-600' : 'text-gray-300 hover:text-[#0071fe] hover:bg-blue-50'
      }`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return clients
    return clients.filter(
      (c) =>
        (c.company_name || '').toLowerCase().includes(term) ||
        (c.contact_name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    )
  }, [clients, search])

  function handleSave(input: Partial<Client>) {
    if (editing) {
      updateClient.mutate(
        { id: editing.id, ...input },
        { onSuccess: () => closeModal() }
      )
    } else {
      createClient.mutate(input, { onSuccess: () => closeModal() })
    }
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-[#202060]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* 1. TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Directory</p>
            <p className="text-3xl font-bold text-[#202060]">{clients.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Entities</p>
            <p className="text-3xl font-bold text-[#00adee]">+{clients.slice(0, 5).length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Pipeline</p>
              <p className="text-3xl font-bold text-[#0071fe]">Active</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0071fe]">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        {/* 2. ACTION BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm">
          <div className="relative flex-1 max-w-md group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071fe] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, name, or email..."
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>
          
          <button 
            onClick={() => setModalOpen(true)} 
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#0071fe] text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-[#202060] transition-all"
          >
            <Plus size={18} />
            <span>Add New Entity</span>
          </button>
        </div>

        {/* 3. TABLE MODULE */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-32 text-center">
                <div className="w-8 h-8 border-4 border-[#00adee] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Syncing Records...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-32 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 size={32} className="text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">No matching clients found</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity & Contact</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Communication</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="group hover:bg-[#F8FAFC] transition-colors">
                      {/* Company & Name */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#202060] font-bold text-xs border border-gray-100 group-hover:bg-white transition-colors">
                            {c.company_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#202060] text-sm">{c.company_name}</p>
                            <p className="text-xs text-gray-400 font-medium">{c.contact_name || 'No contact assigned'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-8 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 group/cell">
                            <Mail size={12} className="text-[#00adee]" />
                            <span className="text-xs font-medium text-[#202060]">{c.email || '—'}</span>
                            {c.email && <CopyButton value={c.email} />}
                          </div>
                          <div className="flex items-center gap-2 group/cell">
                            <Phone size={12} className="text-gray-300" />
                            <span className="text-xs font-medium text-gray-500 tabular-nums">{c.phone || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 group/cell">
                          <MapPin size={14} className="text-gray-300 shrink-0" />
                          <span className="text-[11px] font-medium text-gray-400 truncate max-w-[200px]">
                            {c.address || 'No address registered'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => { setEditing(c); setModalOpen(true); }}
                            className="p-2 rounded-xl bg-white border border-gray-100 text-[#202060] hover:text-[#0071fe] hover:shadow-md transition-all"
                            title="Edit Entity"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Archive ${c.company_name}?`)) deleteClient.mutate(c.id); }}
                            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-[#fa0202] hover:shadow-md transition-all"
                            title="Archive"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="w-px h-4 bg-gray-100 mx-1" />
                          <button className="p-2 rounded-xl bg-[#F8FAFC] text-[#202060] hover:bg-[#202060] hover:text-white transition-all">
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer Pagination/Info */}
          <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Showing {filtered.length} of {clients.length} results
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Database Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL COMPONENT */}
      <ClientFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initial={editing}
        saving={createClient.isPending || updateClient.isPending}
      />
    </div>
  )
}