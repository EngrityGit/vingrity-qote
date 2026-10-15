import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  label: string
  value: string
  icon: LucideIcon
  accent?: 'brand' | 'emerald' | 'amber' | 'red'
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
}

export function StatCard({ label, value, icon: Icon, accent = 'brand' }: Props) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={clsx('w-11 h-11 rounded-md flex items-center justify-center shrink-0', ACCENTS[accent])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-ink-900 leading-tight">{value}</p>
        <p className="text-xs text-ink-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
