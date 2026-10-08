import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon from '../../components/Icon'
import { Eyebrow, PageHero, Reveal, Sheet, Sticker } from '../../components/Motif'

// Penanda status tiap formasi (selaras dengan halaman Kuota di admin)
function statusKuota(f) {
  if (f.kuota === null) return { kode: 'belum', label: 'Belum diatur', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300', aksen: 'bg-slate-300' }
  if (f.kuota === 0) return { kode: 'tutup', label: 'Ditutup', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300', aksen: 'bg-slate-300' }
  if (f.sisa_kuota === 0) return { kode: 'penuh', label: 'Penuh', badge: 'bg-red-50 text-red-700', bar: 'bg-red-500', aksen: 'bg-red-500' }
  if (f.sisa_kuota / f.kuota <= 0.2) return { kode: 'hampir', label: 'Hampir penuh', badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500', aksen: 'bg-amber-500' }
  return { kode: 'tersedia', label: 'Tersedia', badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', aksen: 'bg-emerald-500' }
}

const FILTER = [
  { id: 'semua', label: 'Semua', cocok: () => true },
  { id: 'tersedia', label: 'Tersedia', cocok: (s) => s.kode === 'tersedia' },
  { id: 'hampir', label: 'Hampir penuh', cocok: (s) => s.kode === 'hampir' },
  { id: 'penuh', label: 'Penuh / Ditutup', cocok: (s) => s.kode === 'penuh' || s.kode === 'tutup' },
]

const BAYANGAN = 'shadow-[0_2px_20px_rgba(0,0,0,0.06)]'

function Ringkasan({ judul, nilai, catatan, icon, gelap = false }) {
  return (
    <div className={`group flex items-center gap-3 rounded-xl px-4 py-4 sm:gap-4 sm:px-5 ${BAYANGAN} ${gelap ? 'bg-brand-900 text-white' : 'border border-slate-100 bg-white'}`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${gelap ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-500'}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold tracking-wide uppercase ${gelap ? 'text-slate-300' : 'text-slate-500'}`}>{judul}</p>
        <p className={`text-3xl leading-tight font-semibold tabular-nums ${gelap ? '' : 'text-brand-900'}`}>{nilai}</p>
        {catatan && <p className={`text-xs ${gelap ? 'text-slate-300' : 'text-slate-500'}`}>{catatan}</p>}
      </div>
    </div>
  )
}

function KartuFormasi({ f }) {
  const s = statusKuota(f)
  const diatur = f.kuota !== null && f.kuota > 0
  const persen = diatur ? Math.min(100, Math.round((f.terisi / f.kuota) * 100)) : 0

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white transition duration-300 hover:-translate-y-1 ${BAYANGAN}`}>
      <div className={`h-1.5 ${s.aksen}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
            <Icon name="briefcase" className="h-5 w-5" />
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.badge}`}>{s.label}</span>
        </div>

        <h3 className="mt-4 text-base leading-snug font-semibold text-brand-900">{f.nama_bidang}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-slate-500">
          {f.deskripsi || 'Belum ada deskripsi untuk formasi ini.'}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-4">
          {diatur ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl leading-none font-semibold text-brand-900 tabular-nums">{f.sisa_kuota}</p>
                  <p className="mt-1 text-xs text-slate-500">kuota tersisa</p>
                </div>
                <p className="text-right text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 tabular-nums">{f.terisi}</span> terisi dari{' '}
                  <span className="font-semibold text-slate-700 tabular-nums">{f.kuota}</span>
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar" aria-valuemin={0} aria-valuemax={f.kuota} aria-valuenow={f.terisi}
                aria-label={`Kuota terisi ${f.terisi} dari ${f.kuota}`}>
                <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${persen}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-brand-50" />)}
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

  const adaData = !memuat && !gagal && formasi.length > 0

  return (
    <>
      <PageHero eyebrow="Sebelum Mendaftar" title={<>Info <span className="text-brand-500">Kuota Formasi</span> Magang</>}>
        Cek ketersediaan kuota tiap formasi sebelum mendaftar.
      </PageHero>

      {/* KETERSEDIAAN FORMASI */}
      <Sheet first>
        <Sticker kind="sparkle" rotate={12} className="-top-4 right-4" />
        <Reveal>
          <Eyebrow>Ketersediaan Formasi</Eyebrow>
          <h2 className="text-3xl font-semibold text-brand-900">Pilih Formasi yang Sesuai</h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            Lihat sisa kuota tiap formasi, lalu pilih yang paling cocok dengan minat dan bidang studi Anda.
          </p>
        </Reveal>

        {adaData && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal variant="up" delay={0}><Ringkasan judul="Total Formasi" nilai={total.formasi} icon="briefcase" /></Reveal>
            <Reveal variant="up" delay={100}><Ringkasan judul="Total Kuota" nilai={total.kuota} catatan="dari formasi yang sudah diatur" icon="users" /></Reveal>
            <Reveal variant="up" delay={200}><Ringkasan judul="Sudah Terisi" nilai={total.terisi} catatan="pendaftar diterima" icon="shieldCheck" /></Reveal>
            <Reveal variant="up" delay={300}><Ringkasan judul="Kuota Tersisa" nilai={total.sisa} icon="target" gelap /></Reveal>
          </div>
        )}

        {/* Pencarian & filter */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" value={cari} onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama formasi…" aria-label="Cari formasi"
              className="w-full rounded-full border border-slate-200 bg-white py-3 pr-5 pl-11 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status kuota">
            {FILTER.map((x) => (
              <button key={x.id} type="button" onClick={() => setFilter(x.id)} aria-pressed={filter === x.id}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === x.id ? 'border-brand-900 bg-brand-900 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-900 hover:text-brand-900'}`}>
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar formasi */}
        <div className="mt-6" aria-live="polite">
          {memuat && <Skeleton />}

          {gagal && !memuat && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
              <p className="text-sm text-amber-800">Data kuota belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>
              <button type="button" onClick={muat}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-5 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
                <Icon name="refresh" className="h-4 w-4" /> Coba lagi
              </button>
            </div>
          )}

          {!memuat && !gagal && formasi.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-brand-50 px-6 py-12 text-center text-sm text-slate-600">
              Belum ada formasi magang yang dibuka.
            </div>
          )}

          {adaData && (
            <>
              <p className="mb-4 text-sm text-slate-500">Menampilkan {tampil.length} dari {formasi.length} formasi</p>
              {tampil.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-brand-50 px-6 py-12 text-center text-sm text-slate-600">
                  Tidak ada formasi yang cocok dengan pencarian atau filter Anda.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {tampil.map((f, i) => (
                    <Reveal key={f.id} delay={(i % 3) * 90} tilt={i % 2 ? 2 : -2} className="h-full">
                      <KartuFormasi f={f} />
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Kuota terisi dihitung dari pendaftar yang sudah berstatus <span className="font-semibold">diterima</span>. Angka dapat berubah
          sewaktu-waktu mengikuti hasil verifikasi.
        </p>
      </Sheet>

      {/* AJAKAN DAFTAR */}
      <Sheet tone="blue">
        <Sticker kind="bolt" rotate={-10} className="-top-4 right-6" />
        <Reveal className="flex flex-col items-start gap-5 rounded-2xl bg-brand-900 px-8 py-8 sm:flex-row sm:items-center">
          <span className="float-y flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
            <Icon name="cap" className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">Sudah Menemukan Formasi yang Cocok?</h2>
            <p className="mt-1 text-base text-slate-300">
              Isi formulir pendaftaran dan dapatkan nomor pendaftaran Anda.
            </p>
          </div>
          <Link to="/pendaftaran"
            className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-600">
            <Icon name="userPlus" className="h-4 w-4" /> Daftar Magang <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </Sheet>
    </>
  )
}