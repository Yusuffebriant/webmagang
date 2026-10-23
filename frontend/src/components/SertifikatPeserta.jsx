import { useState } from 'react'
import api from '../api/client'
import Icon from './Icon'
import { unduhSertifikat, unduhSemuaSertifikat } from '../utils/sertifikat'

// Dipakai di halaman Cek Status. Tombol hanya dirender bila server menyatakan sertifikat sudah boleh diunduh.
export default function SertifikatPeserta({ nomor }) {
  const [data, setData] = useState(null)
  const [muat, setMuat] = useState(false)
  const [galat, setGalat] = useState('')

  async function ambil() {
    setMuat(true); setGalat('')
    try {
      const { data: res } = await api.get(`/public/sertifikat/${encodeURIComponent(nomor)}`)
      const d = res.data
      if (d.sertifikat.length === 1) await unduhSertifikat(d.sertifikat[0], d.pengaturan)
      else setData(d)
    } catch (e) {
      setGalat(e.response?.data?.message ?? (e.response ? 'Sertifikat belum bisa diunduh.' : 'Tidak dapat terhubung ke server.'))
    } finally {
      setMuat(false)
    }
  }

  const tombol = 'inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60'

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-5">
      <p className="text-base font-semibold text-emerald-900">Sertifikat magang Anda sudah tersedia</p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-800">Unduh sertifikat dalam format PDF.</p>
      {galat && <p role="alert" className="mt-2 text-sm text-red-700">{galat}</p>}
      {!data ? (
        <button type="button" onClick={ambil} disabled={muat} className={`${tombol} mt-4`}>
          <Icon name="download" className="h-4 w-4" /> {muat ? 'Menyiapkan...' : 'Unduh Sertifikat'}
        </button>
      ) : (
        <div className="mt-4 space-y-2">
          {data.sertifikat.map((s) => (
            <button key={s.id} type="button" onClick={() => unduhSertifikat(s, data.pengaturan)}
              className="flex w-full items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-emerald-900 hover:border-emerald-500">
              <Icon name="download" className="h-4 w-4 shrink-0" /> {s.nama}
            </button>
          ))}
          <button type="button" onClick={() => unduhSemuaSertifikat(data.sertifikat, data.pengaturan)} className={tombol}>
            <Icon name="download" className="h-4 w-4" /> Unduh semua (1 file)
          </button>
        </div>
      )}
    </div>
  )
}