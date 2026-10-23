import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getPendaftar, ubahStatus, unggahLoa, unggahFotoPendaftar } from '../../api/admin'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import SertifikatPanel from '../../components/SertifikatPanel'
import SafeImage from '../../components/SafeImage'
import EditDataForm from '../../components/EditDataForm'
import HasilMagang from '../../components/HasilMagang'
import { tanggal, rapikanNama } from '../../lib/status'

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
    { to: 'diterima', label: 'Terima Magang', cls: btn.emerald, perluLoa: true },
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

const BATAS_LOA = 2 * 1024 * 1024 // 2 MB, sama dengan validasi backend

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

// Foto diri pendaftar (klik untuk membuka ukuran penuh). Pendaftar lama tanpa foto: tampil placeholder.
function Placeholder({ teks }) {
  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-[0.7rem] text-slate-400">
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      {teks}
    </span>
  )
}

const TIPE_FOTO = ['image/jpeg', 'image/png']
const BATAS_FOTO = 2 * 1024 * 1024 // 2 MB, sama dengan validasi backend

// `onUnggah(file)` harus mengembalikan promise (melempar galat bila gagal).
function FotoOrang({ src, nama, onUnggah }) {
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState('')
  const input = useRef(null)
  const kotak = 'block h-44 w-36 overflow-hidden rounded-xl border border-slate-200 bg-slate-50'

  async function pilih(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!TIPE_FOTO.includes(file.type)) return setGalat('Foto harus berformat JPG atau PNG.')
    if (file.size > BATAS_FOTO) return setGalat('Ukuran foto maksimal 2MB.')
    setKirim(true); setGalat('')
    try {
      await onUnggah(file)
    } catch (err) {
      const er = err.response?.data?.errors
      setGalat((er ? Object.values(er).flat()[0] : null) ?? (err.response ? 'Gagal mengunggah foto. Silakan coba lagi.' : 'Tidak dapat terhubung ke server.'))
    } finally {
      setKirim(false)
    }
  }

  return (
    <div className="my-2">
      {!src ? (
        <div className={kotak}><Placeholder teks="Belum ada foto" /></div>
      ) : (
        <a href={src} target="_blank" rel="noopener noreferrer" title="Buka foto ukuran penuh" className={kotak}>
          <SafeImage src={src} alt={`Foto ${nama}`} className="h-full w-full object-cover" fallback={<Placeholder teks="Foto tidak dapat dimuat" />} />
        </a>
      )}
      {onUnggah && (
        <>
          <input ref={input} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pilih} className="sr-only" tabIndex={-1} aria-label={`Pilih foto ${nama}`} />
          <button type="button" onClick={() => input.current?.click()} disabled={kirim}
            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
            {kirim ? 'Mengunggah...' : src ? 'Ganti Foto' : 'Tambah Foto'}
          </button>
        </>
      )}
      {galat && <p role="alert" className="mt-1 max-w-[16rem] text-xs text-red-600">{galat}</p>}
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

