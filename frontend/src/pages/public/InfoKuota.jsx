import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon from '../../components/Icon'
import { statusKuota } from '../../utils/kuota'

const FILTER = [
  { id: 'semua', label: 'Semua', cocok: () => true },
  { id: 'tersedia', label: 'Tersedia', cocok: (s) => s.kode === 'tersedia' },
  { id: 'hampir', label: 'Hampir penuh', cocok: (s) => s.kode === 'hampir' },
  { id: 'penuh', label: 'Penuh / Ditutup', cocok: (s) => s.kode === 'penuh' || s.kode === 'tutup' },
]

const POLA_TITIK = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1.2px, transparent 1.2px)',
  backgroundSize: '22px 22px',
  maskImage: 'linear-gradient(to bottom, #000, transparent 85%)',
  WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 85%)',
}

function Ringkasan({ judul, nilai, catatan, icon, gelap = false }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-3 py-3 shadow-sm sm:gap-3 sm:px-4 ${gelap ? 'bg-brand-900 text-white' : 'border border-slate-200 bg-white'}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${gelap ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-500'}`}>
        <Icon name={icon} className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold tracking-wide uppercase ${gelap ? 'text-slate-300' : 'text-slate-500'}`}>{judul}</p>
        <p className={`text-xl leading-tight font-extrabold tabular-nums ${gelap ? '' : 'text-brand-900'}`}>{nilai}</p>
        {catatan && <p className={`text-[11px] ${gelap ? 'text-slate-300' : 'text-slate-400'}`}>{catatan}</p>}
      </div>
    </div>
  )
}

function KartuFormasi({ f }) {
  const s = statusKuota(f)
  const diatur = f.kuota !== null && f.kuota > 0

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
            <Icon name="briefcase" className="h-4 w-4" />
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.badge}`}>{s.label}</span>
        </div>

        <h3 className="mt-3 text-sm leading-snug font-bold text-brand-900">{f.nama_bidang}</h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
          {f.deskripsi || 'Belum ada deskripsi untuk formasi ini.'}
        </p>

        <div className="mt-3 border-t border-slate-100 pt-3">
          {diatur ? (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl leading-none font-extrabold text-brand-900 tabular-nums">{f.sisa_kuota}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">kuota tersisa</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 tabular-nums">{f.terisi}</span> terisi dari{' '}
                  <span className="font-semibold text-slate-700 tabular-nums">{f.kuota}</span>
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              {f.kuota === 0 ? 'Formasi sedang ditutup.' : 'Kuota belum ditetapkan.'}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200" />)}
    </div>
  )
}

export default function InfoKuota() {
  const [formasi, setFormasi] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)
  const [cari, setCari] = useState('')
  const [filter, setFilter] = useState('semua')

  const muat = () => {
    setMemuat(true)
    setGagal(false)
    return api.get('/public/bidang')
      .then((r) => setFormasi(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muat() }, [])

  const total = useMemo(() => {
    const diatur = formasi.filter((f) => f.kuota !== null)
    return {
      formasi: formasi.length,
      kuota: diatur.reduce((n, f) => n + f.kuota, 0),
      terisi: diatur.reduce((n, f) => n + f.terisi, 0),
      sisa: diatur.reduce((n, f) => n + (f.sisa_kuota ?? 0), 0),
    }
  }, [formasi])

  const tampil = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    const aturan = FILTER.find((x) => x.id === filter) ?? FILTER[0]
    return formasi.filter((f) => aturan.cocok(statusKuota(f)) && (!kata || f.nama_bidang.toLowerCase().includes(kata)))
  }, [formasi, cari, filter])

  return (
    <div className="relative overflow-hidden bg-slate-50 pb-10">
      <div aria-hidden="true" className="pointer-events-none absolute top-[30rem] -left-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-[60rem] -right-32 h-96 w-96 rounded-full bg-brand-100/80 blur-3xl" />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 px-6 pt-8 pb-20 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={POLA_TITIK} />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full border-[48px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <h1 className="relative text-2xl font-extrabold text-white sm:text-3xl">Info Kuota Formasi Magang</h1>
        <p className="relative mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-200">
          Cek ketersediaan kuota tiap formasi sebelum mendaftar.
        </p>
      </div>

      <div className="relative mx-auto -mt-10 max-w-7xl px-4 sm:px-6">
        {/* Ringkasan */}
        {!memuat && !gagal && formasi.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Ringkasan judul="Total Formasi" nilai={total.formasi} icon="briefcase" />
            <Ringkasan judul="Total Kuota" nilai={total.kuota} catatan="dari formasi yang sudah diatur" icon="users" />
            <Ringkasan judul="Sudah Terisi" nilai={total.terisi} catatan="peserta diterima" icon="shieldCheck" />
            <Ringkasan judul="Kuota Tersisa" nilai={total.sisa} icon="target" gelap />
          </div>
        )}

        {/* Pencarian & filter */}
        <div className={`${!memuat && !gagal && formasi.length > 0 ? 'mt-4' : 'mt-2'} flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between`}>
          <input type="search" value={cari} onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama formasi…" aria-label="Cari formasi"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none lg:max-w-sm" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status kuota">
            {FILTER.map((x) => (
              <button key={x.id} type="button" onClick={() => setFilter(x.id)} aria-pressed={filter === x.id}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === x.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600'}`}>
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar formasi */}
        <div className="mt-4" aria-live="polite">
          {memuat && <Skeleton />}

          {gagal && !memuat && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
              <p className="text-sm text-amber-800">Data kuota belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>
              <button type="button" onClick={muat}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
                <Icon name="refresh" className="h-4 w-4" /> Coba lagi
              </button>
            </div>
          )}

          {!memuat && !gagal && formasi.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Belum ada formasi magang yang dibuka.
            </div>
          )}

          {!memuat && !gagal && formasi.length > 0 && (
            <>
              <p className="mb-3 text-xs text-slate-500">Menampilkan {tampil.length} dari {formasi.length} formasi</p>
              {tampil.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                  Tidak ada formasi yang cocok dengan pencarian atau filter Anda.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tampil.map((f) => <KartuFormasi key={f.id} f={f} />)}
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Kuota terisi dihitung per orang (ketua dan anggota kelompok) dari pendaftaran yang sudah berstatus <span className="font-semibold">diterima</span>.
          Angka dapat berubah sewaktu-waktu mengikuti hasil verifikasi.
        </p>

        {/* Ajakan daftar */}
        <div className="relative mt-6 overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 px-5 py-4 text-center sm:px-6 sm:text-left">
          <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Sudah menemukan formasi yang cocok?</h2>
              <p className="text-xs text-slate-200">Isi formulir pendaftaran dan dapatkan nomor pendaftaran Anda.</p>
            </div>
            <Link to="/pendaftaran"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
              Daftar Magang <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}