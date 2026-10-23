import { useState } from 'react'
import { getSertifikatPendaftar, ubahSertifikat } from '../api/admin'
import Icon from './Icon'
import { teksPeriode, tanggalPanjang, unduhSertifikat, unduhSemuaSertifikat } from '../utils/sertifikat'

const FIELD = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'
const TOMBOL = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50'

function pesanGalat(e, awal) {
  const er = e.response?.data?.errors
  return (er && Object.values(er)[0]?.[0]) || e.response?.data?.message || (e.response ? awal : 'Tidak dapat terhubung ke server.')
}

function FormUbah({ item, onSimpan, onBatal }) {
  const [f, setF] = useState({
    nomor: item.nomor ?? '',
    nama: item.nama ?? '',
    instansi: item.instansi ?? '',
    periode_mulai: item.periode_mulai ?? '',
    periode_selesai: item.periode_selesai ?? '',
    tanggal_terbit: item.tanggal_terbit ?? '',
  })
  const [simpan, setSimpan] = useState(false)
  const [galat, setGalat] = useState('')
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setGalat('') }

  async function kirim() {
    if (!f.nomor.trim()) return setGalat('Nomor sertifikat wajib diisi.')
    // Nilai yang sama dengan data otomatis dikirim null supaya tetap mengikuti perubahan data pendaftar.
    const payload = { nomor: f.nomor.trim() }
    for (const k of ['nama', 'instansi', 'periode_mulai', 'periode_selesai', 'tanggal_terbit']) {
      const v = String(f[k] ?? '').trim()
      payload[k] = v && v !== (item.otomatis?.[k] ?? '') ? v : null
    }
    setSimpan(true); setGalat('')
    try {
      onSimpan(await ubahSertifikat(item.id, payload))
    } catch (e) {
      setGalat(pesanGalat(e, 'Gagal menyimpan perubahan.'))
    } finally {
      setSimpan(false)
    }
  }

  const otomatis = () => setF((p) => ({ ...p, ...item.otomatis }))

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="block text-xs font-semibold text-slate-500">Nomor sertifikat
        <input className={FIELD} value={f.nomor} onChange={set('nomor')} maxLength={100} />
      </label>
      <label className="block text-xs font-semibold text-slate-500">Nama peserta
        <input className={FIELD} value={f.nama} onChange={set('nama')} maxLength={255} />
      </label>
      <label className="block text-xs font-semibold text-slate-500">Asal kampus / sekolah
        <input className={FIELD} value={f.instansi} onChange={set('instansi')} maxLength={255} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-500">Periode mulai
          <input type="date" className={FIELD} value={f.periode_mulai} onChange={set('periode_mulai')} />
        </label>
        <label className="block text-xs font-semibold text-slate-500">Periode selesai
          <input type="date" className={FIELD} value={f.periode_selesai} onChange={set('periode_selesai')} />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-500">Tanggal terbit sertifikat
        <input type="date" className={FIELD} value={f.tanggal_terbit} onChange={set('tanggal_terbit')} />
      </label>
      <p className="text-xs text-slate-400">Isi yang sama dengan data pendaftaran tetap otomatis: bila data pendaftar berubah, sertifikat ikut berubah.</p>
      {galat && <p role="alert" className="text-xs text-red-600">{galat}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={kirim} disabled={simpan}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
          {simpan ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button type="button" onClick={onBatal} disabled={simpan} className={TOMBOL}>Batal</button>
        <button type="button" onClick={otomatis} disabled={simpan} className={TOMBOL}>Kembalikan ke otomatis</button>
      </div>
    </div>
  )
}

export default function SertifikatPanel({ pendaftarId, namaKelompok }) {
  const [data, setData] = useState(null)
  const [muat, setMuat] = useState(false)
  const [galat, setGalat] = useState('')
  const [ubahId, setUbahId] = useState(null)
  const [unduh, setUnduh] = useState(null)

  async function buka() {
    setMuat(true); setGalat('')
    try {
      setData(await getSertifikatPendaftar(pendaftarId))
    } catch (e) {
      setGalat(pesanGalat(e, 'Gagal memuat sertifikat.'))
    } finally {
      setMuat(false)
    }
  }

  async function jalankan(kunci, fn) {
    setUnduh(kunci); setGalat('')
    try { await fn() } catch { setGalat('Gagal membuat PDF sertifikat. Coba lagi.') } finally { setUnduh(null) }
  }

  const ganti = (baru) => {
    setData((d) => ({ ...d, sertifikat: d.sertifikat.map((s) => (s.id === baru.id ? baru : s)) }))
    setUbahId(null)
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-brand-900">Sertifikat Magang</p>

      {!data ? (
        <>
          <p className="mt-1 text-xs text-slate-500">Nama, periode, dan tanggal terisi otomatis dari data pendaftar. Nomor dibuat saat pertama kali dibuka.</p>
          {galat && <p role="alert" className="mt-2 text-xs text-red-600">{galat}</p>}
          <button type="button" onClick={buka} disabled={muat}
            className="mt-3 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
            {muat ? 'Menyiapkan...' : 'Siapkan Sertifikat'}
          </button>
        </>
      ) : (
        <>
          {galat && <p role="alert" className="mt-2 text-xs text-red-600">{galat}</p>}
          <ul className="mt-3 space-y-3">
            {data.sertifikat.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="font-mono text-xs text-slate-400">{s.nomor}</p>
                <p className="text-sm font-bold text-brand-900">{s.nama}</p>
                <p className="text-xs text-slate-500">{s.instansi}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Periode {teksPeriode(s) || '-'} · Terbit {tanggalPanjang(s.tanggal_terbit) || '-'}
                </p>
                {Object.values(s.diubah ?? {}).some(Boolean) && (
                  <p className="mt-1 text-[0.72rem] font-semibold text-amber-600">Ada isi yang diubah manual</p>
                )}
                {ubahId === s.id ? (
                  <FormUbah item={s} onSimpan={ganti} onBatal={() => setUbahId(null)} />
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button type="button" className={TOMBOL} disabled={unduh !== null}
                      onClick={() => jalankan(s.id, () => unduhSertifikat(s, data.pengaturan))}>
                      <Icon name="download" className="mr-1 inline h-3.5 w-3.5" />
                      {unduh === s.id ? 'Membuat PDF...' : 'Unduh PDF'}
                    </button>
                    <button type="button" className={TOMBOL} onClick={() => setUbahId(s.id)}>Ubah</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {data.sertifikat.length > 1 && (
            <button type="button" className={`${TOMBOL} mt-3`} disabled={unduh !== null}
              onClick={() => jalankan('semua', () => unduhSemuaSertifikat(data.sertifikat, data.pengaturan, `Sertifikat-${namaKelompok ?? 'Kelompok'}`))}>
              {unduh === 'semua' ? 'Membuat PDF...' : `Unduh semua (${data.sertifikat.length} orang, 1 file)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}