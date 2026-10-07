// Status kuota satu formasi. Dipakai halaman pendaftaran & info kuota.
// Hampir penuh = sudah ada yang terisi dan sisa kuota tinggal 1-2 orang.
export function statusKuota(f) {
  if (f.kuota === null) return { kode: 'belum', label: 'Belum diatur', badge: 'bg-slate-100 text-slate-600', bisaDipilih: true }
  if (f.kuota === 0) return { kode: 'tutup', label: 'Ditutup', badge: 'bg-slate-100 text-slate-600', bisaDipilih: false }
  if (f.sisa_kuota === 0) return { kode: 'penuh', label: 'Penuh', badge: 'bg-red-50 text-red-700', bisaDipilih: false }
  if (f.terisi > 0 && f.sisa_kuota <= 2) return { kode: 'hampir', label: 'Hampir penuh', badge: 'bg-amber-50 text-amber-700', bisaDipilih: true }
  return { kode: 'tersedia', label: 'Tersedia', badge: 'bg-emerald-50 text-emerald-700', bisaDipilih: true }
}

export function teksKuota(f) {
  if (f.kuota === null) return 'Kuota belum ditetapkan'
  if (f.kuota === 0) return 'Formasi sedang ditutup'
  if (f.sisa_kuota === 0) return `Kuota ${f.kuota} sudah terisi semua`
  return `Sisa ${f.sisa_kuota} dari ${f.kuota} kuota`
}