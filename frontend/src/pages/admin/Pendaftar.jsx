import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getPendaftarList } from '../../api/admin'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import { STATUS, tanggal } from '../../lib/status'

const KUNCI = Object.keys(STATUS)
const TAB = [{ key: '', label: 'Semua' }, ...KUNCI.map((k) => ({ key: k, label: STATUS[k].label }))]

const btn = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'border border-slate-300 bg-white text-brand-900 hover:border-brand-500 hover:text-brand-500',
}

export default function Pendaftar() {
  const [sp, setSp] = useSearchParams()
  const status = KUNCI.includes(sp.get('status')) ? sp.get('status') : ''
  const q = sp.get('q') ?? ''
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const navigate = useNavigate()
  const location = useLocation()
  const bukaId = sp.get('buka') // tautan lama ?buka=ID -> arahkan ke halaman detail

  const [cari, setCari] = useState(q)
  const [hasil, setHasil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [versi, setVersi] = useState(0)

  // setSp dari router berubah identitas tiap URL berubah; lewat ref supaya `ubah` stabil
  // dan efek fetch tidak jalan ulang hanya karena panel detail dibuka/ditutup.
  const setSpRef = useRef(setSp)
  useEffect(() => { setSpRef.current = setSp })
  const ubah = useCallback(
    (upd, opts) =>
      setSpRef.current((prev) => {
        const n = new URLSearchParams(prev)
        Object.entries(upd).forEach(([k, v]) => (v === '' || v == null ? n.delete(k) : n.set(k, String(v))))
        return n
      }, opts),
    [],
  )
  const refresh = useCallback(() => setVersi((v) => v + 1), [])

  useEffect(() => { if (bukaId) navigate(`/admin/pendaftar/${bukaId}`, { replace: true }) }, [bukaId, navigate])

  useEffect(() => { document.title = 'Data Pendaftar | BKPSDM Kota Yogyakarta' }, [])

  // pencarian: tunggu user berhenti mengetik
  useEffect(() => {
    if (cari.trim() === q) return
    const t = setTimeout(() => ubah({ q: cari.trim(), page: '' }, { replace: true }), 350)
    return () => clearTimeout(t)
  }, [cari, q, ubah])
  useEffect(() => { setCari((c) => (c.trim() === q ? c : q)) }, [q])

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError('')
    getPendaftarList({ status: status || undefined, search: q || undefined, page }, ctrl.signal)
      .then((d) => {
        const rows = d.data ?? []
        if (rows.length === 0 && page > 1) return ubah({ page: '' }, { replace: true })
        setHasil({ rows, meta: d.meta ?? {} })
        setLoading(false)
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return
        setError(err.response ? 'Gagal memuat data pendaftar.' : 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.')
        setLoading(false)
      })
    return () => ctrl.abort()
  }, [status, q, page, versi, ubah])

  const bukaDetail = (id) => navigate(`/admin/pendaftar/${id}`, { state: { dari: location.search } })

  const meta = hasil?.meta ?? {}
  const halaman = meta.current_page ?? page
  const terakhir = meta.last_page ?? 1

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">Data Pendaftar</h1>
      <p className="mt-1 text-sm text-slate-500">Periksa data pendaftar, lalu verifikasi, terima, atau tolak.</p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter status">
          {TAB.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={status === t.key}
              onClick={() => ubah({ status: t.key, page: '' })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                status === t.key ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500 hover:text-brand-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama, no. pendaftaran, NIM"
            aria-label="Cari pendaftar"
            className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error && !hasil ? (
          <div role="alert" className="p-8 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={refresh} className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold ${btn.ghost}`}>Coba lagi</button>
          </div>
        ) : !hasil ? (
          <div className="animate-pulse space-y-3 p-6" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 rounded bg-slate-200" />)}
          </div>
        ) : hasil.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-slate-400">
            <Icon name="inbox" className="h-10 w-10" />
            <p className="text-sm">{q || status ? 'Tidak ada pendaftar yang cocok dengan filter.' : 'Belum ada pendaftar.'}</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {error && <p role="alert" className="px-6 pt-4 text-sm text-red-600">{error}</p>}
            <table className="w-full min-w-[45rem] text-left text-sm">
              <thead className="text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-6">Pendaftar</th>
                  <th className="px-3 py-3 font-semibold">Universitas</th>
                  <th className="px-3 py-3 font-semibold">Bidang</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  {status === 'diterima' && <th className="px-3 py-3 font-semibold">Periode Magang</th>}
                  <th className="px-5 py-3 font-semibold sm:px-6">Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasil.rows.map((p) => (
                  <tr key={p.id} onClick={() => bukaDetail(p.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3.5 sm:px-6">
                      <button type="button" onClick={(e) => { e.stopPropagation(); bukaDetail(p.id) }} className="text-left font-semibold text-brand-900 hover:text-brand-500">
                        {p.nama_lengkap}
                      </button>
                      {p.jumlah_anggota > 0 && (
                        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[0.86rem] font-semibold text-brand-600">
                          Kelompok · {p.jumlah_anggota + 1} orang
                        </span>
                      )}
                      <p className="font-mono text-xs text-slate-400">{p.nomor_pendaftaran} · {p.nim}</p>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">{p.universitas}</td>
                    <td className="px-3 py-3.5 text-slate-600">{p.bidang ?? '-'}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={p.status} label={p.status_label} /></td>
                    {status === 'diterima' && (
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                        {p.periode_mulai ? `${tanggal(p.periode_mulai)} – ${tanggal(p.periode_selesai)}` : '-'}
                      </td>
                    )}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 sm:px-6">{p.created_at?.slice(0, 10) ? tanggal(p.created_at) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasil && hasil.rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:px-6">
            <span>
              {meta.total != null ? `Menampilkan ${meta.from ?? 1}–${meta.to ?? hasil.rows.length} dari ${meta.total} pendaftar` : `${hasil.rows.length} pendaftar`}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={halaman <= 1 || loading} onClick={() => ubah({ page: halaman - 1 })}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${btn.ghost}`}>Sebelumnya</button>
              <span className="tabular-nums">Hal. {halaman} / {terakhir}</span>
              <button type="button" disabled={halaman >= terakhir || loading} onClick={() => ubah({ page: halaman + 1 })}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${btn.ghost}`}>Berikutnya</button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}