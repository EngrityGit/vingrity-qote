import { Plus, Trash2, Zap, GripVertical, X, Search } from 'lucide-react'
import { LineItem, RateItem } from '../../types'
import { formatCurrency, lineItemTotal, uid } from '../../lib/utils'
import { useRateItems } from '../../hooks/useRateItems'
import { useRateCategories } from '../../hooks/useRateCategories'
import { useMemo, useState } from 'react'

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

// --- SUB-COMPONENT: Sortable Row ---
interface RowProps {
  item: LineItem
  categories: any[]
  update: (id: string, patch: Partial<LineItem>) => void
  remove: (id: string) => void
}

function SortableRow({ item, categories, update, remove }: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: 'relative' as const,
  }

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={clsx(
        "transition-colors bg-white",
        isDragging ? "bg-brand-50 shadow-lg z-50" : "hover:bg-ink-25"
      )}
    >
      <td className="w-8 px-2 py-3 align-top">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 text-ink-200 hover:text-ink-400"
        >
          <GripVertical size={16} />
        </button>
      </td>

      <td className="px-3 py-3 align-top">
        <input
          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-500 rounded px-1 py-1 text-sm text-ink-900 font-medium"
          value={item.description}
          onChange={(e) => update(item.id, { description: e.target.value })}
          placeholder="Item description..."
        />
        {item.qualification !== undefined && (
          <input
            className="mt-1 w-full bg-transparent border-0 focus:ring-0 text-[10px] text-ink-400 placeholder:text-ink-200 uppercase font-bold"
            value={item.qualification ?? ''}
            onChange={(e) => update(item.id, { qualification: e.target.value })}
            placeholder="SET QUALIFICATION"
          />
        )}
      </td>

      <td className="px-3 py-3 align-top">
        <select
          className="w-full bg-ink-50/50 border-ink-100 rounded text-[11px] py-1 px-2"
          value={item.category_name}
          onChange={(e) => {
            const cat = categories.find((c) => c.name === e.target.value)
            update(item.id, { category_name: e.target.value, category_id: cat?.id })
          }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </td>

      <td className="px-2 py-3 align-top">
        <input
          type="number"
          className="w-full bg-transparent border-0 text-center focus:ring-1 focus:ring-brand-500 rounded py-1 font-medium text-sm"
          value={item.quantity}
          onChange={(e) => update(item.id, { quantity: parseFloat(e.target.value) || 0 })}
        />
      </td>

      <td className="px-2 py-3 align-top text-center text-xs text-ink-500 pt-5">
        {item.unit}
      </td>

      <td className="px-3 py-3 align-top">
        <input
          type="number"
          step="0.01"
          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-500 rounded py-1 text-sm font-medium"
          value={item.rate}
          onChange={(e) => update(item.id, { rate: parseFloat(e.target.value) || 0 })}
        />
      </td>

      <td className="px-3 py-3 align-top text-center pt-4">
        <input
          type="checkbox"
          checked={item.is_call_out}
          onChange={(e) => update(item.id, { is_call_out: e.target.checked })}
          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
        />
      </td>

      <td className="px-4 py-3 align-top text-right font-bold text-ink-900 pt-4">
        {formatCurrency(lineItemTotal(item))}
      </td>

      <td className="px-2 py-3 align-top text-right">
        <button onClick={() => remove(item.id)} className="p-1 text-ink-300 hover:text-red-500">
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  )
}

