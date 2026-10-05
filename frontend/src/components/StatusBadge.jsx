import { STATUS } from '../lib/status'

export default function StatusBadge({ status, label }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${s?.badge ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {label ?? s?.label ?? status}
    </span>
  )
}