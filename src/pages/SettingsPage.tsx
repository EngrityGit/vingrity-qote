import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, FolderPlus, Sparkles } from 'lucide-react'
import { useRateItems, useCreateRateItem, useUpdateRateItem, useDeleteRateItem } from '../hooks/useRateItems'
import {
  useRateCategories,
  useCreateRateCategory,
  useRenameRateCategory,
  useDeleteRateCategory,
} from '../hooks/useRateCategories'
import { useAISettings, useSetDefaultProvider } from '../hooks/useAISettings'
import { AIProvider, RateItem } from '../types'
import { formatCurrency } from '../lib/utils'
import clsx from 'clsx'

const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Claude (Anthropic)',
  openai: 'ChatGPT (OpenAI)',
  google: 'Gemini (Google)',
}

const EMPTY_ROW = {
  name: '',
  description: '',
  qualification: '',
  unit: 'hour',
  rate: 0,
  category_id: '',
  is_default: true,
}

export function SettingsPage() {
  const { data: rates = [], isLoading } = useRateItems()
  const { data: categories = [] } = useRateCategories()
  const createRate = useCreateRateItem()
  const updateRate = useUpdateRateItem()
  const deleteRate = useDeleteRateItem()
  const createCategory = useCreateRateCategory()
  const renameCategory = useRenameRateCategory()
  const deleteCategory = useDeleteRateCategory()
  const { data: aiSettings } = useAISettings()
  const setDefaultProvider = useSetDefaultProvider()

  const [adding, setAdding] = useState<string | null>(null) // category_id currently adding a rate to
  const [newRow, setNewRow] = useState(EMPTY_ROW)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<Partial<RateItem>>({})
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryNameDraft, setCategoryNameDraft] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const grouped = useMemo(() => {
    const map: Record<string, RateItem[]> = {}
    for (const r of rates) {
      const key = r.category_id
      map[key] = map[key] || []
      map[key].push(r)
    }
    return map
  }, [rates])

  function startEdit(r: RateItem) {
    setEditingId(r.id)
    // Exclude the joined `category` object — only `category_id` is a real
    // column on rate_items, so sending the nested object back would fail.
    const { category, ...editable } = r
    setEditRow(editable)
  }

  function saveEdit() {
    if (!editingId) return
    const { category, id, ...payload } = editRow as RateItem
    updateRate.mutate({ id: editingId, ...payload } as any, {
      onSuccess: () => {
        setEditingId(null)
        setEditRow({})
      },
    })
  }

  function startAdd(categoryId: string) {
    setAdding(categoryId)
    setNewRow({ ...EMPTY_ROW, category_id: categoryId })
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-md bg-brand-500 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">Default AI Provider</p>
            <p className="text-xs text-ink-500">
              Used app-wide unless someone picks a different one for a specific request. Make sure the matching
              API key secret is set in Supabase for whichever provider you choose (see README).
            </p>
          </div>
        </div>
        <select
          className="input mt-4 max-w-xs"
          value={aiSettings?.default_provider ?? 'anthropic'}
          onChange={(e) => setDefaultProvider.mutate(e.target.value as AIProvider)}
        >
          {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-ink-500 max-w-2xl">
          This is your global default rate sheet. Rates here pre-load into every new quote (and into AI-generated
          quotes), and can still be overridden per-project for discounts without changing the defaults. Rename or
          add categories — Technician Labour, Travel, Meals, LOA, Consumables, or anything else your business
          needs — at any time.
        </p>
        <button onClick={() => setAddingCategory(true)} className="btn-secondary shrink-0 text-sm">
          <FolderPlus size={15} />
          New Category
        </button>
      </div>

      {addingCategory && (
        <div className="card p-4 flex items-center gap-3">
          <input
            autoFocus
            className="input flex-1"
            placeholder="Category name (e.g. Equipment Rental)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            className="btn-secondary"
            onClick={() => {
              setAddingCategory(false)
              setNewCategoryName('')
            }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!newCategoryName}
            onClick={() =>
              createCategory.mutate(
                { name: newCategoryName, sort_order: categories.length + 1 },
                {
                  onSuccess: () => {
                    setAddingCategory(false)
                    setNewCategoryName('')
                  },
                }
              )
            }
          >
            Add Category
          </button>
        </div>
      )}

      {isLoading && <p className="text-sm text-ink-400 text-center py-10">Loading rate sheet…</p>}

      {!isLoading &&
        categories.map((cat) => {
          const items = grouped[cat.id] ?? []
          return (
            <div key={cat.id} className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
                {editingCategoryId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      className="input py-1.5 max-w-xs"
                      value={categoryNameDraft}
                      onChange={(e) => setCategoryNameDraft(e.target.value)}
                    />
                    <button
                      onClick={() =>
                        renameCategory.mutate(
                          { id: cat.id, name: categoryNameDraft },
                          { onSuccess: () => setEditingCategoryId(null) }
                        )
                      }
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingCategoryId(null)} className="text-ink-400 hover:text-ink-700">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <p className="text-sm font-semibold text-ink-900">{cat.name}</p>
                    <button
                      onClick={() => {
                        setEditingCategoryId(cat.id)
                        setCategoryNameDraft(cat.name)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-brand-600 transition-opacity"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startAdd(cat.id)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Rate
                  </button>
                  {items.length === 0 && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove empty category "${cat.name}"?`)) deleteCategory.mutate(cat.id)
                      }}
                      className="text-ink-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {adding === cat.id && (
                <div className="px-5 py-3 bg-ink-50/60 border-b border-ink-100">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                    <input
                      className="input md:col-span-2"
                      placeholder="Name (e.g. NDE Technician – UT)"
                      value={newRow.name}
                      onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Qualification"
                      value={newRow.qualification}
                      onChange={(e) => setNewRow({ ...newRow, qualification: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Unit (hour/visit/can/day/night/km)"
                      value={newRow.unit}
                      onChange={(e) => setNewRow({ ...newRow, unit: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="Rate ($)"
                      value={newRow.rate || ''}
                      onChange={(e) => setNewRow({ ...newRow, rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2.5">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => {
                        setAdding(null)
                        setNewRow(EMPTY_ROW)
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary text-xs"
                      disabled={!newRow.name}
                      onClick={() =>
                        createRate.mutate(newRow, {
                          onSuccess: () => {
                            setAdding(null)
                            setNewRow(EMPTY_ROW)
                          },
                        })
                      }
                    >
                      Add to Rate Sheet
                    </button>
                  </div>
                </div>
              )}

              {items.length === 0 && adding !== cat.id ? (
                <p className="text-xs text-ink-400 text-center py-6">No rates in this category yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink-400 text-xs border-b border-ink-100">
                        <th className="font-medium px-5 py-2.5">Name</th>
                        <th className="font-medium px-5 py-2.5">Qualification</th>
                        <th className="font-medium px-5 py-2.5">Unit</th>
                        <th className="font-medium px-5 py-2.5">Rate</th>
                        <th className="font-medium px-5 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr
                          key={r.id}
                          className={clsx(
                            'border-b border-ink-50 last:border-b-0 group transition-colors',
                            editingId !== r.id && 'hover:bg-ink-50/60'
                          )}
                        >
                          {editingId === r.id ? (
                            <>
                              <td className="px-5 py-2.5">
                                <input
                                  className="input py-1.5"
                                  value={editRow.name ?? ''}
                                  onChange={(e) => setEditRow({ ...editRow, name: e.target.value })}
                                />
                              </td>
                              <td className="px-5 py-2.5">
                                <input
                                  className="input py-1.5"
                                  value={editRow.qualification ?? ''}
                                  onChange={(e) => setEditRow({ ...editRow, qualification: e.target.value })}
                                />
                              </td>
                              <td className="px-5 py-2.5">
                                <input
                                  className="input py-1.5"
                                  value={editRow.unit ?? ''}
                                  onChange={(e) => setEditRow({ ...editRow, unit: e.target.value })}
                                />
                              </td>
                              <td className="px-5 py-2.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="input py-1.5 w-28"
                                  value={editRow.rate ?? 0}
                                  onChange={(e) => setEditRow({ ...editRow, rate: parseFloat(e.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-5 py-2.5">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="text-ink-400 hover:text-ink-700">
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-5 py-3 font-medium text-ink-900">{r.name}</td>
                              <td className="px-5 py-3 text-ink-600">{r.qualification ?? '—'}</td>
                              <td className="px-5 py-3 text-ink-600">/{r.unit}</td>
                              <td className="px-5 py-3 font-medium text-ink-900">{formatCurrency(r.rate)}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(r)} className="text-ink-400 hover:text-brand-600">
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove "${r.name}" from the rate sheet?`)) deleteRate.mutate(r.id)
                                    }}
                                    className="text-ink-400 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}