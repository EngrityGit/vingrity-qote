import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Client } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (input: Partial<Client>) => void
  initial?: Client | null
  saving?: boolean
}

const EMPTY = {
  company_name: '',
  address: '',
  email: '',
  contact_name: '',
  phone: '',
  po_number: '',
}

export function ClientFormModal({ open, onClose, onSave, initial, saving }: Props) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (initial) {
      setForm({
        company_name: initial.company_name ?? '',
        address: initial.address ?? '',
        email: initial.email ?? '',
        contact_name: initial.contact_name ?? '',
        phone: initial.phone ?? '',
        po_number: initial.po_number ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [initial, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 shadow-popover">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink-900">{initial ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Company Name</label>
            <input
              className="input"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Raj Steel Fabrication"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="1 Goodmark Pl Unit 2-4, Etobicoke, ON"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact Name</label>
              <input
                className="input"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="Ish Sehmbi"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="416-270-2767"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="estimating@rajsteelfab.ca"
              />
            </div>
            <div>
              <label className="label">PO Number (optional)</label>
              <input
                className="input"
                value={form.po_number}
                onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                placeholder="—"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.company_name || saving}
            className="btn-primary"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  )
}
