import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import { FooterBody } from '../../components/Footer'
import { Container, PageHero, Reveal, Slide, SlideStack, Sticker } from '../../components/Motif'
import useRuangFooter from '../../hooks/useRuangFooter'
import { unduhBuktiPendaftaran } from '../../utils/buktiPendaftaran'
import { statusKuota } from '../../utils/kuota'

// true  = cocokkan dengan backend LAMA (butuh NIK, semester, program, 1 formasi, dokumen[]).
// false = setelah backend diperbarui sesuai formulir baru -> NIK & semester tidak ditampilkan lagi.
const BACKEND_LAMA = true

const JENJANG = ['SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1']
const HARI_INI = new Date().toISOString().slice(0, 10)
const MAKS_UKURAN = 2 * 1024 * 1024 // 2MB, sama dengan validasi backend

const DOKUMEN = [
  { key: 'surat_pengantar', label: 'Surat Pengantar dari Universitas', wajib: true },
  { key: 'cv', label: 'Curriculum Vitae (CV)', wajib: false },
  { key: 'transkrip', label: 'Transkrip Nilai Sementara / KHS', wajib: false },
  { key: 'rencana_kegiatan', label: 'Rencana Kegiatan Magang', wajib: false },
]

const MAKS_ANGGOTA = 9 // anggota di luar ketua

// Durasi magang dihitung otomatis dari periode mulai & selesai (tidak diisi manual).
// Hasil: "3 bulan", "2 bulan 10 hari", "6 minggu 2 hari", atau "5 hari". null bila tanggal belum lengkap / tidak valid.
function hitungDurasi(mulai, selesai) {
  if (!mulai || !selesai) return null
  const a = new Date(`${mulai}T00:00:00Z`)
  const b = new Date(`${selesai}T00:00:00Z`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b <= a) return null
  const HARI = 86400000
  const tambahBulan = (n) => {
    const akhirBulan = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + n + 1, 0)).getUTCDate() // tanggal 31 -> dipangkas ke akhir bulan
    return new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + n, Math.min(a.getUTCDate(), akhirBulan)))
  }
  let bulan = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  if (tambahBulan(bulan) > b) bulan -= 1
  const sisaHari = Math.round((b - tambahBulan(bulan)) / HARI)
  const totalHari = Math.round((b - a) / HARI)
  if (bulan >= 1) return sisaHari ? `${bulan} bulan ${sisaHari} hari` : `${bulan} bulan`
  if (totalHari >= 7) {
    const minggu = Math.floor(totalHari / 7)
    const sisa = totalHari % 7
    return sisa ? `${minggu} minggu ${sisa} hari` : `${minggu} minggu`
  }
  return `${totalHari} hari`
}

const anggotaKosong = () => ({
  nama_lengkap: '', nim: '', nik: '', semester: '', universitas: '', fakultas: '', program_studi: '', jenjang: '',
  tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', alamat: '', no_whatsapp: '', email: '',
  bidang_magang_id: '', // kosong = sama dengan bidang ketua
})

