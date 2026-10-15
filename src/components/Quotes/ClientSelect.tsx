import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus, Search, Building2 } from 'lucide-react'
import { Client } from '../../types'
import { useClients, useCreateClient } from '../../hooks/useClients'
import { ClientFormModal } from '../Clients/ClientFormModal'

interface Props {
  value: string | null
  onChange: (client: Client) => void
}

export function ClientSelect({ value, onChange }: Props) {
  const { data: clients = [] } = useClients()
  const createClient = useCreateClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = clients.find((c) => c.id === value)

  const filtered = useMemo(() => {
    const term = query.toLowerCase()
    if (!term) return clients
    return clients.filter((c) => c.company_name.toLowerCase().includes(term))
  }, [clients, query])

  const showAddNew = query.length > 1 && !clients.some((c) => c.company_name.toLowerCase() === query.toLowerCase())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleQuickAdd() {
    createClient.mutate(
      { company_name: query },
      {
        onSuccess: (client) => {
          onChange(client)
          setOpen(false)
          setQuery('')
        },
      }
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between text-left"
      >
        <span className={selected ? 'text-ink-900' : 'text-ink-400'}>
          {selected ? selected.company_name : 'Select a client…'}
        </span>
        <ChevronDown size={16} className="text-ink-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 card shadow-popover z-30 overflow-hidden">
          <div className="p-2 border-b border-ink-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or type a new client name…"
                className="input pl-8 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 && !showAddNew && (
              <p className="text-xs text-ink-400 text-center py-6">No clients found.</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                  setQuery('')
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-ink-50 flex items-center gap-2.5 transition-colors"
              >
                <Building2 size={14} className="text-ink-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-ink-900 truncate">{c.company_name}</p>
                  {c.contact_name && <p className="text-xs text-ink-400 truncate">{c.contact_name}</p>}
                </div>
              </button>
            ))}
          </div>
          {showAddNew && (
            <button
              onClick={handleQuickAdd}
              disabled={createClient.isPending}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 border-t border-ink-100 text-brand-600 hover:bg-brand-50 text-sm font-medium transition-colors"
            >
              <Plus size={14} />
              Add "{query}" as a new client
            </button>
          )}
          <button
            onClick={() => {
              setModalOpen(true)
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 border-t border-ink-100 text-ink-500 hover:bg-ink-50 text-xs transition-colors"
          >
            <Plus size={13} />
            Add new client with full details
          </button>
        </div>
      )}

      <ClientFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        saving={createClient.isPending}
        onSave={(input) =>
          createClient.mutate(input, {
            onSuccess: (client) => {
              onChange(client)
              setModalOpen(false)
            },
          })
        }
      />
    </div>
  )
}
