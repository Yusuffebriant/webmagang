import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import Logo from '../../components/Logo'

const JENJANG = ['D3', 'D4', 'S1', 'S2']
const HARI_INI = new Date().toISOString().slice(0, 10)
const MAKS_UKURAN = 2 * 1024 * 1024 // 2MB, sama dengan validasi backend

const DOKUMEN = [
  { key: 'surat_pengantar', label: 'Surat Pengantar dari Universitas', wajib: true },
  { key: 'cv', label: 'Curriculum Vitae (CV)', wajib: false },
  { key: 'transkrip', label: 'Transkrip Nilai Sementara / KHS', wajib: false },
  { key: 'rencana_kegiatan', label: 'Rencana Kegiatan Magang', wajib: false },
]

const MAKS_ANGGOTA = 9 // anggota di luar ketua

const anggotaKosong = () => ({
  nama_lengkap: '', nim: '', universitas: '', fakultas: '', program_studi: '', jenjang: '',
  tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', alamat: '', no_whatsapp: '', email: '',
})

const awal = {
  nama_lengkap: '', nim: '', universitas: '', fakultas: '', program_studi: '',
  jenjang: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '',
  alamat: '', no_whatsapp: '', email: '',
  periode_mulai: '', periode_selesai: '', durasi: '', durasi_satuan: 'bulan',
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10'

function Section({ judul, icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white px-6 py-4 sm:px-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <h2 className="text-base font-bold text-brand-900">{judul}</h2>
      </div>
      <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">{children}</div>
    </section>
  )
}

function Field({ label, error, hint, required = true, children, htmlFor }) {
  return (
    <div data-error={error ? 'true' : undefined}>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Anggota({ i, data, ubah, hapus, salinKampus, err }) {
  const k = (f) => err(`anggota.${i}.${f}`)
  const set = (f) => (e) => ubah(i, f, e.target.value)
  const id = (f) => `anggota_${i}_${f}`
  const pill = (aktif) =>
    `flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${aktif ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-200'}`

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-brand-900">Anggota {i + 1}</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => salinKampus(i)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-500 hover:text-brand-500">
            Samakan kampus dengan ketua
          </button>
          <button type="button" onClick={() => hapus(i)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
            Hapus
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" htmlFor={id('nama_lengkap')} error={k('nama_lengkap')}>
            <input id={id('nama_lengkap')} className={inputCls} value={data.nama_lengkap} onChange={set('nama_lengkap')} required maxLength={150} />
          </Field>
          <Field label="NIM" htmlFor={id('nim')} error={k('nim')}>
            <input id={id('nim')} className={inputCls} value={data.nim} onChange={set('nim')} required maxLength={30} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Universitas" htmlFor={id('universitas')} error={k('universitas')}>
            <input id={id('universitas')} className={inputCls} value={data.universitas} onChange={set('universitas')} required maxLength={150} />
          </Field>
          <Field label="Fakultas" htmlFor={id('fakultas')} error={k('fakultas')}>
            <input id={id('fakultas')} className={inputCls} value={data.fakultas} onChange={set('fakultas')} required maxLength={150} />
          </Field>
          <Field label="Program Studi" htmlFor={id('program_studi')} error={k('program_studi')}>
            <input id={id('program_studi')} className={inputCls} value={data.program_studi} onChange={set('program_studi')} required maxLength={150} />
          </Field>
        </div>

        <Field label="Jenjang Pendidikan" error={k('jenjang')}>
          <div className="flex flex-wrap gap-3">
            {JENJANG.map((j) => (
              <label key={j} className={pill(data.jenjang === j)}>
                <input type="radio" name={`jenjang_${i}`} value={j} checked={data.jenjang === j} onChange={set('jenjang')} className="accent-brand-500" />
                {j}
              </label>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tempat Lahir" htmlFor={id('tempat_lahir')} error={k('tempat_lahir')}>
            <input id={id('tempat_lahir')} className={inputCls} value={data.tempat_lahir} onChange={set('tempat_lahir')} required maxLength={100} />
          </Field>
          <Field label="Tanggal Lahir" htmlFor={id('tanggal_lahir')} error={k('tanggal_lahir')}>
            <input id={id('tanggal_lahir')} type="date" className={inputCls} value={data.tanggal_lahir} onChange={set('tanggal_lahir')} required max={HARI_INI} />
          </Field>
        </div>

        <Field label="Jenis Kelamin" error={k('jenis_kelamin')}>
          <div className="flex gap-3">
            {[['L', 'Laki-laki'], ['P', 'Perempuan']].map(([v, l]) => (
              <label key={v} className={pill(data.jenis_kelamin === v)}>
                <input type="radio" name={`jk_${i}`} value={v} checked={data.jenis_kelamin === v} onChange={set('jenis_kelamin')} className="accent-brand-500" />
                {l}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Alamat Domisili" htmlFor={id('alamat')} error={k('alamat')}>
          <textarea id={id('alamat')} rows={2} className={inputCls} value={data.alamat} onChange={set('alamat')} required maxLength={500} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nomor HP (aktif & WhatsApp)" htmlFor={id('no_whatsapp')} error={k('no_whatsapp')}>
            <input id={id('no_whatsapp')} type="tel" inputMode="tel" className={inputCls} value={data.no_whatsapp} onChange={set('no_whatsapp')} required placeholder="08xxxxxxxxxx" />
          </Field>
          <Field label="Email" htmlFor={id('email')} error={k('email')}>
            <input id={id('email')} type="email" className={inputCls} value={data.email} onChange={set('email')} required maxLength={150} />
          </Field>
        </div>
      </div>
    </div>
  )
}

export default function Pendaftaran() {
  const [form, setForm] = useState(awal)
  const [formasi, setFormasi] = useState([])
  const [formasiGagal, setFormasiGagal] = useState(false)
  const [formasiMemuat, setFormasiMemuat] = useState(true)
  const [bidangIds, setBidangIds] = useState([])
  const [lainnya, setLainnya] = useState(false)
  const [lainnyaTeks, setLainnyaTeks] = useState('')
  const [files, setFiles] = useState({})
  const [setuju, setSetuju] = useState(false)
  const [tipe, setTipe] = useState('individu')
  const [anggota, setAnggota] = useState([])
  const [errors, setErrors] = useState({})
  const [pesan, setPesan] = useState('')
  const [kirim, setKirim] = useState(false)
  const [hasil, setHasil] = useState(null)
  const formRef = useRef(null)

  const muatFormasi = () => {
    setFormasiMemuat(true)
    setFormasiGagal(false)
    return api.get('/public/bidang')
      .then((r) => setFormasi(r.data))
      .catch(() => setFormasiGagal(true))
      .finally(() => setFormasiMemuat(false))
  }

  useEffect(() => {
    muatFormasi()
  }, [])

  const err = (k) => errors[k]?.[0]

  const pilihTipe = (t) => {
    setTipe(t)
    if (t === 'kelompok' && anggota.length === 0) setAnggota([anggotaKosong()])
  }
  const ubahAnggota = (i, f, v) => setAnggota((arr) => arr.map((a, n) => (n === i ? { ...a, [f]: v } : a)))
  const tambahAnggota = () => setAnggota((arr) => (arr.length < MAKS_ANGGOTA ? [...arr, anggotaKosong()] : arr))
  const hapusAnggota = (i) => setAnggota((arr) => arr.filter((_, n) => n !== i))
  const salinKampus = (i) =>
    setAnggota((arr) => arr.map((a, n) => (n === i
      ? { ...a, universitas: form.universitas, fakultas: form.fakultas, program_studi: form.program_studi, jenjang: form.jenjang }
      : a)))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleBidang = (id) =>
    setBidangIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]))

  const pilihFile = (key) => (e) => {
    const file = e.target.files?.[0]
    if (file && file.size > MAKS_UKURAN) {
      setErrors((x) => ({ ...x, [key]: ['Ukuran file maksimal 2MB.'] }))
      e.target.value = ''
      return
    }
    setErrors((x) => ({ ...x, [key]: undefined }))
    setFiles((f) => ({ ...f, [key]: file }))
  }

  const scrollKeError = () => {
    setTimeout(() => {
      formRef.current?.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  const submit = async (e) => {
    e.preventDefault()
    setPesan('')

    // Validasi sisi klien (backend tetap memvalidasi ulang)
    const lokal = {}
    if (!bidangIds.length && !(lainnya && lainnyaTeks.trim())) {
      lokal.bidang = ['Pilih minimal 1 formasi magang atau isi "Lainnya".']
    }
    if (!files.surat_pengantar) lokal.surat_pengantar = ['Surat pengantar dari universitas wajib diunggah.']
    if (!form.jenjang) lokal.jenjang = ['Pilih jenjang pendidikan.']
    if (!form.jenis_kelamin) lokal.jenis_kelamin = ['Pilih jenis kelamin.']
    if (!setuju) lokal.pernyataan = ['Anda harus menyetujui pernyataan.']
    if (tipe === 'kelompok') {
      if (anggota.length < 1) lokal.anggota = ['Tambahkan minimal 1 anggota kelompok.']
      anggota.forEach((a, i) => {
        if (!a.jenjang) lokal[`anggota.${i}.jenjang`] = ['Pilih jenjang pendidikan.']
        if (!a.jenis_kelamin) lokal[`anggota.${i}.jenis_kelamin`] = ['Pilih jenis kelamin.']
      })
    }
    if (Object.keys(lokal).length) {
      setErrors(lokal)
      scrollKeError()
      return
    }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    bidangIds.forEach((id) => fd.append('bidang_magang_ids[]', id))
    if (lainnya && lainnyaTeks.trim()) fd.append('bidang_lainnya', lainnyaTeks.trim())
    DOKUMEN.forEach(({ key }) => { if (files[key]) fd.append(key, files[key]) })
    fd.append('pernyataan', '1')
    fd.append('tipe_pendaftaran', tipe)
    if (tipe === 'kelompok') {
      anggota.forEach((a, i) => Object.entries(a).forEach(([k, v]) => fd.append(`anggota[${i}][${k}]`, v)))
    }

    setKirim(true)
    setErrors({})
    try {
      const { data } = await api.post('/public/pendaftaran', fd)
      setHasil(data.data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (ex) {
      const res = ex.response
      if (res?.status === 422) {
        const e422 = res.data.errors ?? {}
        // gabungkan error formasi (bidang_magang_ids / bidang_lainnya) ke satu kunci
        e422.bidang = e422.bidang_magang_ids ?? e422.bidang_lainnya
        setErrors(e422)
        setPesan('Beberapa isian belum benar. Periksa kolom yang ditandai merah.')
        scrollKeError()
      } else if (res?.status === 429) {
        setPesan('Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.')
      } else {
        setPesan('Pendaftaran gagal dikirim. Periksa koneksi Anda lalu coba lagi.')
      }
    } finally {
      setKirim(false)
    }
  }

  // ---------- Tampilan sukses ----------
  if (hasil) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-brand-500" />
        <h1 className="mt-5 text-2xl font-bold text-brand-900">Pendaftaran Berhasil Dikirim</h1>
        <p className="mt-2 text-slate-600">Data Anda sedang menunggu verifikasi oleh BKPSDM Kota Yogyakarta.</p>
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Nomor Pendaftaran</p>
          <p className="mt-1 text-2xl font-bold tracking-wider text-brand-600">{hasil.nomor_pendaftaran}</p>
          <p className="mt-2 text-xs text-slate-500">Simpan nomor ini untuk mengecek status pendaftaran.</p>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={`/cek-status?nomor=${hasil.nomor_pendaftaran}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Cek Status <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
          <Link to="/" className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-brand-900 hover:border-brand-500">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  // ---------- Formulir ----------
  return (
    <div className="bg-slate-50 pb-16">
      <div className="bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 px-6 pt-14 pb-24 text-center">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
            <Logo light />
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">Formulir Pendaftaran Magang</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-200">
          Isi formulir ini dengan data yang sebenar-benarnya. Data Anda akan digunakan hanya untuk keperluan administrasi magang dan dijamin kerahasiaannya.
        </p>
      </div>

      <div className="mx-auto -mt-14 max-w-3xl px-4 sm:px-6">
        <form ref={formRef} onSubmit={submit} noValidate={false} className="space-y-6">
          {pesan && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pesan}</div>
          )}

          {/* JENIS PENDAFTARAN */}
          <Section judul="Jenis Pendaftaran" icon="users">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Jenis pendaftaran">
              {[
                ['individu', 'Individu', 'Mendaftar sendiri.', 'user'],
                ['kelompok', 'Kelompok', 'Mendaftar bersama beberapa teman.', 'users'],
              ].map(([v, judul, desc, ikon]) => (
                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${tipe === v ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/15' : 'border-slate-300 hover:border-brand-200'}`}>
                  <input type="radio" name="tipe" value={v} checked={tipe === v} onChange={() => pilihTipe(v)} className="sr-only" />
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tipe === v ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon name={ikon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-brand-900">{judul}</span>
                    <span className="block text-xs text-slate-500">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* DATA PRIBADI */}
          <Section judul={tipe === 'kelompok' ? 'Data Ketua Kelompok' : 'Data Pribadi'} icon="user">
            <Field label="Nama Lengkap" htmlFor="nama_lengkap" error={err('nama_lengkap')}>
              <input id="nama_lengkap" className={inputCls} value={form.nama_lengkap} onChange={set('nama_lengkap')} required maxLength={150} />
            </Field>
            <Field label="NIM" htmlFor="nim" error={err('nim')}>
              <input id="nim" className={inputCls} value={form.nim} onChange={set('nim')} required maxLength={30} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Universitas" htmlFor="universitas" error={err('universitas')}>
                <input id="universitas" className={inputCls} value={form.universitas} onChange={set('universitas')} required maxLength={150} />
              </Field>
              <Field label="Fakultas" htmlFor="fakultas" error={err('fakultas')}>
                <input id="fakultas" className={inputCls} value={form.fakultas} onChange={set('fakultas')} required maxLength={150} />
              </Field>
              <Field label="Program Studi" htmlFor="program_studi" error={err('program_studi')}>
                <input id="program_studi" className={inputCls} value={form.program_studi} onChange={set('program_studi')} required maxLength={150} />
              </Field>
            </div>

            <Field label="Jenjang Pendidikan" error={err('jenjang')}>
              <div className="flex flex-wrap gap-3">
                {JENJANG.map((j) => (
                  <label key={j} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${form.jenjang === j ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 text-slate-700 hover:border-brand-200'}`}>
                    <input type="radio" name="jenjang" value={j} checked={form.jenjang === j} onChange={set('jenjang')} className="accent-brand-500" />
                    {j}
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tempat Lahir" htmlFor="tempat_lahir" error={err('tempat_lahir')}>
                <input id="tempat_lahir" className={inputCls} value={form.tempat_lahir} onChange={set('tempat_lahir')} required maxLength={100} />
              </Field>
              <Field label="Tanggal Lahir" htmlFor="tanggal_lahir" error={err('tanggal_lahir')}>
                <input id="tanggal_lahir" type="date" className={inputCls} value={form.tanggal_lahir} onChange={set('tanggal_lahir')} required max={HARI_INI} />
              </Field>
            </div>

            <Field label="Jenis Kelamin" error={err('jenis_kelamin')}>
              <div className="flex gap-3">
                {[['L', 'Laki-laki'], ['P', 'Perempuan']].map(([v, l]) => (
                  <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${form.jenis_kelamin === v ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 text-slate-700 hover:border-brand-200'}`}>
                    <input type="radio" name="jenis_kelamin" value={v} checked={form.jenis_kelamin === v} onChange={set('jenis_kelamin')} className="accent-brand-500" />
                    {l}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Alamat Domisili" htmlFor="alamat" error={err('alamat')}>
              <textarea id="alamat" rows={3} className={inputCls} value={form.alamat} onChange={set('alamat')} required maxLength={500} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nomor HP (aktif & WhatsApp)" htmlFor="no_whatsapp" error={err('no_whatsapp')} hint="Contoh: 081234567890">
                <input id="no_whatsapp" type="tel" inputMode="tel" className={inputCls} value={form.no_whatsapp} onChange={set('no_whatsapp')} required placeholder="08xxxxxxxxxx" />
              </Field>
              <Field label="Email" htmlFor="email" error={err('email')}>
                <input id="email" type="email" className={inputCls} value={form.email} onChange={set('email')} required maxLength={150} />
              </Field>
            </div>
          </Section>

          {/* ANGGOTA KELOMPOK */}
          {tipe === 'kelompok' && (
            <Section judul="Data Anggota Kelompok" icon="users">
              <div data-error={err('anggota') ? 'true' : undefined}>
                {err('anggota') && <p className="mb-3 text-xs text-red-600">{err('anggota')}</p>}
                <div className="space-y-4">
                  {anggota.map((a, i) => (
                    <Anggota key={i} i={i} data={a} ubah={ubahAnggota} hapus={hapusAnggota} salinKampus={salinKampus} err={err} />
                  ))}
                </div>
                <button type="button" onClick={tambahAnggota} disabled={anggota.length >= MAKS_ANGGOTA}
                  className="mt-4 w-full rounded-xl border-2 border-dashed border-brand-200 px-4 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-500 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50">
                  + Tambah Anggota {anggota.length >= MAKS_ANGGOTA && `(maksimal ${MAKS_ANGGOTA})`}
                </button>
              </div>
            </Section>
          )}

          {/* DATA MAGANG */}
          <Section judul="Data Magang" icon="briefcase">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Periode Magang: Mulai" htmlFor="periode_mulai" error={err('periode_mulai')}>
                <input id="periode_mulai" type="date" className={inputCls} value={form.periode_mulai} onChange={set('periode_mulai')} required min={HARI_INI} />
              </Field>
              <Field label="Periode Magang: Selesai" htmlFor="periode_selesai" error={err('periode_selesai')}>
                <input id="periode_selesai" type="date" className={inputCls} value={form.periode_selesai} onChange={set('periode_selesai')} required min={form.periode_mulai || undefined} />
              </Field>
            </div>

            <Field label="Durasi Magang" htmlFor="durasi" error={err('durasi') ?? err('durasi_satuan')}>
              <div className="flex gap-3">
                <input id="durasi" type="number" min={1} max={365} className={`${inputCls} sm:max-w-[140px]`} value={form.durasi} onChange={set('durasi')} required />
                <select aria-label="Satuan durasi" className={`${inputCls} sm:max-w-[140px]`} value={form.durasi_satuan} onChange={set('durasi_satuan')}>
                  <option value="minggu">Minggu</option>
                  <option value="bulan">Bulan</option>
                </select>
              </div>
            </Field>

            <Field label="Minat Formasi Magang" error={err('bidang')} hint="Pilih minimal 1, boleh lebih.">
              {formasiMemuat && <p className="text-sm text-slate-500">Memuat daftar formasi…</p>}

              {formasiGagal && (
                <div className="mb-3 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                  <span>Daftar formasi belum bisa dimuat. Periksa koneksi lalu coba lagi.</span>
                  <button type="button" onClick={muatFormasi}
                    className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100">
                    Coba lagi
                  </button>
                </div>
              )}

              <div className="grid gap-2.5 sm:grid-cols-2">
                {formasi.map((f) => {
                  const aktif = bidangIds.includes(f.id)
                  return (
                    <label key={f.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm transition ${aktif ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-200'}`}>
                      <input type="checkbox" checked={aktif} onChange={() => toggleBidang(f.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" />
                      <span className="text-slate-700">{f.nama_bidang}</span>
                    </label>
                  )
                })}
              </div>

              <div className={`mt-2.5 rounded-lg border px-3.5 py-3 transition ${lainnya ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-200'}`}>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={lainnya} onChange={(e) => setLainnya(e.target.checked)} className="h-4 w-4 shrink-0 accent-brand-500" />
                  Lainnya
                </label>
                {lainnya && (
                  <input
                    className={`${inputCls} mt-3`}
                    placeholder="Tulis formasi yang diminati"
                    value={lainnyaTeks}
                    onChange={(e) => setLainnyaTeks(e.target.value)}
                    maxLength={150}
                    aria-label="Formasi lainnya"
                    autoFocus
                  />
                )}
              </div>
            </Field>
          </Section>

          {/* DOKUMEN */}
          <Section judul="Dokumen Pendukung" icon="fileText">
            <p className="-mt-2 text-xs text-slate-500">Format PDF, JPG, atau PNG. Ukuran maksimal 2MB per file.</p>
            {DOKUMEN.map(({ key, label, wajib }) => (
              <Field key={key} label={label} htmlFor={key} required={wajib} error={err(key)}>
                <input
                  id={key}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={pilihFile(key)}
                  className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-600 transition hover:border-brand-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
                />
                {!wajib && <p className="mt-1 text-xs text-slate-500">Opsional</p>}
              </Field>
            ))}
          </Section>

          {/* PERNYATAAN */}
          <Section judul="Pernyataan" icon="cap">
            <div data-error={err('pernyataan') ? 'true' : undefined}>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
                <span>“Saya menyatakan data yang saya isi benar dan bersedia mengikuti aturan yang berlaku.”</span>
              </label>
              {err('pernyataan') && <p className="mt-1 text-xs text-red-600">{err('pernyataan')}</p>}
            </div>
          </Section>

          <button
            type="submit"
            disabled={kirim}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {kirim ? 'Mengirim…' : (<>Kirim Pendaftaran <Icon name="arrowRight" className="h-4 w-4" /></>)}
          </button>
        </form>
      </div>
    </div>
  )
}