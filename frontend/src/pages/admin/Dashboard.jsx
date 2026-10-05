import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdmin } from '../../api/auth'
import { getDashboard, unduhPendaftar } from '../../api/admin'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import { STATUS } from '../../lib/status'

// Urutan field jumlah di respons backend -> status
const KARTU = [
  ['menunggu', 'menunggu_verifikasi'],
  ['diverifikasi', 'diverifikasi'],
  ['diterima', 'diterima'],
  ['ditolak', 'ditolak'],
]

function sapaan() {
  const j = new Date().getHours()
  if (j < 11) return 'Selamat pagi'
  if (j < 15) return 'Selamat siang'
  if (j < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function waktu(v) {
  const d = new Date(v)
  if (!v || Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Memuat data">
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  )
}

export default function Dashboard() {
  const admin = getAdmin()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mengunduh, setMengunduh] = useState(false)
  const [pesanUnduh, setPesanUnduh] = useState('')

  const muat = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      setData(await getDashboard(signal))
      setLoading(false)
    } catch (err) {
      // Request dibatalkan (cleanup effect / StrictMode): jangan ubah state, request berikutnya yang mengurus.
      if (err.code === 'ERR_CANCELED') return
      setError(err.response ? 'Gagal memuat data dashboard. Silakan coba lagi.' : 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Dashboard Admin | BKPSDM Kota Yogyakarta'
    const ctrl = new AbortController()
    muat(ctrl.signal)
    return () => ctrl.abort()
  }, [muat])

  async function unduh() {
    setMengunduh(true)
    setPesanUnduh('')
    try {
      await unduhPendaftar()
    } catch {
      setPesanUnduh('Gagal mengunduh data. Silakan coba lagi.')
    } finally {
      setMengunduh(false)
    }
  }

  const total = data?.total ?? 0
  const persen = (n) => (total ? Math.round((n / total) * 100) : 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {sapaan()}, <span className="font-semibold text-slate-700">{admin?.name ?? 'Admin'}</span>. Ringkasan pendaftaran magang BKPSDM.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => muat()} disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
            <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
          </button>
          <button type="button" onClick={unduh} disabled={mengunduh}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-70">
            <Icon name="download" className="h-4 w-4" /> {mengunduh ? 'Mengunduh...' : 'Unduh Excel'}
          </button>
        </div>
      </div>

      {pesanUnduh && <p role="alert" className="mt-3 text-sm text-red-600">{pesanUnduh}</p>}

      <div className="mt-6">
        {!data && !error ? (
          <Skeleton />
        ) : error && !data ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => muat()}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-50">
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            {data.menunggu > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                <Icon name="clock" className="h-5 w-5 shrink-0" />
                <p className="flex-1"><span className="font-bold">{data.menunggu} pendaftar</span> menunggu verifikasi.</p>
                <Link to="/admin/pendaftar?status=menunggu_verifikasi" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                  Verifikasi sekarang
                </Link>
              </div>
            )}

            {/* Kartu statistik */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Link to="/admin/pendaftar" aria-label="Lihat semua pendaftar"
                className="block rounded-2xl bg-brand-900 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:ring-4 focus:ring-brand-500/30 focus:outline-none sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">Total Pendaftar</p>
                  <Icon name="users" className="h-5 w-5 text-brand-200" />
                </div>
                <p className="mt-3 text-4xl font-extrabold tabular-nums">{data.total}</p>
                <p className="mt-1 text-xs text-slate-300">Lihat semua →</p>
              </Link>

              {KARTU.map(([field, status]) => {
                const s = STATUS[status]
                return (
                  <Link key={field} to={`/admin/pendaftar?status=${status}`} aria-label={`Lihat pendaftar ${s.label}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md focus:ring-4 focus:ring-brand-500/20 focus:outline-none">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">{s.label}</p>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.ikon}`}>
                        <Icon name={s.icon} className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tabular-nums text-brand-900">{data[field]}</p>
                    <p className="mt-1 text-xs text-slate-400">{persen(data[field])}% dari total · <span className="font-semibold text-brand-500">Lihat →</span></p>
                  </Link>
                )
              })}
            </div>

            {/* Komposisi status */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-bold text-brand-900">Komposisi Status Pendaftar</h2>
              {total === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Belum ada data pendaftar.</p>
              ) : (
                <>
                  <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img"
                    aria-label={KARTU.map(([f, st]) => `${STATUS[st].label} ${persen(data[f])}%`).join(', ')}>
                    {KARTU.map(([f, st]) => data[f] > 0 && (
                      <div key={f} className={STATUS[st].bar} style={{ width: `${(data[f] / total) * 100}%` }} />
                    ))}
                  </div>
                  <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                    {KARTU.map(([f, st]) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={`h-2.5 w-2.5 rounded-full ${STATUS[st].bar}`} />
                        <span className="flex-1">{STATUS[st].label}</span>
                        <span className="font-semibold tabular-nums text-brand-900">{data[f]}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {/* Pendaftar terbaru */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-base font-bold text-brand-900">Pendaftar Terbaru</h2>
                  <p className="text-xs text-slate-400">5 pendaftaran terakhir yang masuk</p>
                </div>
                <Link to="/admin/pendaftar" className="text-sm font-semibold text-brand-500 hover:underline">Lihat semua</Link>
              </div>

              {data.terbaru.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-slate-400">
                  <Icon name="inbox" className="h-10 w-10" />
                  <p className="text-sm">Belum ada pendaftar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-xs tracking-wide text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-3 font-semibold sm:px-6">No. Pendaftaran</th>
                        <th className="px-3 py-3 font-semibold">Nama</th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold sm:px-6">Waktu Daftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.terbaru.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600 sm:px-6">{p.nomor_pendaftaran}</td>
                          <td className="px-3 py-3.5 font-semibold">
                            <Link to={`/admin/pendaftar?buka=${p.id}`} className="text-brand-900 hover:text-brand-500 hover:underline">{p.nama_lengkap}</Link>
                          </td>
                          <td className="px-3 py-3.5"><StatusBadge status={p.status} /></td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 sm:px-6">{waktu(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}