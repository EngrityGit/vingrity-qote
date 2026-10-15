import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'
import clsx from 'clsx'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES = {
  success: 'text-emerald-600 bg-emerald-50',
  error: 'text-red-600 bg-red-50',
  info: 'text-brand-600 bg-brand-50',
  warning: 'text-amber-600 bg-amber-50',
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-[340px]">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className="card p-3.5 flex items-start gap-3 transition-all duration-200"
          >
            <div className={clsx('w-8 h-8 rounded-md flex items-center justify-center shrink-0', STYLES[t.type])}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900">{t.title}</p>
              {t.description && <p className="text-xs text-ink-500 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ink-300 hover:text-ink-600 transition-colors shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
