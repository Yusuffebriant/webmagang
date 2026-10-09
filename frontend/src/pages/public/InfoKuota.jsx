import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon from '../../components/Icon'
import { statusKuota } from '../../utils/kuota'

// Kelompok status, urut dari yang paling berguna bagi pendaftar
const KELOMPOK = [
  { id: 'tersedia', judul: 'Tersedia', ket: 'Masih terbuka untuk dipilih', titik: 'bg-emerald-500', kode: ['tersedia'] },
  { id: 'hampir', judul: 'Hampir penuh', ket: 'Sisa kuota tinggal 1-2 orang', titik: 'bg-amber-500', kode: ['hampir'] },
  { id: 'penuh', judul: 'Penuh / Ditutup', ket: 'Belum bisa dipilih', titik: 'bg-red-500', kode: ['penuh', 'tutup'] },
  { id: 'belum', judul: 'Kuota belum ditetapkan', ket: 'Menunggu penetapan dari BKPSDM', titik: 'bg-slate-400', kode: ['belum'] },
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
  const st = statusKuota(f)
  const diatur = f.kuota !== null && f.kuota > 0
  const habis = st.kode === 'penuh' || st.kode === 'tutup'

  return (
    <article className={`flex flex-col rounded-xl border p-4 shadow-sm transition ${habis ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-sm leading-snug font-bold ${habis ? 'text-slate-500' : 'text-brand-900'}`}>{f.nama_bidang}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.badge}`}>{st.label}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
        {f.deskripsi || 'Belum ada deskripsi untuk formasi ini.'}
      </p>
      <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
        {diatur ? (
          <>
            <div>
              <p className={`text-2xl leading-none font-extrabold tabular-nums ${st.kode === 'hampir' ? 'text-amber-600' : habis ? 'text-slate-400' : 'text-brand-900'}`}>{f.sisa_kuota}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">kuota tersisa</p>
            </div>
            <p className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 tabular-nums">{f.terisi}</span> terisi dari{' '}
              <span className="font-semibold text-slate-700 tabular-nums">{f.kuota}</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-500">{f.kuota === 0 ? 'Formasi sedang ditutup.' : 'Kuota belum ditetapkan.'}</p>
        )}
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

  const kelompok = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    const cocok = formasi.filter((f) => !kata || f.nama_bidang.toLowerCase().includes(kata))
    return KELOMPOK.map((k) => ({ ...k, isi: cocok.filter((f) => k.kode.includes(statusKuota(f).kode)) })).filter((k) => k.isi.length > 0)
  }, [formasi, cari])
  const jumlahTampil = kelompok.reduce((n, k) => n + k.isi.length, 0)

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

        {/* Pencarian */}
        <div className={`${!memuat && !gagal && formasi.length > 0 ? 'mt-4' : 'mt-2'} flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between`}>
          <input type="search" value={cari} onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama formasi…" aria-label="Cari formasi"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none sm:max-w-sm" />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {KELOMPOK.slice(0, 3).map((k) => (
              <li key={k.id} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${k.titik}`} />
                {k.judul}: <span className="font-semibold text-slate-800 tabular-nums">{formasi.filter((f) => k.kode.includes(statusKuota(f).kode)).length}</span>
              </li>
            ))}
          </ul>
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
            jumlahTampil === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Tidak ada formasi yang cocok dengan pencarian Anda.
              </div>
            ) : (
              <div className="space-y-7">
                {kelompok.map((k) => (
                  <section key={k.id} aria-labelledby={`kel-${k.id}`}>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${k.titik}`} />
                      <h2 id={`kel-${k.id}`} className="text-sm font-bold text-brand-900">{k.judul}</h2>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">{k.isi.length}</span>
                      <span className="hidden text-xs text-slate-400 sm:inline">{k.ket}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {k.isi.map((f) => <KartuFormasi key={f.id} f={f} />)}
                    </div>
                  </section>
                ))}
              </div>
            )
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