import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import Logo from '../../components/Logo'
import { unduhBuktiPendaftaran } from '../../utils/buktiPendaftaran'
import { statusKuota } from '../../utils/kuota'

// true  = cocokkan dengan backend LAMA (butuh NIK, semester, program, 1 formasi, dokumen[]).
// false = setelah backend diperbarui sesuai formulir baru -> NIK & semester tidak ditampilkan lagi.
const BACKEND_LAMA = true

const JENJANG = ['SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2']
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
  nama_lengkap: '', nim: '', nik: '', semester: '', universitas: '', fakultas: '', program_studi: '', jenjang: '',
  tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', alamat: '', no_whatsapp: '', email: '',
  bidang_magang_id: '', // kosong = sama dengan bidang ketua
})

const awal = {
  nama_lengkap: '', nim: '', nik: '', semester: '', universitas: '', fakultas: '', program_studi: '',
  jenjang: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '',
  alamat: '', no_whatsapp: '', email: '',
  periode_mulai: '', periode_selesai: '', durasi: '', durasi_satuan: 'bulan',
}

const LABEL = {
  nama_lengkap: 'Nama Lengkap', nim: 'NIM', universitas: 'Universitas', fakultas: 'Fakultas',
  program_studi: 'Program Studi', jenjang: 'Jenjang Pendidikan', tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir', jenis_kelamin: 'Jenis Kelamin', alamat: 'Alamat Domisili',
  no_whatsapp: 'Nomor HP', email: 'Email', periode_mulai: 'Periode Magang Mulai',
  periode_selesai: 'Periode Magang Selesai', durasi: 'Durasi Magang', durasi_satuan: 'Satuan Durasi',
  bidang: 'Minat Formasi Magang', bidang_magang_id: 'Bidang Magang', surat_pengantar: 'Surat Pengantar', cv: 'CV',
  transkrip: 'Transkrip / KHS', rencana_kegiatan: 'Rencana Kegiatan', pernyataan: 'Pernyataan',
  anggota: 'Anggota Kelompok', nik: 'NIK', semester: 'Semester', program_magang_id: 'Program Magang',
}

// Pesan bawaan Laravel berbahasa Inggris dibuat lebih jelas.
const terjemah = (m) => {
  if (!m) return m
  if (/required/i.test(m)) return 'wajib diisi.'
  if (/valid email/i.test(m)) return 'format email tidak valid.'
  if (/greater than|may not be/i.test(m)) return 'terlalu panjang atau terlalu besar.'
  if (/valid date/i.test(m)) return 'tanggal tidak valid.'
  return m
}

