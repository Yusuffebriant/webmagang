import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import Logo from '../../components/Logo'
import { rapikanNama } from '../../lib/status'

// Format nomor dari backend: MGG-YYYYMM-0001
const POLA_NOMOR = /^MGG-\d{6}-\d{4,}$/

const STATUS = {
  menunggu_verifikasi: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    judul: 'Menunggu Verifikasi',
    pesan: 'Pendaftaran Anda sudah kami terima dan sedang menunggu verifikasi oleh BKPSDM Kota Yogyakarta.',
  },
  diverifikasi: {
    badge: 'bg-brand-50 text-brand-600 border-brand-200',
    judul: 'Sudah Diverifikasi',
    pesan: 'Berkas Anda sudah diverifikasi. Mohon menunggu keputusan akhir dari BKPSDM.',
  },
  diterima: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    judul: 'Diterima',
    pesan: 'Selamat, pendaftaran magang Anda diterima. Silakan cek periode magang dan catatan di bawah.',
  },
  ditolak: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    judul: 'Ditolak',
    pesan: 'Mohon maaf, pendaftaran magang Anda belum dapat kami terima.',
  },
}

const LANGKAH = ['Pendaftaran Terkirim', 'Diverifikasi', 'Keputusan Akhir']

function tanggal(v) {
  if (!v) return '-'
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Langkah({ status }) {
  // status langkah: 'selesai' | 'berjalan' | 'menunggu' | 'lewat' | 'gagal'
  const peta = {
    menunggu_verifikasi: ['selesai', 'berjalan', 'menunggu'],
    diverifikasi: ['selesai', 'selesai', 'berjalan'],
    diterima: ['selesai', 'selesai', 'selesai'],
    ditolak: ['selesai', 'lewat', 'gagal'],
  }[status] ?? ['selesai', 'menunggu', 'menunggu']

  const label = [...LANGKAH]
  if (status === 'diterima') label[2] = 'Diterima'
  if (status === 'ditolak') label[2] = 'Ditolak'

  const bulat = {
    selesai: 'bg-brand-500 text-white',
    berjalan: 'border-2 border-brand-500 bg-white text-brand-500 ring-4 ring-brand-500/10',
    menunggu: 'border-2 border-slate-200 bg-white text-slate-400',
    lewat: 'border-2 border-slate-200 bg-slate-100 text-slate-400',
    gagal: 'bg-red-500 text-white',
  }

  return (
    <ol className="flex items-start" aria-label="Tahapan pendaftaran">
      {label.map((nama, i) => (
        <li key={nama} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && (
            <span
              aria-hidden="true"
              className={`absolute top-4 right-1/2 h-0.5 w-full ${peta[i] === 'menunggu' || peta[i] === 'lewat' ? 'bg-slate-200' : peta[i - 1] === 'selesai' ? 'bg-brand-500' : 'bg-slate-200'}`}
            />
          )}
          <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${bulat[peta[i]]}`}>
            {peta[i] === 'selesai' ? '✓' : peta[i] === 'gagal' ? '✕' : i + 1}
          </span>
          <span className={`mt-2 px-1 text-[11px] leading-tight font-semibold sm:text-xs ${peta[i] === 'menunggu' || peta[i] === 'lewat' ? 'text-slate-400' : 'text-brand-900'}`}>
            {nama}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Baris({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{children || '-'}</dd>
    </div>
  )
}

export default function CekStatus() {
  const [params, setParams] = useSearchParams()
  const [nomor, setNomor] = useState(params.get('nomor') ?? '')
  const [memuat, setMemuat] = useState(false)
  const [pesan, setPesan] = useState('')
  const [hasil, setHasil] = useState(null)
  const hasilRef = useRef(null)

  const cari = async (nilai) => {
    const kode = nilai.trim().toUpperCase()
    setHasil(null)

    if (!kode) {
      setPesan('Masukkan nomor pendaftaran Anda terlebih dahulu.')
      return
    }
    if (!POLA_NOMOR.test(kode)) {
      setPesan('Format nomor tidak sesuai. Contoh yang benar: MGG-202609-0001.')
      return
    }

    setPesan('')
    setMemuat(true)
    try {
      const { data } = await api.get(`/public/cek-status/${encodeURIComponent(kode)}`)
      setHasil(data.data)
      setParams({ nomor: kode }, { replace: true })
      setTimeout(() => hasilRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (ex) {
      const status = ex.response?.status
      if (status === 404) {
        setPesan('Nomor pendaftaran tidak ditemukan. Periksa kembali nomor Anda.')
      } else if (status === 429) {
        setPesan('Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.')
      } else {
        setPesan('Status belum bisa dimuat. Periksa koneksi Anda lalu coba lagi.')
      }
    } finally {
      setMemuat(false)
    }
  }

  // Kalau dibuka lewat /cek-status?nomor=MGG-..., langsung dicek.
  useEffect(() => {
    const awal = params.get('nomor')
    if (awal) cari(awal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e) => {
    e.preventDefault()
    cari(nomor)
  }

  const ulang = () => {
    setHasil(null)
    setPesan('')
    setNomor('')
    setParams({}, { replace: true })
  }

  const info = hasil ? (STATUS[hasil.status] ?? STATUS.menunggu_verifikasi) : null

  return (
    <div className="bg-slate-50 pb-16">
      <div className="bg-gradient-to-br from-brand-900 via-brand-900 to-brand-600 px-6 pt-14 pb-24 text-center">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
            <Logo light />
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">Cek Status Pendaftaran</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-200">
          Masukkan nomor pendaftaran yang Anda terima setelah mengisi formulir untuk melihat perkembangan pendaftaran magang Anda.
        </p>
      </div>

      <div className="mx-auto -mt-14 max-w-2xl space-y-6 px-4 sm:px-6">
        {/* Form pencarian */}
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label htmlFor="nomor" className="mb-2 block text-[13px] font-semibold text-slate-700">
            Nomor Pendaftaran
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="nomor"
              value={nomor}
              onChange={(e) => setNomor(e.target.value.toUpperCase())}
              placeholder="MGG-202609-0001"
              autoComplete="off"
              spellCheck={false}
              maxLength={30}
              aria-invalid={pesan && !hasil ? 'true' : undefined}
              aria-describedby="nomor-bantuan"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold tracking-wider text-slate-800 outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <button
              type="submit"
              disabled={memuat}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {memuat ? 'Memeriksa…' : (<>Cek Status <Icon name="arrowRight" className="h-4 w-4" /></>)}
            </button>
          </div>
          <p id="nomor-bantuan" className="mt-2 text-xs text-slate-500">
            Nomor ada di halaman konfirmasi setelah mendaftar. Contoh: MGG-202609-0001
          </p>

          {pesan && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pesan}
            </div>
          )}
        </form>

        {/* Hasil */}
        {hasil && info && (
          <section ref={hasilRef} aria-live="polite" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white px-6 py-5 sm:px-8">
              <p className="text-[11px] font-semibold tracking-wide text-brand-500 uppercase">Nomor Pendaftaran</p>
              <p className="mt-0.5 text-xl font-bold tracking-wider text-brand-900">{hasil.nomor_pendaftaran}</p>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                {hasil.status === 'diterima' && <CheckCircle className="h-9 w-9 shrink-0 text-emerald-500" />}
                <div>
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${info.badge}`}>
                    {hasil.status_label ?? info.judul}
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{info.pesan}</p>
                </div>
              </div>

              <Langkah status={hasil.status} />

              {hasil.catatan && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${hasil.status === 'ditolak' ? 'border-red-200 bg-red-50 text-red-800' : 'border-brand-200 bg-brand-50 text-brand-900'}`}>
                  <p className="text-xs font-semibold tracking-wide uppercase opacity-70">Catatan dari BKPSDM</p>
                  <p className="mt-1 whitespace-pre-line">{hasil.catatan}</p>
                </div>
              )}

              <dl className="divide-y divide-slate-100 border-t border-slate-100">
                <Baris label="Nama">{hasil.nama_lengkap}</Baris>
                <Baris label="Asal Kampus">{[hasil.universitas, hasil.program_studi].filter(Boolean).join(' – ')}</Baris>
                {hasil.program && <Baris label="Program">{rapikanNama(hasil.program)}</Baris>}
                {hasil.bidang && <Baris label="Formasi">{hasil.bidang}</Baris>}
                <Baris label="Periode Magang">
                  {hasil.periode_mulai ? `${tanggal(hasil.periode_mulai)} s.d. ${tanggal(hasil.periode_selesai)}` : '-'}
                </Baris>
                <Baris label="Tanggal Mendaftar">{tanggal(hasil.created_at)}</Baris>
              </dl>

              {hasil.status === 'ditolak' && (
                <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-4">
                  <p className="text-sm font-semibold text-brand-900">Ingin memperbaiki pendaftaran?</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Data Anda akan terisi otomatis di formulir. Perbaiki sesuai catatan, unggah ulang dokumen, lalu kirim.
                    Pendaftaran baru akan mendapat nomor pendaftaran baru.
                  </p>
                  <Link
                    to="/pendaftaran"
                    state={{ prefill: hasil }}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                  >
                    Perbaiki &amp; Daftar Ulang <Icon name="arrowRight" className="h-4 w-4" />
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={ulang}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500"
                >
                  Cek Nomor Lain
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-brand-500"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Bantuan */}
        {!hasil && (
          <p className="text-center text-sm text-slate-500">
            Belum mendaftar?{' '}
            <Link to="/pendaftaran" className="font-semibold text-brand-500 hover:text-brand-600">
              Isi formulir pendaftaran
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}