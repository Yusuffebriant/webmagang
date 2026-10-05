// Kunci = nilai `status` dari backend (App\Enums\StatusPendaftar)
export const STATUS = {
  menunggu_verifikasi: {
    label: 'Menunggu Verifikasi', icon: 'clock',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    ikon: 'bg-amber-50 text-amber-600', bar: 'bg-amber-400',
  },
  diverifikasi: {
    label: 'Diverifikasi', icon: 'shieldCheck',
    badge: 'bg-brand-50 text-brand-600 border-brand-200',
    ikon: 'bg-brand-50 text-brand-500', bar: 'bg-brand-500',
  },
  diterima: {
    label: 'Diterima', icon: 'cap',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ikon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500',
  },
  ditolak: {
    label: 'Ditolak', icon: 'xCircle',
    badge: 'bg-red-50 text-red-700 border-red-200',
    ikon: 'bg-red-50 text-red-600', bar: 'bg-red-400',
  },
}

// Format 'YYYY-MM-DD' -> '5 Okt 2026'
export function tanggal(v) {
  if (!v) return '-'
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Data dari server kadang masih tertulis "BKSDM"; penulisan yang benar "BKPSDM".
export const rapikanNama = (v) => (typeof v === 'string' ? v.replace(/\bBKSDM\b/gi, 'BKPSDM') : v)