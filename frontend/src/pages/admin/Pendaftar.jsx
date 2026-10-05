import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPendaftar, getPendaftarList, ubahStatus } from '../../api/admin'
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

// Aksi yang tersedia untuk tiap status saat ini
const AKSI = {
  menunggu_verifikasi: [
    { to: 'diverifikasi', label: 'Verifikasi Berkas', cls: btn.primary },
    { to: 'ditolak', label: 'Tolak', cls: btn.danger },
  ],
  diverifikasi: [
    { to: 'diterima', label: 'Terima Magang', cls: btn.emerald },
    { to: 'ditolak', label: 'Tolak', cls: btn.danger },
    { to: 'menunggu_verifikasi', label: 'Kembalikan ke Menunggu', cls: btn.ghost },
  ],
  diterima: [
    { to: 'diverifikasi', label: 'Kembalikan ke Diverifikasi', cls: btn.ghost },
    { to: 'ditolak', label: 'Ubah ke Ditolak', cls: btn.danger },
  ],
  ditolak: [{ to: 'menunggu_verifikasi', label: 'Buka Kembali (Menunggu)', cls: btn.ghost }],
}

const TANYA = {
  diverifikasi: 'Tandai berkas pendaftar ini sebagai sudah diverifikasi?',
  diterima: 'Terima pendaftar ini untuk program magang?',
  ditolak: 'Tolak pendaftaran ini? Alasan penolakan wajib diisi.',
  menunggu_verifikasi: 'Kembalikan pendaftaran ini ke status menunggu verifikasi?',
}