// --- MAIN COMPONENT ---
export function LineItemsTable({ items, onChange }: Props) {
  const { data: rateSheet = [] } = useRateItems()
  const { data: categories = [] } = useRateCategories()
  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((it) => it.id === active.id)
      const newIndex = items.findIndex((it) => it.id === over.id)
      onChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  const update = (id: string, patch: Partial<LineItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id))
  }

  function addBlank() {
    const newItem: LineItem = { 
      id: uid(), 
      description: '', 
      quantity: 1, 
      unit: 'hr', 
      rate: 0, 
      is_call_out: false, 
      category_name: 'Other' 
    }
    onChange([...items, newItem])
  }

  function addFromRate(rate: RateItem) {
    const newItem: LineItem = {
      id: uid(), 
      description: rate.name, 
      qualification: rate.qualification ?? undefined,
      quantity: 1, 
      unit: rate.unit, 
      rate: rate.rate, 
      is_call_out: false,
      category_id: rate.category_id, 
      category_name: rate.category?.name ?? 'Other'
    }
    onChange([...items, newItem])
    setShowPicker(false)
  }

  const filteredRateSheet = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return rateSheet.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.category?.name.toLowerCase().includes(query)
    )
  }, [rateSheet, searchQuery])

  const groupedRateSheet = useMemo(() => {
    const map: Record<string, RateItem[]> = {}
    for (const r of filteredRateSheet) {
      const key = r.category?.name ?? 'Other'
      map[key] = map[key] || []
      map[key].push(r)
    }
    return map
  }, [filteredRateSheet])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50 text-left text-ink-500 text-[11px] uppercase tracking-wider border-b border-ink-100">
              <th className="w-8"></th>
              <th className="font-bold px-4 py-3 min-w-[250px]">Description</th>
              <th className="font-bold px-4 py-3 w-32">Category</th>
              <th className="font-bold px-3 py-3 text-center w-20">Qty</th>
              <th className="font-bold px-3 py-3 text-center w-20">Unit</th>
              <th className="font-bold px-4 py-3 w-28">Rate</th>
              <th className="font-bold px-4 py-3 text-center w-24">Call-out</th>
              <th className="font-bold px-4 py-3 text-right w-32">Total</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <tbody className="divide-y divide-ink-100">
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableRow 
                    key={item.id} 
                    item={item} 
                    categories={categories} 
                    update={update} 
                    remove={remove} 
                  />
                ))}
              </SortableContext>
            </tbody>
          </DndContext>
        </table>

        {items.length === 0 && (
          <div className="py-12 text-center text-ink-400 text-sm">
            No line items added yet.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowPicker(!showPicker)} 
              className={`btn-primary text-xs h-9 ${showPicker ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}
            >
              <Zap size={14} className="fill-current" />
              Add from Rate Sheet
            </button>

            {/* --- PICKER DROPDOWN --- */}
            {showPicker && (
              <div className="absolute left-0 bottom-full mb-2 w-80 max-h-[400px] bg-white border border-ink-200 rounded-xl shadow-2xl z-[100] flex flex-col overflow-hidden">
                <div className="p-3 border-b border-ink-100 bg-ink-25 flex items-center justify-between">
                  <div className="relative flex-1 mr-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
                    <input 
                      autoFocus
                      className="w-full pl-8 pr-2 py-1.5 text-xs border-ink-200 rounded-md focus:ring-brand-500"
                      placeholder="Search rates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => setShowPicker(false)} className="text-ink-400 hover:text-ink-600">
                    <X size={16} />
                  </button>
                </div>

                <div className="overflow-y-auto p-2 space-y-4">
                  {Object.entries(groupedRateSheet).length > 0 ? (
                    Object.entries(groupedRateSheet).map(([cat, rates]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-bold text-ink-400 uppercase px-2 mb-1 tracking-wider">{cat}</p>
                        <div className="space-y-0.5">
                          {rates.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => addFromRate(r)}
                              className="w-full text-left px-2 py-2 hover:bg-brand-50 rounded-lg group transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-medium text-ink-900 group-hover:text-brand-700">{r.name}</span>
                                <span className="text-xs font-bold text-ink-600">{formatCurrency(r.rate)}</span>
                              </div>
                              <p className="text-[10px] text-ink-400 mt-0.5">{r.unit} • {r.qualification || 'No qualification'}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-ink-400">No rates found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={addBlank} className="btn-secondary text-xs h-9">
            <Plus size={14} />
            Add Blank Line
          </button>
        </div>
      </div>
    </div>
  )
}

function clsx(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}