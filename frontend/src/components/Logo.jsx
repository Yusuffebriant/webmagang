import SafeImage from './SafeImage'

const Shield = () => (
  <svg viewBox="0 0 40 40" className="h-12 w-12" aria-hidden="true">
    <path d="M20 3 6 8v11c0 9 6 15 14 18 8-3 14-9 14-18V8L20 3Z" fill="#0a84e8" />
    <path d="M20 10v18M13 15h14M13 21h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Logo ada di public/logo-bkpsdm.png — kalau file hilang, dipakai ikon sementara.
export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <SafeImage src="/logo-bkpsdm.png" alt="Logo BKPSDM" className="h-12 w-12 object-contain" fallback={<Shield />} />
      <div className="leading-tight">
        <div className={`text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>BKPSDM</div>
        <div className={`text-xs ${light ? 'text-slate-300' : 'text-slate-500'}`}>Kota Yogyakarta</div>
      </div>
    </a>
  )
}