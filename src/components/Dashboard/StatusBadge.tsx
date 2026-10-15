import { statusColor } from '../../lib/utils'
import clsx from 'clsx'

export function StatusBadge({ status }: { status: string }) {
  return <span className={clsx('badge', statusColor(status))}>{status}</span>
}