// Ubah objek error menjadi daftar "kolom mana yang salah".
function daftarMasalah(errors) {
  const hasil = []
  const ada = new Set()
  Object.entries(errors).forEach(([key, msgs]) => {
    if (!msgs?.length || key.startsWith('bidang_magang_ids') || key === 'bidang_lainnya' || key === 'bidang_magang_id' || key.startsWith('dokumen')) return
    const m = key.match(/^anggota\.(\d+)\.(.+)$/)
    const item = m
      ? { anchor: `anggota_${m[1]}_${m[2]}`, label: `Anggota ${Number(m[1]) + 1} – ${LABEL[m[2]] ?? m[2]}` }
      : { anchor: key, label: LABEL[key] ?? key }
    if (ada.has(item.anchor)) return
    ada.add(item.anchor)
    hasil.push({ ...item, pesan: terjemah(msgs[0]) })
  })
  return hasil
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-xs placeholder:text-slate-400/60 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10'

const TEMA = {
  pribadi: {
    root: 'border-slate-200 bg-gradient-to-br from-white via-white to-brand-50 pola-titik',
    head: 'border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white',
    judul: 'text-brand-900',
    ikon: 'bg-brand-500 shadow-brand-500/30',
    deco: 'absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-200/50 blur-2xl',
  },
  anggota: {
    root: 'border-slate-200 bg-slate-50 pola-diagonal',
    head: 'border-b border-slate-200 bg-slate-100/80',
    judul: 'text-brand-900',
    ikon: 'bg-brand-900 shadow-brand-900/30',
    deco: 'absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-100/80 blur-2xl',
  },
  magang: {
    root: 'border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-100/70',
    head: 'border-b border-brand-100 bg-brand-100/60',
    judul: 'text-brand-900',
    ikon: 'bg-brand-600 shadow-brand-600/30',
    deco: 'absolute -top-24 -right-24 h-72 w-72 rounded-full border-[36px] border-brand-500/10',
  },
  dokumen: {
    root: 'border-slate-200 bg-white pola-grid',
    head: 'border-b border-slate-100 bg-gradient-to-r from-slate-100 to-white',
    judul: 'text-brand-900',
    ikon: 'bg-brand-500 shadow-brand-500/30',
    deco: 'absolute -right-16 -bottom-16 h-52 w-52 rounded-full bg-brand-100/70 blur-2xl',
  },
  pernyataan: {
    root: 'border-brand-900 bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 text-white',
    head: 'border-b border-white/10 bg-white/5',
    judul: 'text-white',
    ikon: 'bg-white/15 ring-1 ring-white/25',
    deco: 'absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-xl',
  },
}

const NOMOR_LANGKAH = { pribadi: 1, magang: 2, anggota: 3, dokumen: 4, pernyataan: 5 }

function Section({ judul, icon, tema = 'pribadi', children }) {
  const t = TEMA[tema]
  return (
    <section id={`bagian-${tema}`} className={`relative scroll-mt-24 overflow-hidden rounded-2xl border shadow-sm ${t.root}`}>
      <div aria-hidden="true" className={`pointer-events-none ${t.deco}`} />
      <div className={`relative flex items-center gap-3 px-6 py-4 sm:px-8 ${t.head}`}>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${t.ikon}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <p className={`text-[11px] font-semibold tracking-wider uppercase ${tema === 'pernyataan' ? 'text-white/60' : 'text-slate-400'}`}>
            Langkah {NOMOR_LANGKAH[tema]} dari 5
          </p>
          <h2 className={`text-base leading-tight font-bold ${t.judul}`}>{judul}</h2>
        </div>
      </div>
      <div className="relative space-y-5 px-6 py-6 sm:px-8 sm:py-7">{children}</div>
    </section>
  )
}

function lompatBagian(tema) {
  document.getElementById(`bagian-${tema}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Daftar langkah di samping form (layar lebar). Menandai bagian yang sedang dilihat.
function StepSamping({ langkah, aktif }) {
  const idxAktif = langkah.findIndex((l) => l.tema === aktif)
  return (
    <nav aria-label="Langkah pendaftaran" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Langkah Pendaftaran</p>
      <ol className="mt-4">
        {langkah.map((l, i) => {
          const sekarang = l.tema === aktif
          const lewat = i < idxAktif
          return (
            <li key={l.tema} className="relative pb-5 last:pb-0">
              {i < langkah.length - 1 && (
                <span aria-hidden="true" className={`absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5 ${lewat ? 'bg-brand-500' : 'bg-slate-200'}`} />
              )}
              <button type="button" onClick={() => lompatBagian(l.tema)} aria-current={sekarang ? 'step' : undefined}
                className="group flex w-full items-start gap-3 text-left">
                <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${sekarang ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-4 ring-brand-100' : lewat ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'}`}>
                  {lewat ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                  ) : i + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className={`block text-sm leading-tight font-semibold ${sekarang ? 'text-brand-900' : 'text-slate-600 group-hover:text-brand-600'}`}>{l.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{l.ket}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Versi ringkas untuk layar kecil: deretan chip yang bisa digeser.
function StepMobile({ langkah, aktif }) {
  return (
    <nav aria-label="Langkah pendaftaran" className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 lg:hidden">
      <ol className="flex gap-2">
        {langkah.map((l, i) => (
          <li key={l.tema}>
            <button type="button" onClick={() => lompatBagian(l.tema)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${l.tema === aktif ? 'border-brand-500 bg-brand-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${l.tema === aktif ? 'bg-white/20' : 'bg-slate-100'}`}>{i + 1}</span>
              {l.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Field({ label, error, hint, required = true, children, htmlFor, anchor }) {
  return (
    <div id={`fld-${anchor ?? htmlFor}`} data-error={error ? 'true' : undefined}>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// Jenjang (dropdown) + kolom institusi yang menyesuaikan:
// SMA/SMK -> Nama Sekolah & Jurusan; selain itu -> Universitas, Fakultas, Program Studi.
function PendidikanFields({ data, ubah, idp, err }) {
  const sekolah = data.jenjang === 'SMA/SMK'
  const contoh = sekolah
    ? { universitas: 'Contoh: SMK Negeri 2 Yogyakarta', program_studi: 'Contoh: Teknik Komputer dan Jaringan' }
    : { universitas: 'Contoh: Universitas Duta Bangsa Surakarta', fakultas: 'Contoh: Teknik', program_studi: 'Contoh: Teknik Informatika' }
  const teks = (f) => (
    <input id={`${idp}${f}`} placeholder={contoh[f]} className={inputCls} value={data[f]} onChange={(e) => ubah(f, e.target.value)} required maxLength={150} />
  )

  return (
    <>
      <Field label="Jenjang Pendidikan" htmlFor={`${idp}jenjang`} error={err('jenjang')}>
        <select id={`${idp}jenjang`} className={inputCls} value={data.jenjang} onChange={(e) => ubah('jenjang', e.target.value)} required>
          <option value="">Pilih jenjang pendidikan</option>
          {JENJANG.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </Field>

      {data.jenjang && (sekolah ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Sekolah" htmlFor={`${idp}universitas`} error={err('universitas')}>{teks('universitas')}</Field>
          <Field label="Jurusan" htmlFor={`${idp}program_studi`} error={err('program_studi')}>{teks('program_studi')}</Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Universitas" htmlFor={`${idp}universitas`} error={err('universitas')}>{teks('universitas')}</Field>
          <Field label="Fakultas" htmlFor={`${idp}fakultas`} error={err('fakultas')}>{teks('fakultas')}</Field>
          <Field label="Program Studi" htmlFor={`${idp}program_studi`} error={err('program_studi')}>{teks('program_studi')}</Field>
        </div>
      ))}
    </>
  )
}

function Anggota({ i, data, ubah, hapus, salinKampus, bisaSalin, formasi, bidangKetua, err }) {
  const k = (f) => err(`anggota.${i}.${f}`)
  const set = (f) => (e) => ubah(i, f, e.target.value)
  const id = (f) => `anggota_${i}_${f}`
  const pill = (aktif) =>
    `flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${aktif ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-200'}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-brand-900">Anggota {i + 1}</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => hapus(i)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
            Hapus
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" htmlFor={id('nama_lengkap')} error={k('nama_lengkap')}>
            <input id={id('nama_lengkap')} placeholder="Contoh: Rina Wulandari" className={inputCls} value={data.nama_lengkap} onChange={set('nama_lengkap')} required maxLength={150} />
          </Field>
          <Field label="NIM" htmlFor={id('nim')} error={k('nim')} hint="Hanya angka">
            <input id={id('nim')} placeholder="Contoh: 21051235" inputMode="numeric" pattern="[0-9]+" title="NIM hanya boleh berisi angka" className={inputCls} value={data.nim} onChange={(e) => ubah(i, 'nim', e.target.value.replace(/\D/g, ''))} required maxLength={30} />
          </Field>
        </div>

        {BACKEND_LAMA && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NIK" htmlFor={id('nik')} error={k('nik')} hint="16 digit angka sesuai KTP">
              <input id={id('nik')} placeholder="Contoh: 3404012345670002" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} className={inputCls} value={data.nik} onChange={(e) => ubah(i, 'nik', e.target.value.replace(/\D/g, ''))} required title="NIK terdiri dari 16 digit angka" />
            </Field>
            <Field label="Semester" htmlFor={id('semester')} error={k('semester')} hint="Ketik angka atau pilih dari daftar (1 sampai 14)">
              <input id={id('semester')} list={`daftar-semester-${i}`} placeholder="Ketik atau pilih, contoh: 6" inputMode="numeric" maxLength={2} pattern="([1-9]|1[0-4])" title="Semester berupa angka 1 sampai 14" className={inputCls} value={data.semester} onChange={(e) => ubah(i, 'semester', e.target.value.replace(/\D/g, ''))} required />
              <datalist id={`daftar-semester-${i}`}>
                {Array.from({ length: 14 }, (_, n) => n + 1).map((n) => <option key={n} value={n} />)}
              </datalist>
            </Field>
          </div>
        )}

        <Field label="Bidang Magang" htmlFor={id('bidang_magang_id')} error={k('bidang_magang_id')} required={false}
          hint="Boleh berbeda dari ketua. Kuota dihitung per orang di bidang yang dipilih.">
          <select id={id('bidang_magang_id')} className={inputCls} value={data.bidang_magang_id} onChange={set('bidang_magang_id')}>
            <option value="">{bidangKetua ? `Sama dengan ketua (${bidangKetua})` : 'Sama dengan ketua'}</option>
            {formasi.map((f) => (
              <option key={f.id} value={f.id} disabled={['penuh', 'tutup'].includes(statusKuota(f).kode)}>
                {f.nama_bidang}{f.kuota === null ? '' : f.kuota === 0 ? ' — ditutup' : f.sisa_kuota === 0 ? ' — penuh' : ` — sisa ${f.sisa_kuota}`}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-brand-900">Data Pendidikan</p>
          <button type="button" onClick={() => salinKampus(i)} disabled={!bisaSalin}
            title={bisaSalin ? 'Isi jenjang, kampus, fakultas, dan prodi sama seperti ketua' : 'Lengkapi data pendidikan ketua terlebih dahulu'}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:border-brand-500 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50">
            Samakan dengan ketua
          </button>
        </div>
        <PendidikanFields data={data} ubah={(f, v) => ubah(i, f, v)} idp={`anggota_${i}_`} err={k} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tempat Lahir" htmlFor={id('tempat_lahir')} error={k('tempat_lahir')}>
            <input id={id('tempat_lahir')} placeholder="Contoh: Sleman" className={inputCls} value={data.tempat_lahir} onChange={set('tempat_lahir')} required maxLength={100} />
          </Field>
          <Field label="Tanggal Lahir" htmlFor={id('tanggal_lahir')} error={k('tanggal_lahir')} hint="Pilih dari kalender. Contoh: 15 Mei 2003">
            <input id={id('tanggal_lahir')} type="date" className={inputCls} value={data.tanggal_lahir} onChange={set('tanggal_lahir')} required max={HARI_INI} />
          </Field>
        </div>

        <Field label="Jenis Kelamin" anchor={id('jenis_kelamin')} error={k('jenis_kelamin')}>
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
          <textarea id={id('alamat')} placeholder="Contoh: Jl. Melati No. 5, Kel. Caturtunggal, Kec. Depok, Kab. Sleman" rows={2} className={inputCls} value={data.alamat} onChange={set('alamat')} required maxLength={500} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nomor HP (aktif & WhatsApp)" htmlFor={id('no_whatsapp')} error={k('no_whatsapp')}>
            <input id={id('no_whatsapp')} type="tel" inputMode="numeric" pattern="[0-9]{9,15}" maxLength={15} title="Nomor HP hanya boleh berisi angka (9-15 digit)" className={inputCls} value={data.no_whatsapp} onChange={(e) => ubah(i, 'no_whatsapp', e.target.value.replace(/\D/g, ''))} required placeholder="Contoh: 081234567890" />
          </Field>
          <Field label="Email" htmlFor={id('email')} error={k('email')}>
            <input id={id('email')} placeholder="Contoh: rina.wulandari@email.com" type="email" className={inputCls} value={data.email} onChange={set('email')} required maxLength={150} />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ---------- Isi otomatis dari pendaftaran lama (tombol "Perbaiki & Daftar Ulang") ----------
const teksAman = (v) => (v == null ? '' : String(v))

// Jenjang belum disimpan di backend lama: kalau fakultas "-" berarti sekolah, selain itu dianggap S1 (bisa diganti).
const tebakJenjang = (p) => p.jenjang || (p.fakultas === '-' ? 'SMA/SMK' : 'S1')

const orangDariPrefill = (p) => ({
  nama_lengkap: teksAman(p.nama_lengkap), nim: teksAman(p.nim), nik: teksAman(p.nik), semester: teksAman(p.semester),
  universitas: teksAman(p.universitas), fakultas: p.fakultas === '-' ? '' : teksAman(p.fakultas),
  program_studi: teksAman(p.program_studi), jenjang: tebakJenjang(p),
  tempat_lahir: teksAman(p.tempat_lahir), tanggal_lahir: teksAman(p.tanggal_lahir).slice(0, 10),
  jenis_kelamin: teksAman(p.jenis_kelamin), alamat: teksAman(p.alamat),
  no_whatsapp: teksAman(p.no_whatsapp).replace(/\D/g, ''), email: teksAman(p.email),
})

function formDariPrefill(p) {
  const mulai = teksAman(p.periode_mulai).slice(0, 10)
  const selesai = teksAman(p.periode_selesai).slice(0, 10)
  // Periode & durasi lama tetap diisi; kalau tanggal mulai sudah lewat, form akan meminta diganti saat dikirim.
  let durasi = ''
  if (mulai && selesai) {
    const hari = Math.round((new Date(selesai) - new Date(mulai)) / 86400000)
    durasi = String(Math.max(1, Math.round(hari / 30)))
  }
  return {
    ...awal,
    ...orangDariPrefill(p),
    periode_mulai: mulai,
    periode_selesai: selesai,
    durasi,
    durasi_satuan: 'bulan',
  }
}

export default function Pendaftaran() {
  const prefill = useLocation().state?.prefill ?? null
  const [form, setForm] = useState(() => (prefill ? formDariPrefill(prefill) : awal))
  const [formasi, setFormasi] = useState([])
  const [formasiGagal, setFormasiGagal] = useState(false)
  const [formasiMemuat, setFormasiMemuat] = useState(true)
  const [bidangIds, setBidangIds] = useState(() => (prefill?.bidang_magang_id ? [prefill.bidang_magang_id] : []))
  const [lainnya, setLainnya] = useState(false)
  const [lainnyaTeks, setLainnyaTeks] = useState('')
  const [files, setFiles] = useState({})
  const [setuju, setSetuju] = useState(false)
  const [anggota, setAnggota] = useState(() =>
    Array.isArray(prefill?.anggota) ? prefill.anggota.slice(0, MAKS_ANGGOTA).map(orangDariPrefill) : [])
  const [errors, setErrors] = useState({})
  const [pesan, setPesan] = useState('')
  const [kirim, setKirim] = useState(false)
  const [hasil, setHasil] = useState(null)
  const [jumlahAnggota, setJumlahAnggota] = useState(0)
  const [pdfGagal, setPdfGagal] = useState(false)
  const [programId, setProgramId] = useState(null)
  const formRef = useRef(null)
  const [bagianAktif, setBagianAktif] = useState('pribadi')

  useEffect(() => {
    const els = Object.keys(NOMOR_LANGKAH).map((t) => document.getElementById(`bagian-${t}`)).filter(Boolean)
    if (!els.length || !('IntersectionObserver' in window)) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        const tampak = entries.filter((e) => e.isIntersecting)
        if (tampak.length) setBagianAktif(tampak[0].target.id.replace('bagian-', ''))
      },
      { rootMargin: '-25% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [hasil])

  const langkah = [
    { tema: 'pribadi', label: anggota.length > 0 ? 'Data Ketua' : 'Data Pribadi', ket: 'Identitas dan pendidikan' },
    { tema: 'magang', label: 'Data Magang', ket: 'Periode dan formasi' },
    { tema: 'anggota', label: 'Anggota Kelompok', ket: 'Opsional' },
    { tema: 'dokumen', label: 'Dokumen', ket: 'Unggah berkas pendukung' },
    { tema: 'pernyataan', label: 'Pernyataan', ket: 'Konfirmasi dan kirim' },
  ]

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
    if (BACKEND_LAMA) {
      api.get('/public/program').then((r) => setProgramId(r.data[0]?.id ?? null)).catch(() => {})
    }
  }, [])

  const err = (k) => terjemah(errors[k]?.[0])
  const masalah = daftarMasalah(errors)

  const lompat = (anchor) => {
    const el = document.getElementById(`fld-${anchor}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.querySelector('input, textarea, select')?.focus({ preventScroll: true })
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
      formRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
    if (BACKEND_LAMA && !bidangIds.length) lokal.bidang = ['Pilih minimal 1 formasi dari daftar (pilihan "Lainnya" saja belum bisa diproses).']
    if (!setuju) lokal.pernyataan = ['Anda harus menyetujui pernyataan.']
    anggota.forEach((a, i) => {
      if (!a.jenjang) lokal[`anggota.${i}.jenjang`] = ['Pilih jenjang pendidikan.']
      if (!a.jenis_kelamin) lokal[`anggota.${i}.jenis_kelamin`] = ['Pilih jenis kelamin.']
    })
    if (Object.keys(lokal).length) {
      setErrors(lokal)
      scrollKeError()
      return
    }

    if (BACKEND_LAMA && !programId) {
      setPesan('Program magang belum tersedia atau gagal dimuat. Muat ulang halaman, atau hubungi admin.')
      scrollKeError()
      return
    }

    const fd = new FormData()
    const urutanDokumen = []
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (form.jenjang === 'SMA/SMK') fd.set('fakultas', '-') // tidak dipakai untuk sekolah
    bidangIds.forEach((id) => fd.append('bidang_magang_ids[]', id))
    if (lainnya && lainnyaTeks.trim()) fd.append('bidang_lainnya', lainnyaTeks.trim())
    DOKUMEN.forEach(({ key }) => { if (files[key]) fd.append(key, files[key]) })
    fd.append('pernyataan', '1')
    if (BACKEND_LAMA) {
      fd.append('program_magang_id', programId)
      fd.append('bidang_magang_id', bidangIds[0])
      DOKUMEN.forEach(({ key }) => {
        if (!files[key]) return
        const n = urutanDokumen.length
        fd.append(`dokumen[${n}][jenis_dokumen]`, key)
        fd.append(`dokumen[${n}][file]`, files[key])
        urutanDokumen.push(key)
      })
    }
    // Tanpa anggota = mendaftar sendiri (individu); ada anggota = kelompok.
    fd.append('tipe_pendaftaran', anggota.length > 0 ? 'kelompok' : 'individu')
    anggota.forEach((a, i) => {
      Object.entries(a).forEach(([k, v]) => fd.append(`anggota[${i}][${k}]`, v))
      if (a.jenjang === 'SMA/SMK') fd.set(`anggota[${i}][fakultas]`, '-')
    })

    setKirim(true)
    setErrors({})
    try {
      const { data } = await api.post('/public/pendaftaran', fd)
      setHasil(data.data)
      setJumlahAnggota(anggota.length)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // PDF bukti pendaftaran (berisi token) otomatis terunduh setelah berhasil daftar.
      unduhBuktiPendaftaran(data.data, { jumlahAnggota: anggota.length }).catch(() => setPdfGagal(true))
    } catch (ex) {
      const res = ex.response
      if (res?.status === 422) {
        const e422 = res.data.errors ?? {}
        // gabungkan error formasi (bidang_magang_ids / bidang_lainnya) ke satu kunci
        e422.bidang = e422.bidang_magang_ids ?? e422.bidang_lainnya ?? e422.bidang_magang_id
        Object.keys(e422).forEach((k) => {
          const m = k.match(/^dokumen\.(\d+)\.file$/)
          if (m && urutanDokumen[m[1]]) e422[urutanDokumen[m[1]]] = e422[k]
        })
        setErrors(e422)
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
        <p className="mt-4 text-sm text-slate-600">
          {pdfGagal
            ? 'PDF bukti pendaftaran gagal dibuat otomatis. Silakan unduh manual dengan tombol di bawah.'
            : 'Bukti pendaftaran (PDF) berisi token Anda otomatis terunduh. Jika belum, unduh dengan tombol di bawah.'}
        </p>
        <button
          type="button"
          onClick={() => { setPdfGagal(false); unduhBuktiPendaftaran(hasil, { jumlahAnggota }).catch(() => setPdfGagal(true)) }}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-brand-500 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
        >
          <Icon name="fileText" className="h-4 w-4" /> Unduh Bukti Pendaftaran (PDF)
        </button>
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
    <div className="relative overflow-x-clip bg-slate-50 pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute top-[28rem] -left-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-[70rem] -right-32 h-96 w-96 rounded-full bg-brand-100/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 px-6 pt-14 pb-24 text-center">
        <div aria-hidden="true" className="pola-titik-putih pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full border-[48px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative flex justify-center">
          <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
            <Logo light />
          </div>
        </div>
        <h1 className="relative mt-6 text-3xl font-extrabold text-white sm:text-4xl">Formulir Pendaftaran Magang</h1>
        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-200">
          Isi formulir ini dengan data yang sebenar-benarnya. Data Anda akan digunakan hanya untuk keperluan administrasi magang dan dijamin kerahasiaannya.
        </p>
        <ul className="relative mt-6 hidden flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-white sm:flex">
          {[['fileText', '5 langkah pendaftaran'], ['shieldCheck', 'Data dijamin kerahasiaannya'], ['clock', 'Pantau status dengan nomor pendaftaran']].map(([ikon, teks]) => (
            <li key={teks} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/20 backdrop-blur">
              <Icon name={ikon} className="h-3.5 w-3.5" /> {teks}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto -mt-14 max-w-6xl px-4 sm:px-6">
        <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
          <StepSamping langkah={langkah} aktif={bagianAktif} />
          <Link to="/info-kuota"
            className="group block rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm transition hover:border-brand-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white"><Icon name="target" className="h-4.5 w-4.5" /></span>
            <p className="mt-3 text-sm font-bold text-brand-900">Cek kuota formasi</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Lihat formasi mana yang masih tersedia sebelum mengisi.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:gap-2">Buka info kuota <Icon name="arrowRight" className="h-3.5 w-3.5" /></span>
          </Link>
        </aside>

        <div className="min-w-0">
        <StepMobile langkah={langkah} aktif={bagianAktif} />
        <form ref={formRef} onSubmit={submit} noValidate={false} className="space-y-6">
          {prefill && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
              <p className="font-bold">Perbaiki pendaftaran {prefill.nomor_pendaftaran}</p>
              <p className="mt-0.5 text-xs text-amber-800/80">
                Data lama sudah terisi otomatis. Sesuaikan dengan catatan di bawah, unggah ulang dokumen, lalu kirim.
              </p>
              {prefill.catatan && (
                <div className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-3 text-red-800">
                  <p className="text-[11px] font-semibold tracking-wide uppercase opacity-70">Catatan dari BKPSDM</p>
                  <p className="mt-1 whitespace-pre-line text-sm font-medium">{prefill.catatan}</p>
                </div>
              )}
              <p className="mt-3 text-xs text-amber-800/80">
                Dokumen tidak bisa terisi otomatis, jadi unggah ulang semua berkas (terutama yang dicatat di atas).
                Periksa juga jenjang pendidikan dan periode magang.
              </p>
              {prefill.periode_mulai && String(prefill.periode_mulai).slice(0, 10) < HARI_INI && (
                <p className="mt-2 text-xs font-semibold text-red-700">
                  Tanggal mulai magang yang lama sudah lewat. Ganti periode magang dengan tanggal baru.
                </p>
              )}
            </div>
          )}

          {(masalah.length > 0 || pesan) && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {masalah.length > 0 && (
                <>
                  <p className="font-semibold">Pendaftaran belum bisa dikirim. Periksa {masalah.length} isian berikut:</p>
                  <ul className="mt-2 space-y-1">
                    {masalah.map((m) => (
                      <li key={m.anchor}>
                        <button type="button" onClick={() => lompat(m.anchor)} className="text-left hover:underline">
                          <span className="font-semibold">{m.label}</span>: {m.pesan}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {pesan && <p className={masalah.length > 0 ? 'mt-3' : ''}>{pesan}</p>}
            </div>
          )}

          {/* DATA PRIBADI */}
          <Section judul={anggota.length > 0 ? 'Data Ketua Kelompok' : 'Data Pribadi'} icon="user" tema="pribadi">
            <Field label="Nama Lengkap" htmlFor="nama_lengkap" error={err('nama_lengkap')}>
              <input id="nama_lengkap" placeholder="Contoh: Budi Santoso" className={inputCls} value={form.nama_lengkap} onChange={set('nama_lengkap')} required maxLength={150} />
            </Field>
            <Field label="NIM" htmlFor="nim" error={err('nim')} hint="Hanya angka">
              <input id="nim" placeholder="Contoh: 21051234" inputMode="numeric" pattern="[0-9]+" title="NIM hanya boleh berisi angka" className={inputCls} value={form.nim} onChange={(e) => setForm((f) => ({ ...f, nim: e.target.value.replace(/\D/g, '') }))} required maxLength={30} />
            </Field>
            {BACKEND_LAMA && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="NIK" htmlFor="nik" error={err('nik')} hint="16 digit angka sesuai KTP">
                  <input id="nik" placeholder="Contoh: 3404012345670001" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} className={inputCls} value={form.nik} onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value.replace(/\D/g, '') }))} required title="NIK terdiri dari 16 digit angka" />
                </Field>
                <Field label="Semester" htmlFor="semester" error={err('semester')} hint="Ketik angka atau pilih dari daftar (1 sampai 14)">
                  <input id="semester" list="daftar-semester" placeholder="Ketik atau pilih, contoh: 6" inputMode="numeric" maxLength={2} pattern="([1-9]|1[0-4])" title="Semester berupa angka 1 sampai 14" className={inputCls} value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value.replace(/\D/g, '') }))} required />
                  <datalist id="daftar-semester">
                    {Array.from({ length: 14 }, (_, n) => n + 1).map((n) => <option key={n} value={n} />)}
                  </datalist>
                </Field>
              </div>
            )}

            <PendidikanFields data={form} ubah={(f, v) => setForm((x) => ({ ...x, [f]: v }))} idp="" err={err} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tempat Lahir" htmlFor="tempat_lahir" error={err('tempat_lahir')}>
                <input id="tempat_lahir" placeholder="Contoh: Yogyakarta" className={inputCls} value={form.tempat_lahir} onChange={set('tempat_lahir')} required maxLength={100} />
              </Field>
              <Field label="Tanggal Lahir" htmlFor="tanggal_lahir" error={err('tanggal_lahir')} hint="Pilih dari kalender. Contoh: 15 Mei 2003">
                <input id="tanggal_lahir" type="date" className={inputCls} value={form.tanggal_lahir} onChange={set('tanggal_lahir')} required max={HARI_INI} />
              </Field>
            </div>

            <Field label="Jenis Kelamin" anchor="jenis_kelamin" error={err('jenis_kelamin')}>
              <div className="flex gap-3">
                {[['L', 'Laki-laki'], ['P', 'Perempuan']].map(([v, l]) => (
                  <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${form.jenis_kelamin === v ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-200'}`}>
                    <input type="radio" name="jenis_kelamin" value={v} checked={form.jenis_kelamin === v} onChange={set('jenis_kelamin')} className="accent-brand-500" />
                    {l}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Alamat Domisili" htmlFor="alamat" error={err('alamat')}>
              <textarea id="alamat" placeholder="Contoh: Jl. Kenanga No. 12, Kel. Umbulharjo, Kec. Umbulharjo, Kota Yogyakarta" rows={3} className={inputCls} value={form.alamat} onChange={set('alamat')} required maxLength={500} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nomor HP (aktif & WhatsApp)" htmlFor="no_whatsapp" error={err('no_whatsapp')} hint="Contoh: 081234567890">
                <input id="no_whatsapp" type="tel" inputMode="numeric" pattern="[0-9]{9,15}" maxLength={15} title="Nomor HP hanya boleh berisi angka (9-15 digit)" className={inputCls} value={form.no_whatsapp} onChange={(e) => setForm((f) => ({ ...f, no_whatsapp: e.target.value.replace(/\D/g, '') }))} required placeholder="Contoh: 081234567890" />
              </Field>
              <Field label="Email" htmlFor="email" error={err('email')}>
                <input id="email" placeholder="Contoh: budi.santoso@email.com" type="email" className={inputCls} value={form.email} onChange={set('email')} required maxLength={150} />
              </Field>
            </div>
          </Section>

          {/* B. DATA MAGANG */}
          <Section judul="Data Magang" icon="briefcase" tema="magang">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Periode Magang: Mulai" htmlFor="periode_mulai" error={err('periode_mulai')} hint="Contoh: 5 Januari 2027">
                <input id="periode_mulai" type="date" className={inputCls} value={form.periode_mulai} onChange={set('periode_mulai')} required min={HARI_INI} />
              </Field>
              <Field label="Periode Magang: Selesai" htmlFor="periode_selesai" error={err('periode_selesai')} hint="Contoh: 5 April 2027">
                <input id="periode_selesai" type="date" className={inputCls} value={form.periode_selesai} onChange={set('periode_selesai')} required min={form.periode_mulai || undefined} />
              </Field>
            </div>

            <Field label="Durasi Magang" htmlFor="durasi" error={err('durasi') ?? err('durasi_satuan')} hint="Contoh: 3 bulan, atau 12 minggu">
              <div className="flex gap-3">
                <input id="durasi" placeholder="Contoh: 3" type="number" min={1} max={365} className={`${inputCls} sm:max-w-[140px]`} value={form.durasi} onChange={set('durasi')} required />
                <select aria-label="Satuan durasi" className={`${inputCls} sm:max-w-[140px]`} value={form.durasi_satuan} onChange={set('durasi_satuan')}>
                  <option value="minggu">Minggu</option>
                  <option value="bulan">Bulan</option>
                </select>
              </div>
            </Field>

            <Field label="Minat Formasi Magang" anchor="bidang" error={err('bidang')} hint="Pilih minimal 1, boleh lebih.">
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
                  const s = statusKuota(f)
                  const diatur = f.kuota !== null && f.kuota > 0
                  const habis = s.kode === 'penuh' || s.kode === 'tutup'
                  const terkunci = habis && !aktif // formasi penuh/ditutup tidak bisa dipilih
                  return (
                    <label key={f.id} aria-disabled={terkunci}
                      className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm transition ${terkunci ? 'cursor-not-allowed border-slate-200 bg-slate-50' : aktif ? 'cursor-pointer border-brand-500 bg-brand-50' : 'cursor-pointer border-slate-300 bg-white hover:border-brand-200'}`}>
                      <input type="checkbox" checked={aktif} disabled={terkunci} onChange={() => toggleBidang(f.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500 disabled:cursor-not-allowed" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-medium ${terkunci ? 'text-slate-400' : 'text-slate-700'}`}>{f.nama_bidang}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.badge}`}>{s.label}</span>
                        </div>
                        <p className={`mt-1 text-xs ${terkunci ? 'text-slate-400' : 'text-slate-500'}`}>
                          {diatur && !habis && (
                            <>
                              Sisa <span className={`font-semibold tabular-nums ${s.kode === 'hampir' ? 'text-amber-700' : 'text-slate-700'}`}>{f.sisa_kuota}</span> dari {f.kuota} kuota
                            </>
                          )}
                          {s.kode === 'penuh' && `Kuota ${f.kuota} sudah terisi semua`}
                          {s.kode === 'tutup' && 'Formasi sedang ditutup'}
                          {s.kode === 'belum' && 'Kuota belum ditetapkan'}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {formasi.length > 0 && (
                <p className="mt-2.5 text-xs text-slate-500">
                  Kuota dihitung per orang dan dapat berubah sewaktu-waktu.{' '}
                  <a href="/info-kuota" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-500 hover:underline">Lihat info kuota lengkap</a>
                </p>
              )}

              <div className={`mt-2.5 rounded-lg border px-3.5 py-3 transition ${lainnya ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-200'}`}>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={lainnya} onChange={(e) => setLainnya(e.target.checked)} className="h-4 w-4 shrink-0 accent-brand-500" />
                  Lainnya
                </label>
                {lainnya && (
                  <input
                    className={`${inputCls} mt-3`}
                    placeholder="Contoh: Pendamping Layanan Kepegawaian"
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

          {/* ANGGOTA KELOMPOK (opsional) */}
          <Section judul="Anggota Kelompok (Opsional)" icon="users" tema="anggota">
            <p className="-mt-2 text-sm text-slate-600">
              Mendaftar sendiri? Lewati bagian ini. Mendaftar bersama teman? Tambahkan data tiap anggota (maksimal {MAKS_ANGGOTA} orang di luar ketua).
            </p>
            {anggota.length > 0 && (
              <div className="space-y-4">
                {anggota.map((a, i) => (
                  <Anggota key={i} i={i} data={a} ubah={ubahAnggota} hapus={hapusAnggota} salinKampus={salinKampus} bisaSalin={Boolean(form.jenjang && form.universitas && form.program_studi)} formasi={formasi} bidangKetua={formasi.find((f) => f.id === bidangIds[0])?.nama_bidang} err={err} />
                ))}
              </div>
            )}
            <button type="button" onClick={tambahAnggota} disabled={anggota.length >= MAKS_ANGGOTA}
              className="w-full rounded-xl border-2 border-dashed border-brand-200 px-4 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-500 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50">
              + Tambah Anggota {anggota.length >= MAKS_ANGGOTA && `(maksimal ${MAKS_ANGGOTA})`}
            </button>
          </Section>

          {/* C. DOKUMEN */}
          <Section judul="Dokumen Pendukung" icon="fileText" tema="dokumen">
            <p className="-mt-2 text-xs text-slate-500">Format PDF, JPG, atau PNG. Ukuran maksimal 2MB per file.</p>
            {DOKUMEN.map(({ key, label, wajib }) => (
              <Field key={key} label={label} htmlFor={key} required={wajib} error={err(key)}>
                <input
                  id={key}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={pilihFile(key)}
                  className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-white/90 p-2.5 text-sm text-slate-600 transition hover:border-brand-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
                />
                {!wajib && <p className="mt-1 text-xs text-slate-500">Opsional</p>}
              </Field>
            ))}
          </Section>

          {/* D. PERNYATAAN */}
          <Section judul="Pernyataan" icon="cap" tema="pernyataan">
            <div id="fld-pernyataan" data-error={err('pernyataan') ? 'true' : undefined}>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
                <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
                <span>“Saya menyatakan data yang saya isi benar dan bersedia mengikuti aturan yang berlaku.”</span>
              </label>
              {err('pernyataan') && <p className="mt-2 text-xs font-semibold text-red-200">{err('pernyataan')}</p>}
            </div>
          </Section>

          <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-bold text-brand-900">Siap mengirim pendaftaran?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Setelah terkirim, Anda mendapat nomor pendaftaran dan bukti pendaftaran (PDF).
              </p>
            </div>
            <button
              type="submit"
              disabled={kirim}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {kirim ? 'Mengirim…' : (<>Kirim Pendaftaran <Icon name="arrowRight" className="h-4 w-4" /></>)}
            </button>
          </div>
        </form>
        </div>
        </div>
      </div>
    </div>
  )
}