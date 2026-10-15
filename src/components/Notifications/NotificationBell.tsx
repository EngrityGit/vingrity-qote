import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../../hooks/useNotifications'
import { formatDate } from '../../lib/utils'
import clsx from 'clsx'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: notifications = [] } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const markRead = useMarkNotificationRead()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-50 hover:text-ink-800 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] card shadow-popover z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-sm text-ink-400 text-center py-8">You're all caught up.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead.mutate(n.id)}
                className={clsx(
                  'w-full text-left px-4 py-3 border-b border-ink-50 last:border-b-0 hover:bg-ink-50 transition-colors',
                  !n.is_read && 'bg-brand-50/40'
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                      n.is_read ? 'bg-transparent' : 'bg-brand-500'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-ink-400 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
