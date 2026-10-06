import SafeImage from './SafeImage'

const Shield = ({ className = 'h-12 w-12' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <path d="M20 3 6 8v11c0 9 6 15 14 18 8-3 14-9 14-18V8L20 3Z" fill="#0a84e8" />
    <path d="M20 10v18M13 15h14M13 21h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Taruh logo asli di public/logo-bkpsdm.png — kalau belum ada, dipakai ikon sementara.
export default function Logo({ light = false, compact = false }) {
  const size = compact ? 'h-9 w-9' : 'h-12 w-12'
  return (
    <div className="flex items-center gap-2.5">
      <SafeImage src="/logo-bkpsdm.png" alt="Logo BKPSDM" className={`${size} object-contain`} fallback={<Shield className={size} />} />
      <div className="leading-tight">
        <div className={`${compact ? 'text-lg' : 'text-2xl'} font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>BKPSDM</div>
        <div className={`${compact ? 'hidden sm:block text-[10px]' : 'text-xs'} ${light ? 'text-slate-300' : 'text-slate-500'}`}>Kota Yogyakarta</div>
      </div>
    </div>
  )
}