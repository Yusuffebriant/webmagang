import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon from '../../components/Icon'

// Status tiap formasi (selaras dengan halaman Kuota di admin).
// Hampir penuh = sudah ada yang terisi dan sisa kuota tinggal 1-2 orang.
function statusKuota(f) {
  if (f.kuota === null) return { kode: 'belum', label: 'Belum diatur', badge: 'bg-slate-100 text-slate-600', sisa: 'text-slate-400', titik: 'bg-slate-400' }
  if (f.kuota === 0) return { kode: 'tutup', label: 'Ditutup', badge: 'bg-slate-100 text-slate-600', sisa: 'text-slate-400', titik: 'bg-slate-400' }
  if (f.sisa_kuota === 0) return { kode: 'penuh', label: 'Penuh', badge: 'bg-red-50 text-red-700', sisa: 'text-red-600', titik: 'bg-red-500' }
  if (f.terisi > 0 && f.sisa_kuota <= 2) return { kode: 'hampir', label: 'Hampir penuh', badge: 'bg-amber-50 text-amber-700', sisa: 'text-amber-600', titik: 'bg-amber-500' }
  return { kode: 'tersedia', label: 'Tersedia', badge: 'bg-emerald-50 text-emerald-700', sisa: 'text-emerald-600', titik: 'bg-emerald-500' }
}

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

const diatur = (f) => f.kuota !== null && f.kuota > 0

function Statistik({ judul, nilai, catatan, icon, gelap = false }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${gelap ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-500'}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{judul}</p>
        <p className={`text-2xl leading-tight font-extrabold tabular-nums ${gelap ? 'text-brand-600' : 'text-brand-900'}`}>{nilai}</p>
        {catatan && <p className="text-[11px] text-slate-400">{catatan}</p>}
      </div>
    </div>
  )
}

function Lencana({ s }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.titik}`} />
      {s.label}
    </span>
  )
}

// Tampilan tabel (layar sedang ke atas)
function Tabel({ data }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-3">Formasi</th>
            <th scope="col" className="w-24 px-3 py-3 text-center">Kuota</th>
            <th scope="col" className="w-24 px-3 py-3 text-center">Terisi</th>
            <th scope="col" className="w-28 px-3 py-3 text-center">Sisa</th>
            <th scope="col" className="w-44 px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((f) => {
            const s = statusKuota(f)
            const ada = diatur(f)
            return (
              <tr key={f.id} className={`transition hover:bg-brand-50/50 ${s.kode === 'penuh' || s.kode === 'tutup' ? 'bg-slate-50/60' : ''}`}>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-brand-900">{f.nama_bidang}</p>
                  {f.deskripsi && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{f.deskripsi}</p>}
                </td>
                <td className="px-3 py-3.5 text-center text-slate-700 tabular-nums">{ada ? f.kuota : '—'}</td>
                <td className="px-3 py-3.5 text-center text-slate-700 tabular-nums">{ada ? f.terisi : '—'}</td>
                <td className={`px-3 py-3.5 text-center text-lg font-extrabold tabular-nums ${s.sisa}`}>{ada ? f.sisa_kuota : '—'}</td>
                <td className="px-5 py-3.5"><Lencana s={s} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Tampilan kartu ringkas (HP)
function KartuRingkas({ f }) {
  const s = statusKuota(f)
  const ada = diatur(f)
  return (
    <article className={`rounded-xl border border-slate-200 p-4 shadow-sm ${s.kode === 'penuh' || s.kode === 'tutup' ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm leading-snug font-bold text-brand-900">{f.nama_bidang}</h3>
        <Lencana s={s} />
      </div>
      {f.deskripsi && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{f.deskripsi}</p>}
      {ada ? (
        <dl className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-slate-50 py-2 text-center">
          <div><dt className="text-[10px] text-slate-500 uppercase">Kuota</dt><dd className="text-base font-bold text-slate-700 tabular-nums">{f.kuota}</dd></div>
          <div><dt className="text-[10px] text-slate-500 uppercase">Terisi</dt><dd className="text-base font-bold text-slate-700 tabular-nums">{f.terisi}</dd></div>
          <div><dt className="text-[10px] text-slate-500 uppercase">Sisa</dt><dd className={`text-base font-extrabold tabular-nums ${s.sisa}`}>{f.sisa_kuota}</dd></div>
        </dl>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {f.kuota === 0 ? 'Formasi sedang ditutup.' : 'Kuota belum ditetapkan.'}
        </p>
      )}
    </article>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />)}
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
    const ada = formasi.filter((f) => f.kuota !== null)
    return {
      formasi: formasi.length,
      kuota: ada.reduce((n, f) => n + f.kuota, 0),
      terisi: ada.reduce((n, f) => n + f.terisi, 0),
      sisa: ada.reduce((n, f) => n + (f.sisa_kuota ?? 0), 0),
    }
  }, [formasi])

  const jumlah = useMemo(
    () => Object.fromEntries(FILTER.map((x) => [x.id, formasi.filter((f) => x.cocok(statusKuota(f))).length])),
    [formasi],
  )

  const tampil = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    const aturan = FILTER.find((x) => x.id === filter) ?? FILTER[0]
    return formasi.filter((f) => aturan.cocok(statusKuota(f)) && (!kata || f.nama_bidang.toLowerCase().includes(kata)))
  }, [formasi, cari, filter])

  const adaData = !memuat && !gagal && formasi.length > 0

  return (
    <div className="relative overflow-hidden bg-slate-50 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 px-6 pt-8 pb-16 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={POLA_TITIK} />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full border-[48px] border-white/5" />
        <h1 className="relative text-2xl font-extrabold text-white sm:text-3xl">Info Kuota Formasi Magang</h1>
        <p className="relative mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-200">
          Cek ketersediaan kuota tiap formasi sebelum mendaftar.
        </p>
      </div>

      <div className="relative mx-auto -mt-8 max-w-5xl px-4 sm:px-6">
        {/* Ringkasan: satu kartu, empat kolom */}
        {adaData && (
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-4 lg:divide-y-0">
            <Statistik judul="Total Formasi" nilai={total.formasi} icon="briefcase" />
            <Statistik judul="Total Kuota" nilai={total.kuota} catatan="formasi yang sudah diatur" icon="users" />
            <Statistik judul="Sudah Terisi" nilai={total.terisi} catatan="peserta diterima" icon="shieldCheck" />
            <Statistik judul="Kuota Tersisa" nilai={total.sisa} icon="target" gelap />
          </div>
        )}

        {/* Pencarian & filter */}
        <div className={`${adaData ? 'mt-4' : 'mt-2'} space-y-3`}>
          <input type="search" value={cari} onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama formasi…" aria-label="Cari formasi"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status kuota">
            {FILTER.map((x) => (
              <button key={x.id} type="button" onClick={() => setFilter(x.id)} aria-pressed={filter === x.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${filter === x.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600'}`}>
                {x.label}
                {adaData && (
                  <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${filter === x.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{jumlah[x.id]}</span>
                )}
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

          {adaData && (
            <>
              <p className="mb-2 text-xs text-slate-500">Menampilkan {tampil.length} dari {formasi.length} formasi</p>
              {tampil.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                  Tidak ada formasi yang cocok dengan pencarian atau filter Anda.
                </div>
              ) : (
                <>
                  <Tabel data={tampil} />
                  <div className="grid gap-3 sm:grid-cols-2 md:hidden">
                    {tampil.map((f) => <KartuRingkas key={f.id} f={f} />)}
                  </div>
                </>
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