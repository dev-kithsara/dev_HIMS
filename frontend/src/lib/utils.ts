import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const severityClass = (s: string): string =>
  ({ LOW: 'severity-low', MEDIUM: 'severity-medium', HIGH: 'severity-high', CRITICAL: 'severity-critical' }[s] ?? 'severity-low')

export const statusClass = (s: string): string =>
  ({
    OPEN:           'status-open',
    ACCEPTED:       'text-blue-400   bg-blue-500/10   border border-blue-500/30   rounded-full px-2 py-0.5',
    REJECTED:       'text-red-400    bg-red-500/10    border border-red-500/30    rounded-full px-2 py-0.5',
    INVESTIGATING:  'text-violet-400 bg-violet-500/10 border border-violet-500/30 rounded-full px-2 py-0.5',
    PENDING_ACTION: 'text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5',
    UNDER_REVIEW:   'status-under_review',
    CLOSED:         'status-closed',
    IN_PROGRESS:    'status-in_progress',
  }[s] ?? 'status-open')

export const statusLabel = (s: string): string =>
  ({
    OPEN:           'Open',
    ACCEPTED:       'Accepted',
    REJECTED:       'Rejected',
    INVESTIGATING:  'Investigating',
    PENDING_ACTION: 'Pending Action',
    UNDER_REVIEW:   'Under Review',
    CLOSED:         'Closed',
    IN_PROGRESS:    'In Progress',
  }[s] ?? s.replace(/_/g, ' '))

export const roleClass = (r: string): string =>
  ({
    admin:              'text-red-400     bg-red-500/10     border-red-500/30',
    department_manager: 'text-orange-400  bg-orange-500/10  border-orange-500/30',
    investigator:       'text-violet-400  bg-violet-500/10  border-violet-500/30',
    action_owner:       'text-cyan-400    bg-cyan-500/10    border-cyan-500/30',
    staff:              'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  }[r] ?? 'text-violet-400 bg-violet-500/10 border-violet-500/30')

export const roleLabel = (r: string): string =>
  ({
    admin:              'Admin',
    department_manager: 'Dept. Manager',
    investigator:       'Investigator',
    action_owner:       'Action Owner',
    staff:              'Staff',
  }[r] ?? r)

export const formatDate = (d: string | Date): string =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (d: string | Date): string =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