const awal = {
  nama_lengkap: '', nim: '', nik: '', semester: '', universitas: '', fakultas: '', program_studi: '',
  jenjang: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '',
  alamat: '', no_whatsapp: '', email: '',
  periode_mulai: '', periode_selesai: '',
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

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validasi sisi klien untuk satu orang (ketua atau anggota). `awalan` = 'anggota.0.' untuk anggota.
// Setiap isian yang kosong / tidak sesuai format mendapat keterangan yang tampil tepat di bawah kolomnya.
function cekOrang(d, awalan = '') {
  const e = {}
  const isi = (f) => String(d[f] ?? '').trim()
  const salah = (f, pesan) => { e[awalan + f] = [pesan] }
  const wajib = (f) => { if (!isi(f)) { salah(f, 'Wajib diisi.'); return false } return true }

  wajib('nama_lengkap')
  if (wajib('nim') && !/^[0-9]+$/.test(isi('nim'))) salah('nim', 'NIM hanya boleh berisi angka.')
  if (BACKEND_LAMA) {
    if (wajib('nik') && !/^[0-9]{16}$/.test(isi('nik'))) salah('nik', 'NIK harus 16 digit angka.')
    if (wajib('semester') && !(Number(isi('semester')) >= 1 && Number(isi('semester')) <= 14)) salah('semester', 'Semester berupa angka 1 sampai 14.')
  }
  if (!d.jenjang) {
    salah('jenjang', 'Pilih jenjang pendidikan.')
  } else {
    wajib('universitas')
    wajib('program_studi')
    if (d.jenjang !== 'SMA/SMK') wajib('fakultas')
  }
  wajib('tempat_lahir')
  if (wajib('tanggal_lahir') && isi('tanggal_lahir') >= HARI_INI) salah('tanggal_lahir', 'Tanggal lahir harus sebelum hari ini.')
  if (!d.jenis_kelamin) salah('jenis_kelamin', 'Pilih jenis kelamin.')
  wajib('alamat')
  if (wajib('no_whatsapp') && !/^[0-9]{9,15}$/.test(isi('no_whatsapp'))) salah('no_whatsapp', 'Nomor HP harus 9-15 digit angka.')
  if (wajib('email') && !FORMAT_EMAIL.test(isi('email'))) salah('email', 'Format email tidak valid.')
  return e
}

// Textarea yang tingginya mengikuti isi: tidak ada scroll di dalam kolom dan tidak bisa ditarik/diubah ukurannya.
function TextareaOtomatis({ value, className = '', ...props }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`
  }, [value])
  return <textarea ref={ref} value={value} className={`${className} resize-none overflow-hidden`} {...props} />
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-xs placeholder:text-slate-400/60 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10'

// Kartu bagian formulir memakai bahasa visual Beranda: kartu putih / biru muda selang-seling, ikon bulat, eyebrow tulisan tangan, dan satu kartu navy untuk pernyataan.
const TEMA = {
  pribadi: { root: 'border-slate-100 bg-white', head: 'border-b border-slate-100', judul: 'text-brand-900', ikon: 'bg-brand-50 text-brand-500', langkah: 'text-brand-500' },
  anggota: { root: 'border-brand-100 bg-brand-50', head: 'border-b border-brand-100', judul: 'text-brand-900', ikon: 'bg-white text-brand-500', langkah: 'text-brand-500' },
  magang: { root: 'border-slate-100 bg-white', head: 'border-b border-slate-100', judul: 'text-brand-900', ikon: 'bg-brand-50 text-brand-500', langkah: 'text-brand-500' },
  dokumen: { root: 'border-brand-100 bg-brand-50', head: 'border-b border-brand-100', judul: 'text-brand-900', ikon: 'bg-white text-brand-500', langkah: 'text-brand-500' },
  pernyataan: { root: 'border-brand-900 bg-brand-900 text-white', head: 'border-b border-white/10', judul: 'text-white', ikon: 'bg-white/15 text-white', langkah: 'text-brand-200' },
}

const NOMOR_LANGKAH = { pribadi: 1, magang: 2, anggota: 3, dokumen: 4, pernyataan: 5 }

function Section({ judul, icon, tema = 'pribadi', children }) {
  const t = TEMA[tema]
  return (
    <Reveal as="section" id={`bagian-${tema}`} variant="up" className={`relative scroll-mt-24 rounded-2xl border shadow-[0_2px_20px_rgba(0,0,0,0.06)] ${t.root}`}>
      <div className={`flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5 ${t.head}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${t.ikon}`}>
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <div>
          <p className={`-rotate-1 origin-left font-script text-xl leading-none ${t.langkah}`}>Langkah {NOMOR_LANGKAH[tema]} dari 5</p>
          <h2 className={`text-lg font-semibold sm:text-xl ${t.judul}`}>{judul}</h2>
        </div>
      </div>
      <div className="space-y-5 px-4 py-5 sm:px-8 sm:py-7">{children}</div>
    </Reveal>
  )
}

// Data satu orang (ketua atau anggota) dianggap lengkap bila semua kolom wajib terisi DAN formatnya valid
// (aturan sama persis dengan validasi saat kirim: cekOrang), sehingga centang langkah selalu sejalan dengan hasil kirim.
function orangLengkap(d) {
  return Object.keys(cekOrang(d)).length === 0
}

function lompatBagian(tema) {
  document.getElementById(`bagian-${tema}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Daftar langkah di samping form (layar lebar). Menandai bagian yang sedang dilihat.
function StepSamping({ langkah, aktif }) {
  return (
    <nav aria-label="Langkah pendaftaran" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Langkah Pendaftaran</p>
      <ol className="mt-4">
        {langkah.map((l, i) => {
          const sekarang = l.tema === aktif
          const lewat = l.selesai
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
                  <span className={`mt-0.5 block text-xs ${l.peringatan ? 'font-semibold text-red-500' : 'text-slate-400'}`}>{l.peringatan ? 'Lengkapi semua data dengan benar' : l.ket}</span>
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
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.78rem] ${l.tema === aktif ? 'bg-white/20' : l.selesai ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
                {l.selesai ? <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg> : i + 1}
              </span>
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
      <label htmlFor={htmlFor} className="mb-2 block text-[0.8125rem] font-semibold text-slate-700">
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
    `flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2 text-sm transition ${aktif ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-200'}`

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
            <Field label="Semester" htmlFor={id('semester')} error={k('semester')}>
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
          <Field label="Tanggal Lahir" htmlFor={id('tanggal_lahir')} error={k('tanggal_lahir')} hint="Bulan/tanggal/tahun">
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
          <TextareaOtomatis id={id('alamat')} placeholder="Contoh: Jl. Melati No. 5, Kel. Caturtunggal, Kec. Depok, Kab. Sleman" rows={2} className={inputCls} value={data.alamat} onChange={set('alamat')} required maxLength={500} />
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
  // Periode lama tetap diisi (durasi ikut terhitung otomatis); kalau tanggal mulai sudah lewat, form akan meminta diganti saat dikirim.
  return {
    ...awal,
    ...orangDariPrefill(p),
    periode_mulai: mulai,
    periode_selesai: selesai,
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
  const [cobaSetuju, setCobaSetuju] = useState(0) // waktu (ms) user mencoba mencentang pernyataan saat data belum lengkap; 0 = tidak ada
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
  const pernyataanRef = useRef(null)
  const [bagianAktif, setBagianAktif] = useState('pribadi')

  const ruangFooter = useRuangFooter(hasil) // ruang kosong sebesar footer di bawah form (lihat hooks/useRuangFooter.js)

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

  // Keterangan "isi data dengan benar" hilang otomatis setelah 5 detik (percobaan centang berikutnya memulai ulang hitungan).
  useEffect(() => {
    if (!cobaSetuju) return undefined
    const t = setTimeout(() => setCobaSetuju(0), 5000)
    return () => clearTimeout(t)
  }, [cobaSetuju])

  const langkahDasar = [
    { tema: 'pribadi', label: anggota.length > 0 ? 'Data Ketua' : 'Data Pribadi', ket: 'Identitas dan pendidikan' },
    { tema: 'magang', label: 'Data Magang', ket: 'Periode dan formasi' },
    { tema: 'anggota', label: 'Anggota Kelompok', ket: 'Opsional' },
    { tema: 'dokumen', label: 'Dokumen', ket: 'Unggah berkas pendukung' },
    { tema: 'pernyataan', label: 'Pernyataan', ket: 'Konfirmasi dan kirim' },
  ]
  // Centang di daftar langkah muncul hanya bila isi langkah itu sudah lengkap (bukan sekadar sudah terlewati saat scroll).
  const durasi = hitungDurasi(form.periode_mulai, form.periode_selesai)
  const selesai = {
    pribadi: orangLengkap(form),
    magang: Boolean(durasi && form.periode_mulai >= HARI_INI && (bidangIds.length || (lainnya && lainnyaTeks.trim()))),
    anggota: anggota.length > 0 && anggota.every(orangLengkap), // opsional: tanpa anggota tidak dicentang
    dokumen: DOKUMEN.filter((d) => d.wajib).every((d) => files[d.key]),
    pernyataan: false, // diisi di bawah: hanya tercentang bila disetujui DAN semua data lain sudah lengkap
  }
  const semuaLengkap = selesai.pribadi && selesai.magang && selesai.dokumen && anggota.every(orangLengkap)
  const setujuValid = setuju && semuaLengkap // centang pernyataan hanya berlaku bila semua data lengkap (otomatis lepas bila ada data dikosongkan lagi)
  selesai.pernyataan = setujuValid
  const perluLengkapi = Boolean(cobaSetuju) && !semuaLengkap // tampilkan keterangan: isi data dengan benar dulu
  const langkah = langkahDasar.map((l) => ({ ...l, selesai: selesai[l.tema], peringatan: l.tema === 'pernyataan' && perluLengkapi }))

  // Error sebuah isian hilang otomatis begitu isian itu diubah/diisi (tidak menunggu kirim ulang).
  const sebelum = useRef({ form, anggota, files, bidangIds, lainnya, lainnyaTeks })
  useEffect(() => {
    const p = sebelum.current
    const hapus = []
    Object.keys(form).forEach((k) => { if (form[k] !== p.form[k]) hapus.push(k) })
    Object.keys(files).forEach((k) => { if (files[k] !== p.files[k]) hapus.push(k) })
    if (bidangIds !== p.bidangIds || lainnya !== p.lainnya || lainnyaTeks !== p.lainnyaTeks) {
      hapus.push('bidang', 'bidang_magang_ids', 'bidang_lainnya', 'bidang_magang_id')
    }
    anggota.forEach((a, i) => {
      const pa = p.anggota[i]
      Object.keys(a).forEach((f) => { if (!pa || a[f] !== pa[f]) hapus.push(`anggota.${i}.${f}`) })
    })
    sebelum.current = { form, anggota, files, bidangIds, lainnya, lainnyaTeks }
    if (!hapus.length) return
    setErrors((x) => {
      const n = { ...x }
      let berubah = false
      hapus.forEach((k) => { if (n[k]) { delete n[k]; berubah = true } })
      return berubah ? n : x
    })
  }, [form, anggota, files, bidangIds, lainnya, lainnyaTeks])

  // Keterangan pernyataan di bawah tombol kirim hilang otomatis setelah 5 detik (klik kirim lagi memulai ulang hitungan).
  useEffect(() => {
    if (!errors.pernyataan) return undefined
    const t = setTimeout(() => setErrors((x) => (x.pernyataan ? { ...x, pernyataan: undefined } : x)), 5000)
    return () => clearTimeout(t)
  }, [errors.pernyataan])

  // Status error pernyataan dibersihkan begitu pernyataan dicentang atau seluruh data sudah lengkap.
  useEffect(() => {
    if (setujuValid || semuaLengkap) setErrors((x) => (x.pernyataan ? { ...x, pernyataan: undefined } : x))
  }, [setujuValid, semuaLengkap])

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

  const ubahAnggota = (i, f, v) => setAnggota((arr) => arr.map((a, n) => (n === i ? { ...a, [f]: v } : a)))
  const tambahAnggota = () => setAnggota((arr) => (arr.length < MAKS_ANGGOTA ? [...arr, anggotaKosong()] : arr))
  const hapusAnggota = (i) => setAnggota((arr) => arr.filter((_, n) => n !== i))
  const salinKampus = (i) =>
    setAnggota((arr) => arr.map((a, n) => (n === i
      ? { ...a, universitas: form.universitas, fakultas: form.fakultas, program_studi: form.program_studi, jenjang: form.jenjang }
      : a)))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Hanya boleh memilih satu: salah satu formasi ATAU "Lainnya"
  const pilihBidang = (id) => {
    setBidangIds([id])
    setLainnya(false)
    setLainnyaTeks('')
  }
  const pilihLainnya = () => {
    setLainnya(true)
    setBidangIds([])
  }

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
      const el = formRef.current?.querySelector('[data-error="true"]') ?? formRef.current?.querySelector('[role="alert"]')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.querySelector?.('input, textarea, select')?.focus({ preventScroll: true })
    }, 50)
  }

  const submit = async (e) => {
    e.preventDefault()
    setPesan('')

    // Validasi sisi klien (backend tetap memvalidasi ulang)
    const lokal = {}
    if (!bidangIds.length && !(lainnya && lainnyaTeks.trim())) {
      lokal.bidang = ['Pilih 1 formasi magang atau isi "Lainnya".']
    }
    if (!files.surat_pengantar) lokal.surat_pengantar = ['Surat pengantar dari universitas wajib diunggah.']
    Object.assign(lokal, cekOrang(form))
    if (!form.periode_mulai) lokal.periode_mulai = ['Wajib diisi.']
    else if (form.periode_mulai < HARI_INI) lokal.periode_mulai = ['Tanggal mulai tidak boleh sebelum hari ini.']
    if (!form.periode_selesai) lokal.periode_selesai = ['Wajib diisi.']
    if (form.periode_mulai && form.periode_selesai && !durasi) lokal.periode_selesai = ['Periode selesai harus setelah periode mulai.']
    if (!setujuValid) {
      lokal.pernyataan = ['Centang pernyataan di atas terlebih dahulu sebelum mengirim pendaftaran.']
    }
    anggota.forEach((a, i) => Object.assign(lokal, cekOrang(a, `anggota.${i}.`)))
    if (Object.keys(lokal).length) {
      setErrors(lokal)
      // Bila hanya pernyataan yang belum dicentang, keterangan muncul tepat di bawah tombol kirim: tidak perlu scroll ke atas.
      if (Object.keys(lokal).every((k) => k === 'pernyataan')) {
        setTimeout(() => pernyataanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      } else {
        scrollKeError()
      }
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
    fd.append('durasi', durasi) // otomatis dari periode
    if (form.jenjang === 'SMA/SMK') fd.set('fakultas', '-') // tidak dipakai untuk sekolah
    bidangIds.forEach((id) => fd.append('bidang_magang_ids[]', id))
    if (lainnya && lainnyaTeks.trim()) fd.append('bidang_lainnya', lainnyaTeks.trim())
    DOKUMEN.forEach(({ key }) => { if (files[key]) fd.append(key, files[key]) })
    fd.append('pernyataan', '1')
    if (BACKEND_LAMA) {
      fd.append('program_magang_id', programId)
      if (bidangIds.length) fd.append('bidang_magang_id', bidangIds[0])
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
      <>
        <PageHero eyebrow="Terima kasih" title={<>Pendaftaran <span className="text-brand-500">Berhasil</span> Dikirim</>}>
          Data Anda sedang menunggu verifikasi oleh BKPSDM Kota Yogyakarta.
        </PageHero>

      <SlideStack>
        <Slide first lift="-mt-24 md:-mt-30" className="bg-white pt-14 pb-28 md:pt-16 md:pb-36">
          <Container max="max-w-xl">
            <Sticker kind="heart" rotate={9} className="-top-12 right-4" />
            <Reveal className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-brand-500" />
              <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
                <p className="-rotate-1 font-script text-2xl text-brand-500">Nomor Pendaftaran</p>
                <p className="mt-1 text-2xl font-semibold tracking-wider text-brand-900 sm:text-3xl">{hasil.nomor_pendaftaran}</p>
                <p className="mt-2 text-sm text-slate-500">Simpan nomor ini untuk mengecek status pendaftaran.</p>
              </div>
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                {pdfGagal
                  ? 'PDF bukti pendaftaran gagal dibuat otomatis. Silakan unduh manual dengan tombol di bawah.'
                  : 'Bukti pendaftaran (PDF) berisi token Anda otomatis terunduh. Jika belum, unduh dengan tombol di bawah.'}
              </p>
              <button
                type="button"
                onClick={() => { setPdfGagal(false); unduhBuktiPendaftaran(hasil, { jumlahAnggota }).catch(() => setPdfGagal(true)) }}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-brand-900 px-6 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white"
              >
                <Icon name="fileText" className="h-4 w-4" /> Unduh Bukti Pendaftaran (PDF)
              </button>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={`/cek-status?nomor=${hasil.nomor_pendaftaran}`} className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3 text-base font-semibold text-white transition hover:bg-brand-600">
                  Cek Status <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 px-7 py-3 text-base font-semibold text-brand-900 transition hover:border-brand-900">
                  Kembali ke Beranda
                </Link>
              </div>
            </Reveal>
          </Container>
        </Slide>

        {/* FOOTER (map terakhir) */}
        <Slide overlap="-mt-6 md:-mt-8" edge="border-brand-500" className="bg-brand-900 text-slate-300">
          <FooterBody />
        </Slide>
      </SlideStack>
      </>
    )
  }

  // ---------- Formulir ----------
  return (
    <>
      <PageHero eyebrow="Mulai dari Sini" title={<>Formulir <span className="text-brand-500">Pendaftaran</span> Magang</>}>
        Isi formulir ini dengan data yang sebenar-benarnya. Data Anda akan digunakan hanya untuk keperluan administrasi magang dan dijamin kerahasiaannya.
      </PageHero>

      <SlideStack>
        <Slide first lift="-mt-24 md:-mt-30" className="bg-white pt-14 pb-[var(--pb,9rem)] md:pt-16"
          style={ruangFooter}>
          {/* Lebar & tepi sama persis dengan pil navbar: pembungkus px-4 > mx-auto max-w-6xl */}
          <div className="relative z-10 px-4">
          <div className="relative mx-auto max-w-6xl">
            <Sticker kind="sparkle" rotate={12} className="-top-12 right-4" />
            <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-8">
              <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
                <StepSamping langkah={langkah} aktif={bagianAktif} />
                <Link to="/info-kuota"
                  className="group block rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition hover:border-brand-500">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-500"><Icon name="target" className="h-5 w-5" /></span>
                  <p className="mt-3 text-sm font-semibold text-brand-900">Cek kuota formasi</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Lihat formasi mana yang masih tersedia sebelum mengisi.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:gap-2">Buka info kuota <Icon name="arrowRight" className="h-3.5 w-3.5" /></span>
                </Link>
              </aside>

              <div className="min-w-0">
                <StepMobile langkah={langkah} aktif={bagianAktif} />
            <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
              {prefill && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
                  <p className="font-bold">Perbaiki pendaftaran {prefill.nomor_pendaftaran}</p>
                  <p className="mt-0.5 text-xs text-amber-800/80">
                    Data lama sudah terisi otomatis. Sesuaikan dengan catatan di bawah, unggah ulang dokumen, lalu kirim.
                  </p>
                  {prefill.catatan && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-3 text-red-800">
                      <p className="text-[0.86rem] font-semibold tracking-wide uppercase opacity-70">Catatan dari BKPSDM</p>
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

              {/* Pesan umum (koneksi gagal, terlalu banyak percobaan, dll). Error per isian tampil di bawah kolomnya masing-masing. */}
              {pesan && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{pesan}</div>
              )}

              {/* DATA PRIBADI */}
              <Section judul={anggota.length > 0 ? 'Data Ketua Kelompok' : 'Data Pribadi'} icon="user" tema="pribadi">
                <Field label="Nama Lengkap" htmlFor="nama_lengkap" error={err('nama_lengkap')}>
                  <input id="nama_lengkap" placeholder="Contoh: Amanda Zahra" className={inputCls} value={form.nama_lengkap} onChange={set('nama_lengkap')} required maxLength={150} />
                </Field>
                <Field label="NIM" htmlFor="nim" error={err('nim')} hint="Hanya angka">
                  <input id="nim" placeholder="Contoh: 21051234" inputMode="numeric" pattern="[0-9]+" title="NIM hanya boleh berisi angka" className={inputCls} value={form.nim} onChange={(e) => setForm((f) => ({ ...f, nim: e.target.value.replace(/\D/g, '') }))} required maxLength={30} />
                </Field>
                {BACKEND_LAMA && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="NIK" htmlFor="nik" error={err('nik')} hint="16 digit angka sesuai KTP">
                      <input id="nik" placeholder="Contoh: 3404012345670001" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} className={inputCls} value={form.nik} onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value.replace(/\D/g, '') }))} required title="NIK terdiri dari 16 digit angka" />
                    </Field>
                    <Field label="Semester" htmlFor="semester" error={err('semester')}>
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
                  <Field label="Tanggal Lahir" htmlFor="tanggal_lahir" error={err('tanggal_lahir')} hint="Bulan/tanggal/tahun">
                    <input id="tanggal_lahir" type="date" className={inputCls} value={form.tanggal_lahir} onChange={set('tanggal_lahir')} required max={HARI_INI} />
                  </Field>
                </div>

                <Field label="Jenis Kelamin" anchor="jenis_kelamin" error={err('jenis_kelamin')}>
                  <div className="flex gap-3">
                    {[['L', 'Laki-laki'], ['P', 'Perempuan']].map(([v, l]) => (
                      <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2 text-sm transition ${form.jenis_kelamin === v ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-200'}`}>
                        <input type="radio" name="jenis_kelamin" value={v} checked={form.jenis_kelamin === v} onChange={set('jenis_kelamin')} className="accent-brand-500" />
                        {l}
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Alamat Domisili" htmlFor="alamat" error={err('alamat')}>
                  <TextareaOtomatis id="alamat" placeholder="Contoh: Jl. Kenanga No. 12, Kel. Umbulharjo, Kec. Umbulharjo, Kota Yogyakarta" rows={3} className={inputCls} value={form.alamat} onChange={set('alamat')} required maxLength={500} />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nomor HP (aktif & WhatsApp)" htmlFor="no_whatsapp" error={err('no_whatsapp')}>
                    <input id="no_whatsapp" type="tel" inputMode="numeric" pattern="[0-9]{9,15}" maxLength={15} title="Nomor HP hanya boleh berisi angka (9-15 digit)" className={inputCls} value={form.no_whatsapp} onChange={(e) => setForm((f) => ({ ...f, no_whatsapp: e.target.value.replace(/\D/g, '') }))} required placeholder="Contoh: 081234567890" />
                  </Field>
                  <Field label="Email" htmlFor="email" error={err('email')}>
                    <input id="email" placeholder="Contoh: amanda.zahra@email.com" type="email" className={inputCls} value={form.email} onChange={set('email')} required maxLength={150} />
                  </Field>
                </div>
              </Section>

              {/* B. DATA MAGANG */}
              <Section judul="Data Magang" icon="briefcase" tema="magang">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Periode Magang: Mulai" htmlFor="periode_mulai" error={err('periode_mulai')} hint="Bulan/tanggal/tahun">
                    <input id="periode_mulai" type="date" className={inputCls} value={form.periode_mulai} onChange={set('periode_mulai')} required min={HARI_INI} />
                  </Field>
                  <Field label="Periode Magang: Selesai" htmlFor="periode_selesai" error={err('periode_selesai')} hint="Bulan/tanggal/tahun">
                    <input id="periode_selesai" type="date" className={inputCls} value={form.periode_selesai} onChange={set('periode_selesai')} required min={form.periode_mulai || undefined} />
                  </Field>
                </div>

                <Field label="Durasi Magang" anchor="durasi" required={false}
                  hint="Dihitung otomatis dari periode mulai dan selesai.">
                  <div id="durasi" aria-live="polite"
                    className={`flex min-h-[2.75rem] items-center rounded-xl border px-4 py-3 text-sm ${durasi ? 'border-brand-100 bg-brand-50 font-semibold text-brand-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                    {durasi ?? 'Isi periode mulai dan selesai terlebih dahulu'}
                  </div>
                </Field>

                <Field label="Minat Formasi Magang" anchor="bidang" error={err('bidang')} hint="Pilih salah satu.">
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
                          <input type="radio" name="minat_formasi" checked={aktif} disabled={terkunci} onChange={() => pilihBidang(f.id)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500 disabled:cursor-not-allowed" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`font-medium ${terkunci ? 'text-slate-400' : 'text-slate-700'}`}>{f.nama_bidang}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.78rem] font-semibold ${s.badge}`}>{s.label}</span>
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
                      <input type="radio" name="minat_formasi" checked={lainnya} onChange={pilihLainnya} className="h-4 w-4 shrink-0 accent-brand-500" />
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
                    <input type="checkbox" checked={setujuValid}
                      onChange={(e) => {
                        if (e.target.checked && !semuaLengkap) { setCobaSetuju(Date.now()); return } // data belum lengkap: tidak bisa dicentang
                        setCobaSetuju(0)
                        setSetuju(e.target.checked)
                        if (e.target.checked) setErrors((x) => ({ ...x, pernyataan: undefined }))
                      }}
                      className="mt-0.5 h-4 w-4 accent-brand-500" />
                    <span>“Saya menyatakan data yang saya isi benar dan bersedia mengikuti aturan yang berlaku.”</span>
                  </label>
                  {perluLengkapi && (
                    <p role="status" className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-100">
                      Masih ada data yang kosong atau belum lengkap. Isi semua data dengan benar.
                    </p>
                  )}
                </div>
              </Section>

              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] sm:p-6">
              <div className="flex flex-col gap-4 max-sm:text-center sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Siap mengirim pendaftaran?</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    Setelah terkirim, Anda mendapat nomor pendaftaran dan bukti pendaftaran (PDF).
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={kirim}
                  className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {kirim ? 'Mengirim…' : (<>Kirim Pendaftaran <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></>)}
                </button>
              </div>
              {semuaLengkap && !setujuValid && errors.pernyataan?.length > 0 && (
                <p ref={pernyataanRef} role="status" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {errors.pernyataan[0]}
                </p>
              )}
              </div>
            </form>
              </div>
            </div>
          </div>
          </div>
        </Slide>

        {/* FOOTER (map terakhir) */}
        <Slide id="footer-slide" overlap="-mt-6 md:-mt-8" edge="border-brand-500" className="bg-brand-900 text-slate-300">
          <FooterBody />
        </Slide>
      </SlideStack>
    </>
  )
}