export default function DetailPendaftar() {
  const { id } = useParams()
  const location = useLocation()
  const kembali = `/admin/pendaftar${location.state?.dari ?? ''}`
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [aksi, setAksi] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [simpan, setSimpan] = useState(false)
  const [galat, setGalat] = useState('')
  const [info, setInfo] = useState('')
  const [edit, setEdit] = useState(false)
  const [fileLoa, setFileLoa] = useState(null)
  const [kirimLoa, setKirimLoa] = useState(false)
  const [galatLoa, setGalatLoa] = useState('')
  const inputLoa = useRef(null)

  useEffect(() => { document.title = 'Detail Pendaftar | BKPSDM Kota Yogyakarta' }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    setD(null); setErr(''); setAksi(null); setEdit(false); setGalat(''); setInfo('')
    setFileLoa(null); setGalatLoa('')
    getPendaftar(id, ctrl.signal)
      .then((x) => { setD(x); setCatatan(x.catatan ?? '') })
      .catch((e) => {
        if (e.code === 'ERR_CANCELED') return
        setErr(e.response?.status === 404 ? 'Data pendaftar tidak ditemukan.' : 'Gagal memuat detail pendaftar.')
      })
    return () => ctrl.abort()
  }, [id])

  async function konfirmasi() {
    if (aksi === 'ditolak' && !catatan.trim()) return setGalat('Alasan penolakan wajib diisi.')
    setSimpan(true); setGalat('')
    try {
      const baru = await ubahStatus(d.id, { status: aksi, catatan: catatan.trim() })
      setD((prev) => ({ ...prev, ...baru }))
      setCatatan(baru.catatan ?? '')
      setAksi(null)
      setInfo(`Status berhasil diubah menjadi "${baru.status_label}".`)
    } catch (e) {
      const er = e.response?.data?.errors
      setGalat(er?.catatan?.[0] ?? er?.status?.[0] ?? (e.response ? 'Gagal mengubah status. Silakan coba lagi.' : 'Tidak dapat terhubung ke server.'))
    } finally {
      setSimpan(false)
    }
  }

  async function simpanLoa() {
    if (!fileLoa) return setGalatLoa('Pilih file LOA terlebih dahulu.')
    if (fileLoa.size > BATAS_LOA) return setGalatLoa('Ukuran file LOA maksimal 2 MB.')
    setKirimLoa(true); setGalatLoa(''); setInfo('')
    try {
      const baru = await unggahLoa(d.id, fileLoa)
      setD((prev) => ({ ...prev, ...baru }))
      setFileLoa(null)
      if (inputLoa.current) inputLoa.current.value = ''
      setInfo('LOA berhasil diunggah.')
    } catch (e) {
      const er = e.response?.data?.errors
      const st = e.response?.status
      setGalatLoa(er?.loa?.[0] ?? (st === 404 || st === 405 ? 'Fitur unggah LOA belum tersedia di server.' : e.response ? 'Gagal mengunggah LOA. Silakan coba lagi.' : 'Tidak dapat terhubung ke server.'))
    } finally {
      setKirimLoa(false)
    }
  }

  async function gantiFoto(file, anggotaId) {
    const baru = await unggahFotoPendaftar(d.id, file, anggotaId)
    setD((prev) => ({ ...prev, ...baru }))
    setInfo('Foto berhasil disimpan.')
  }

  const wa = linkWA(d?.no_whatsapp)
  const belumLoa = d?.status === 'diverifikasi' && !d?.loa_url

  return (
    <div>
      <Link to={kembali} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:underline">
        <span aria-hidden="true">←</span> Kembali ke Data Pendaftar
      </Link>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-start justify-between gap-3 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400">{d?.nomor_pendaftaran ?? '...'}</p>
            <h1 className="text-xl font-extrabold text-brand-900 sm:text-2xl">{d?.nama_lengkap ?? 'Memuat...'}</h1>
            {d && <div className="mt-1.5"><StatusBadge status={d.status} label={d.status_label} /></div>}
          </div>
          {d && !edit && (
            <button type="button" onClick={() => { setEdit(true); setInfo('') }}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500">
              Edit Data
            </button>
          )}
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

            {edit ? (
              <EditDataForm d={d} onCancel={() => setEdit(false)}
                onSaved={(baru) => { setD((prev) => ({ ...prev, ...baru })); setEdit(false); setInfo('Data peserta berhasil diperbarui.') }} />
            ) : (
            <>
            <Bagian judul={d.anggota?.length ? 'Data Diri Ketua' : 'Data Diri'}>
              <FotoOrang src={d.foto_url} nama={d.nama_lengkap} onUnggah={(f) => gantiFoto(f, null)} />
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
                <Baris label="Keahlian"><span className="whitespace-pre-line">{d.keahlian}</span></Baris>
              </dl>
            </Bagian>

            <Bagian judul="Pendidikan">
              <dl>
                <Baris label="NIM">{d.nim}</Baris>
                <Baris label="Universitas">{d.universitas}</Baris>
                <Baris label="Alamat kampus"><span className="whitespace-pre-line">{d.alamat_universitas}</span></Baris>
                <Baris label="Fakultas">{d.fakultas}</Baris>
                <Baris label="Program studi">{d.program_studi}</Baris>
                <Baris label="Semester">{d.semester}</Baris>
              </dl>
            </Bagian>

            {d.anggota?.length > 0 && (
              <Bagian judul={`Anggota Kelompok (${d.anggota.length} orang)`}>
                <div className="mt-2 space-y-3">
                  {d.anggota.map((a, i) => {
                    const waA = linkWA(a.no_whatsapp)
                    return (
                      <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2">
                        <p className="border-b border-slate-200 py-2 text-sm font-bold text-brand-900">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[0.86rem] text-white">{i + 1}</span>
                          {a.nama_lengkap}
                        </p>
                        <FotoOrang src={a.foto_url} nama={a.nama_lengkap} onUnggah={(f) => gantiFoto(f, a.id)} />
                        <dl className="divide-y divide-slate-100">
                          <Baris label="NIM">{a.nim}</Baris>
                          <Baris label="NIK">{a.nik}</Baris>
                          <Baris label="TTL">{`${a.tempat_lahir ?? ''}, ${tanggal(a.tanggal_lahir)}`}</Baris>
                          <Baris label="Jenis kelamin">{a.jenis_kelamin === 'L' ? 'Laki-laki' : a.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</Baris>
                          <Baris label="Alamat">{a.alamat}</Baris>
                          <Baris label="WhatsApp">
                            {a.no_whatsapp}{' '}
                            {waA && <a href={waA} target="_blank" rel="noopener noreferrer" className="ml-1 text-xs font-semibold text-brand-500 hover:underline">Chat</a>}
                          </Baris>
                          <Baris label="Email">
                            <a href={`mailto:${a.email}`} className="text-brand-500 hover:underline">{a.email}</a>
                          </Baris>
                          <Baris label="Universitas">{a.universitas}</Baris>
                          <Baris label="Alamat kampus"><span className="whitespace-pre-line">{a.alamat_universitas}</span></Baris>
                          <Baris label="Fakultas">{a.fakultas === '-' ? '' : a.fakultas}</Baris>
                          <Baris label="Program studi">{a.program_studi}</Baris>
                          <Baris label="Semester">{a.semester}</Baris>
                          <Baris label="Keahlian"><span className="whitespace-pre-line">{a.keahlian}</span></Baris>
                        </dl>
                      </div>
                    )
                  })}
                </div>
              </Bagian>
            )}

            <Bagian judul="Magang">
              <dl>
                <Baris label="Program">{rapikanNama(d.program)}</Baris>
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

            {d.status === 'diterima' && (
              <Bagian judul="Hasil Magang">
                <HasilMagang key={`${d.id}-${d.anggota?.length ?? 0}`} d={d} onUpdate={(baru) => setD((prev) => ({ ...prev, ...baru }))} />
              </Bagian>
            )}

            <Bagian judul="Keputusan">
              {!aksi ? (
                <>
                  {d.catatan && (
                    <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-xs font-semibold text-slate-400">Catatan saat ini</span>{d.catatan}
                    </p>
                  )}
                  {(d.status === 'diverifikasi' || d.status === 'diterima') && (
                    <div className="mt-3 rounded-xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-brand-900">Surat LOA (Letter of Acceptance)</p>
                      {d.loa_url ? (
                        <a href={d.loa_url} target="_blank" rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-brand-900 transition hover:border-brand-500 hover:text-brand-500">
                          <Icon name="fileText" className="h-5 w-5 shrink-0" />
                          <span className="flex-1">Dokumen LOA</span>
                          <span className="text-xs text-slate-400">Buka</span>
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">LOA belum diunggah.</p>
                      )}
                      {d.status === 'diverifikasi' && (
                        <>
                          <label htmlFor="loa" className="mt-3 block text-xs font-semibold text-slate-500">
                            {d.loa_url ? 'Ganti file LOA' : 'Unggah file LOA'} (PDF, JPG, atau PNG, maks. 2 MB)
                          </label>
                          <input id="loa" ref={inputLoa} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={(e) => { setFileLoa(e.target.files?.[0] ?? null); setGalatLoa('') }}
                            className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-900 hover:file:border-brand-500" />
                          {galatLoa && <p role="alert" className="mt-2 text-xs text-red-600">{galatLoa}</p>}
                          <button type="button" onClick={simpanLoa} disabled={kirimLoa || !fileLoa}
                            className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${btn.primary}`}>
                            {kirimLoa ? 'Mengunggah...' : 'Simpan LOA'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {d.status === 'diterima' && <SertifikatPanel pendaftarId={d.id} namaKelompok={d.nama_lengkap} />}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(AKSI[d.status] ?? []).map((a) => {
                      const nonaktif = a.perluLoa && !d.loa_url
                      return (
                        <button key={a.to} type="button" disabled={nonaktif}
                          title={nonaktif ? 'Unggah LOA terlebih dahulu' : undefined}
                          onClick={() => { setAksi(a.to); setGalat(''); setInfo('') }}
                          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${a.cls}`}>
                          {a.label}
                        </button>
                      )
                    })}
                  </div>
                  {belumLoa && <p className="mt-2 text-xs text-slate-500">Tombol Terima Magang aktif setelah LOA diunggah.</p>}
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
          </>
        )}
      </div>
    </div>
  )
}