import { useState } from 'react'
import { simpanHasilMagang } from '../api/admin'

const INPUT = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'

const awal = (o) => ({
  nilai_akhir: o?.nilai_akhir ?? '',
  hasil_magang: o?.hasil_magang ?? '',
})

function pesanGalat(e) {
  if (!e.response) return 'Tidak dapat terhubung ke server.'
  const er = e.response.data?.errors
  return (er ? Object.values(er).flat()[0] : null) ?? e.response.data?.message ?? 'Gagal menyimpan. Silakan coba lagi.'
}

function FormHasil({ judul, v, set }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-3 text-sm font-bold text-brand-900">{judul}</p>
      <div className="grid gap-3">
        <label className="block text-xs font-semibold text-slate-500 sm:w-48">
          Nilai akhir (0-100)
          <input type="number" min={0} max={100} step={1} value={v.nilai_akhir}
            onChange={(e) => set({ ...v, nilai_akhir: e.target.value })}
            className={INPUT} />
        </label>
        <label className="block text-xs font-semibold text-slate-500">
          Ringkasan kegiatan / hasil kegiatan magang
          <textarea rows={5} value={v.hasil_magang} onChange={(e) => set({ ...v, hasil_magang: e.target.value })}
            placeholder="Tuliskan kegiatan yang dikerjakan dan hasil yang dicapai selama magang"
            className={INPUT} />
        </label>
      </div>
    </div>
  )
}

export default function HasilMagang({ d, onUpdate }) {
  const [ketua, setKetua] = useState(() => awal(d))
  const [anggota, setAnggota] = useState(() => (d.anggota ?? []).map((a) => ({ id: a.id, ...awal(a) })))
  const [simpan, setSimpan] = useState(false)
  const [galat, setGalat] = useState('')
  const [info, setInfo] = useState('')

  async function submit() {
    setSimpan(true); setGalat(''); setInfo('')
    try {
      const baru = await simpanHasilMagang(d.id, { ...ketua, anggota })
      onUpdate(baru)
      setInfo('Hasil magang berhasil disimpan.')
    } catch (e) {
      setGalat(pesanGalat(e))
    } finally {
      setSimpan(false)
    }
  }

  const kelompok = anggota.length > 0

  return (
    <div className="mt-2 space-y-3">
      <FormHasil judul={kelompok ? `Ketua: ${d.nama_lengkap}` : d.nama_lengkap} v={ketua} set={setKetua} />
      {anggota.map((a, i) => (
        <FormHasil key={a.id} judul={`Anggota ${i + 1}: ${d.anggota[i]?.nama_lengkap ?? ''}`} v={a}
          set={(baru) => setAnggota((arr) => arr.map((x, n) => (n === i ? { ...baru, id: x.id } : x)))} />
      ))}

      {galat && <p role="alert" className="text-xs text-red-600">{galat}</p>}
      {info && <p role="status" className="text-xs text-emerald-700">{info}</p>}
      <button type="button" onClick={submit} disabled={simpan}
        className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
        {simpan ? 'Menyimpan...' : 'Simpan Hasil Magang'}
      </button>
    </div>
  )
}