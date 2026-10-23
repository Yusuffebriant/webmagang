import { useState } from 'react'
import { ubahDataPendaftar } from '../api/admin'

const INPUT = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'

const KOLOM_ORANG = [
  'nama_lengkap', 'nim', 'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'alamat', 'no_whatsapp', 'email',
  'keahlian', 'universitas', 'alamat_universitas', 'fakultas', 'program_studi', 'semester',
]

const bersih = (v) => (v == null || v === '-' ? '' : String(v))
const ambil = (o) => Object.fromEntries(KOLOM_ORANG.map((k) => [k, bersih(o?.[k])]))

function Field({ label, children, lebar }) {
  return (
    <label className={`block text-xs font-semibold text-slate-500 ${lebar ? 'sm:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  )
}

function FieldOrang({ v, set }) {
  const t = (k, tipe = 'text', extra = {}) => (
    <input type={tipe} value={v[k]} onChange={(e) => set(k, e.target.value)} className={INPUT} {...extra} />
  )
  const area = (k, rows = 2) => (
    <textarea rows={rows} value={v[k]} onChange={(e) => set(k, e.target.value)} className={INPUT} />
  )
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nama lengkap" lebar>{t('nama_lengkap')}</Field>
      <Field label="NIM">{t('nim', 'text', { inputMode: 'numeric' })}</Field>
      <Field label="NIK (16 digit)">{t('nik', 'text', { inputMode: 'numeric', maxLength: 16 })}</Field>
      <Field label="Tempat lahir">{t('tempat_lahir')}</Field>
      <Field label="Tanggal lahir">{t('tanggal_lahir', 'date')}</Field>
      <Field label="Jenis kelamin">
        <select value={v.jenis_kelamin} onChange={(e) => set('jenis_kelamin', e.target.value)} className={INPUT}>
          <option value="">Pilih</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </Field>
      <Field label="No. WhatsApp">{t('no_whatsapp')}</Field>
      <Field label="Alamat" lebar>{area('alamat')}</Field>
      <Field label="Email" lebar>{t('email', 'email')}</Field>
      <Field label="Keahlian" lebar>{area('keahlian')}</Field>
      <Field label="Universitas" lebar>{t('universitas')}</Field>
      <Field label="Alamat kampus" lebar>{area('alamat_universitas')}</Field>
      <Field label="Fakultas">{t('fakultas')}</Field>
      <Field label="Program studi">{t('program_studi')}</Field>
      <Field label="Semester">{t('semester', 'number', { min: 1, max: 14 })}</Field>
    </div>
  )
}

// Semua pesan galat validasi Laravel -> daftar unik
function pesanGalat(e) {
  if (!e.response) return ['Tidak dapat terhubung ke server.']
  const er = e.response.data?.errors
  const semua = er ? Object.values(er).flat() : []
  return semua.length ? [...new Set(semua)] : ['Gagal menyimpan perubahan. Silakan coba lagi.']
}

export default function EditDataForm({ d, onSaved, onCancel }) {
  const [ketua, setKetua] = useState(() => ({ ...ambil(d), periode_mulai: bersih(d.periode_mulai), periode_selesai: bersih(d.periode_selesai) }))
  const [anggota, setAnggota] = useState(() => (d.anggota ?? []).map((a) => ({ id: a.id, ...ambil(a) })))
  const [simpan, setSimpan] = useState(false)
  const [galat, setGalat] = useState([])

  const setK = (k, val) => setKetua((x) => ({ ...x, [k]: val }))
  const setA = (i) => (k, val) => setAnggota((arr) => arr.map((a, n) => (n === i ? { ...a, [k]: val } : a)))

  async function submit(e) {
    e.preventDefault()
    setSimpan(true); setGalat([])
    try {
      const baru = await ubahDataPendaftar(d.id, { ...ketua, anggota })
      onSaved(baru)
    } catch (err) {
      setGalat(pesanGalat(err))
    } finally {
      setSimpan(false)
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-slate-100 px-5 py-4 sm:px-6">
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Mode edit. Perubahan nama/kampus/periode juga akan tampil di sertifikat dan halaman Cek Status.
      </p>

      <h3 className="mt-5 mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">{anggota.length ? 'Data Ketua' : 'Data Peserta'}</h3>
      <FieldOrang v={ketua} set={setK} />

      <h3 className="mt-6 mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">Periode Magang</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mulai"><input type="date" value={ketua.periode_mulai} onChange={(e) => setK('periode_mulai', e.target.value)} className={INPUT} /></Field>
        <Field label="Selesai"><input type="date" value={ketua.periode_selesai} onChange={(e) => setK('periode_selesai', e.target.value)} className={INPUT} /></Field>
      </div>

      {anggota.map((a, i) => (
        <div key={a.id} className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="mb-3 text-sm font-bold text-brand-900">Anggota {i + 1}</h3>
          <FieldOrang v={a} set={setA(i)} />
        </div>
      ))}

      {galat.length > 0 && (
        <ul role="alert" className="mt-4 list-disc space-y-0.5 rounded-xl border border-red-200 bg-red-50 py-3 pr-4 pl-8 text-xs text-red-700">
          {galat.map((g) => <li key={g}>{g}</li>)}
        </ul>
      )}

      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={simpan}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
          {simpan ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        <button type="button" onClick={onCancel} disabled={simpan}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 hover:border-brand-500 hover:text-brand-500">
          Batal
        </button>
      </div>
    </form>
  )
}