const namaDokumen = (j) => String(j ?? '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

function linkWA(no) {
  let n = String(no ?? '').replace(/\D/g, '')
  if (n.startsWith('0')) n = `62${n.slice(1)}`
  return n ? `https://wa.me/${n}` : null
}

function Baris({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 font-medium break-words text-slate-800">{children || '-'}</dd>
    </div>
  )
}

function Bagian({ judul, children }) {
  return (
    <section className="border-t border-slate-100 px-5 py-4 sm:px-6">
      <h3 className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">{judul}</h3>
      {children}
    </section>
  )
}

function Detail({ id, onClose, onBerubah }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [aksi, setAksi] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [simpan, setSimpan] = useState(false)
  const [galat, setGalat] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    setD(null); setErr(''); setAksi(null); setGalat(''); setInfo('')
    getPendaftar(id, ctrl.signal)
      .then((x) => { setD(x); setCatatan(x.catatan ?? '') })
      .catch((e) => {
        if (e.code === 'ERR_CANCELED') return
        setErr(e.response?.status === 404 ? 'Data pendaftar tidak ditemukan.' : 'Gagal memuat detail pendaftar.')
      })
    return () => ctrl.abort()
  }, [id])

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  useEffect(() => {
    const lama = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = lama }
  }, [])

  async function konfirmasi() {
    if (aksi === 'ditolak' && !catatan.trim()) return setGalat('Alasan penolakan wajib diisi.')
    setSimpan(true); setGalat('')
    try {
      const baru = await ubahStatus(d.id, { status: aksi, catatan: catatan.trim() })
      setD((prev) => ({ ...prev, ...baru }))
      setCatatan(baru.catatan ?? '')
      setAksi(null)
      setInfo(`Status berhasil diubah menjadi "${baru.status_label}".`)
      onBerubah()
    } catch (e) {
      const er = e.response?.data?.errors
      setGalat(er?.catatan?.[0] ?? er?.status?.[0] ?? (e.response ? 'Gagal mengubah status. Silakan coba lagi.' : 'Tidak dapat terhubung ke server.'))
    } finally {
      setSimpan(false)
    }
  }

  const wa = linkWA(d?.no_whatsapp)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Detail pendaftar">
      <button type="button" aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400">{d?.nomor_pendaftaran ?? '...'}</p>
            <h2 className="truncate text-lg font-extrabold text-brand-900">{d?.nama_lengkap ?? 'Memuat...'}</h2>
            {d && <div className="mt-1.5"><StatusBadge status={d.status} label={d.status_label} /></div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        {err ? (
          <p role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
        ) : !d ? (
          <div className="animate-pulse space-y-3 p-6" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-5 rounded bg-slate-200" />)}
          </div>
        ) : (
          <>
            {info && <p role="status" className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-6">{info}</p>}

            <Bagian judul="Data Diri">
              <dl>
                <Baris label="Nama">{d.nama_lengkap}</Baris>
                <Baris label="NIK">{d.nik}</Baris>
                <Baris label="TTL">{`${d.tempat_lahir ?? ''}, ${tanggal(d.tanggal_lahir)}`}</Baris>
                <Baris label="Jenis kelamin">{d.jenis_kelamin === 'L' ? 'Laki-laki' : d.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</Baris>
                <Baris label="Alamat">{d.alamat}</Baris>
                <Baris label="WhatsApp">
                  {d.no_whatsapp}{' '}
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="ml-1 text-xs font-semibold text-brand-500 hover:underline">Chat</a>}
                </Baris>
                <Baris label="Email">
                  <a href={`mailto:${d.email}`} className="text-brand-500 hover:underline">{d.email}</a>
                </Baris>
              </dl>
            </Bagian>

            <Bagian judul="Pendidikan">
              <dl>
                <Baris label="NIM">{d.nim}</Baris>
                <Baris label="Universitas">{d.universitas}</Baris>
                <Baris label="Fakultas">{d.fakultas}</Baris>
                <Baris label="Program studi">{d.program_studi}</Baris>
                <Baris label="Semester">{d.semester}</Baris>
              </dl>
            </Bagian>

            <Bagian judul="Magang">
              <dl>
                <Baris label="Program">{d.program}</Baris>
                <Baris label="Bidang">{d.bidang}</Baris>
                <Baris label="Periode">{`${tanggal(d.periode_mulai)} – ${tanggal(d.periode_selesai)}`}</Baris>
                <Baris label="Mendaftar">{d.created_at}</Baris>
              </dl>
            </Bagian>

            <Bagian judul="Dokumen">
              {d.dokumen?.length ? (
                <ul className="mt-2 space-y-2">
                  {d.dokumen.map((f) => (
                    <li key={f.id}>
                      <a href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-brand-900 transition hover:border-brand-500 hover:text-brand-500">
                        <Icon name="fileText" className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{namaDokumen(f.jenis_dokumen)}</span>
                        <span className="text-xs text-slate-400">Buka</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-sm text-slate-500">Tidak ada dokumen terlampir.</p>
              )}
            </Bagian>

            <Bagian judul="Keputusan">
              {!aksi ? (
                <>
                  {d.catatan && (
                    <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-xs font-semibold text-slate-400">Catatan saat ini</span>{d.catatan}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(AKSI[d.status] ?? []).map((a) => (
                      <button key={a.to} type="button" onClick={() => { setAksi(a.to); setGalat(''); setInfo('') }}
                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${a.cls}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-2 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-brand-900">{TANYA[aksi]}</p>
                  <label htmlFor="catatan" className="mt-3 block text-xs font-semibold text-slate-500">
                    Catatan {aksi === 'ditolak' ? '(wajib)' : '(opsional)'} — tampil di halaman Cek Status pendaftar
                  </label>
                  <textarea id="catatan" rows={3} value={catatan} onChange={(e) => { setCatatan(e.target.value); setGalat('') }}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
                  {galat && <p role="alert" className="mt-2 text-xs text-red-600">{galat}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={konfirmasi} disabled={simpan}
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${aksi === 'ditolak' ? btn.danger : aksi === 'diterima' ? btn.emerald : btn.primary}`}>
                      {simpan ? 'Menyimpan...' : 'Konfirmasi'}
                    </button>
                    <button type="button" onClick={() => { setAksi(null); setGalat(''); setCatatan(d.catatan ?? '') }} disabled={simpan}
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${btn.ghost}`}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </Bagian>
          </>
        )}
      </aside>
    </div>
  )
}

export default function Pendaftar() {
  const [sp, setSp] = useSearchParams()
  const status = KUNCI.includes(sp.get('status')) ? sp.get('status') : ''
  const q = sp.get('q') ?? ''
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const buka = sp.get('buka')

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
  const tutup = useCallback(() => ubah({ buka: '' }), [ubah])
  const refresh = useCallback(() => setVersi((v) => v + 1), [])

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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-6">Pendaftar</th>
                  <th className="px-3 py-3 font-semibold">Universitas</th>
                  <th className="px-3 py-3 font-semibold">Bidang</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasil.rows.map((p) => (
                  <tr key={p.id} onClick={() => ubah({ buka: p.id })} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3.5 sm:px-6">
                      <button type="button" onClick={() => ubah({ buka: p.id })} className="text-left font-semibold text-brand-900 hover:text-brand-500">
                        {p.nama_lengkap}
                      </button>
                      <p className="font-mono text-xs text-slate-400">{p.nomor_pendaftaran} · {p.nim}</p>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">{p.universitas}</td>
                    <td className="px-3 py-3.5 text-slate-600">{p.bidang ?? '-'}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={p.status} label={p.status_label} /></td>
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

      {buka && <Detail id={buka} onClose={tutup} onBerubah={refresh} />}
    </div>
  )
}