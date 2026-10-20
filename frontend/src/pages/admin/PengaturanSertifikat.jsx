import { useEffect, useRef, useState } from 'react'
import { getPengaturanSertifikat, simpanPengaturanSertifikat, unggahTtdSertifikat, hapusTtdSertifikat } from '../../api/admin'
import { urlPratinjau } from '../../utils/sertifikat'

const FIELD = 'mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'
const LABEL = 'block text-xs font-semibold text-slate-500'

function Kartu({ judul, deskripsi, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-brand-900">{judul}</h2>
      {deskripsi && <p className="mt-1 text-xs text-slate-500">{deskripsi}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export default function PengaturanSertifikat() {
  const [f, setF] = useState(null)
  const [bawaan, setBawaan] = useState(null)
  const [galat, setGalat] = useState('')
  const [galatField, setGalatField] = useState({})
  const [info, setInfo] = useState('')
  const [simpan, setSimpan] = useState(false)
  const [pratinjau, setPratinjau] = useState('')
  const [muatPratinjau, setMuatPratinjau] = useState(false)
  const [muatTtd, setMuatTtd] = useState(false)
  const urlLama = useRef('')

  useEffect(() => { document.title = 'Template Sertifikat | BKPSDM Kota Yogyakarta' }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    getPengaturanSertifikat(ctrl.signal)
      .then((r) => { setF(r.data); setBawaan(r.bawaan) })
      .catch((e) => {
        if (e.code === 'ERR_CANCELED') return
        setGalat(e.response ? 'Gagal memuat pengaturan sertifikat.' : 'Tidak dapat terhubung ke server.')
      })
    return () => ctrl.abort()
  }, [])

  useEffect(() => () => { if (urlLama.current) URL.revokeObjectURL(urlLama.current) }, [])

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }))
    setInfo(''); setGalat(''); setGalatField((g) => ({ ...g, [k]: undefined }))
  }

  async function onSimpan(e) {
    e.preventDefault()
    setSimpan(true); setGalat(''); setInfo(''); setGalatField({})
    try {
      setF(await simpanPengaturanSertifikat(f))
      setInfo('Pengaturan disimpan. Semua sertifikat berikutnya memakai template ini.')
    } catch (ex) {
      const er = ex.response?.data?.errors
      if (er) {
        setGalatField(Object.fromEntries(Object.entries(er).map(([k, v]) => [k, v[0]])))
        setGalat('Periksa kembali isian yang bertanda merah.')
      } else {
        setGalat(ex.response ? 'Gagal menyimpan pengaturan.' : 'Tidak dapat terhubung ke server.')
      }
    } finally {
      setSimpan(false)
    }
  }

  async function onPilihTtd(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) { setGalat('Gambar tanda tangan harus berformat PNG atau JPG.'); return }
    if (file.size > 512 * 1024) { setGalat('Ukuran gambar tanda tangan maksimal 512 KB.'); return }
    setMuatTtd(true); setGalat(''); setInfo('')
    try {
      const baru = await unggahTtdSertifikat(file)
      setF((p) => ({ ...p, ttd_pejabat: baru.ttd_pejabat }))
      setInfo('Tanda tangan diunggah. Klik Lihat Pratinjau untuk memeriksa posisinya.')
    } catch (ex) {
      setGalat(ex.response?.data?.errors?.ttd?.[0] ?? (ex.response ? 'Gagal mengunggah tanda tangan.' : 'Tidak dapat terhubung ke server.'))
    } finally {
      setMuatTtd(false)
    }
  }

  async function onHapusTtd() {
    setMuatTtd(true); setGalat(''); setInfo('')
    try {
      const baru = await hapusTtdSertifikat()
      setF((p) => ({ ...p, ttd_pejabat: baru.ttd_pejabat }))
      setInfo('Tanda tangan dihapus.')
    } catch {
      setGalat('Gagal menghapus tanda tangan.')
    } finally {
      setMuatTtd(false)
    }
  }

  async function lihat() {
    setMuatPratinjau(true); setGalat('')
    try {
      const tahun = new Date().getFullYear()
      const contoh = {
        nomor: String(f.format_nomor).replace('{urut}', '01').replace('{tahun}', String(tahun)),
        nama: 'Nama Peserta Contoh',
        instansi: 'Universitas Contoh',
        bidang: 'Umum dan Kepegawaian',
        periode_mulai: `${tahun}-01-05`,
        periode_selesai: `${tahun}-02-27`,
        tanggal_terbit: `${tahun}-02-27`,
      }
      const baru = await urlPratinjau([contoh], f)
      if (urlLama.current) URL.revokeObjectURL(urlLama.current)
      urlLama.current = baru
      setPratinjau(baru)
    } catch {
      setGalat('Gagal membuat pratinjau.')
    } finally {
      setMuatPratinjau(false)
    }
  }

  const teks = (k, label, opsi = {}) => (
    <label className={LABEL}>{label}
      {opsi.baris ? (
        <textarea rows={opsi.baris} value={f[k] ?? ''} onChange={set(k)} className={FIELD} />
      ) : (
        <input value={f[k] ?? ''} onChange={set(k)} className={FIELD} />
      )}
      {opsi.petunjuk && <span className="mt-1 block text-[0.72rem] font-normal text-slate-400">{opsi.petunjuk}</span>}
      {galatField[k] && <span role="alert" className="mt-1 block text-xs font-normal text-red-600">{galatField[k]}</span>}
    </label>
  )

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">Template Sertifikat</h1>
      <p className="mt-1 text-sm text-slate-500">
        Atur teks, pejabat penandatangan, dan format nomor. Nama peserta, kampus, periode, dan tanggal terisi otomatis dari data pendaftar.
      </p>

      {!f ? (
        galat ? <p role="alert" className="mt-6 text-sm text-red-700">{galat}</p>
          : <div className="mt-6 animate-pulse space-y-3" aria-busy="true">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded bg-slate-200" />)}</div>
      ) : (
        <form onSubmit={onSimpan} className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Kartu judul="Kop & Judul">
              {teks('instansi_nama', 'Nama instansi', { baris: 2, petunjuk: 'Satu baris per baris tulisan di kop.' })}
              {teks('instansi_alamat', 'Alamat', { baris: 2 })}
              {teks('instansi_kontak', 'Email / telepon')}
              {teks('judul', 'Judul sertifikat')}
              {teks('kalimat_pembuka', 'Kalimat pembuka')}
            </Kartu>

            <Kartu judul="Kalimat Isi" deskripsi="Tulis kalimat di bawah nama peserta. Placeholder diganti otomatis saat dicetak.">
              {teks('kalimat_isi', 'Isi', { baris: 4, petunjuk: 'Placeholder: {nama} {instansi} {bidang} {periode} {periode_mulai} {periode_selesai}' })}
            </Kartu>

            <Kartu judul="Penandatangan">
              {teks('kota', 'Kota penerbitan')}
              {teks('jabatan_pejabat', 'Jabatan', { baris: 2, petunjuk: 'Satu baris per baris tulisan.' })}
              {teks('nama_pejabat', 'Nama pejabat')}
              {teks('nip_pejabat', 'NIP')}
              <div>
                <span className={LABEL}>Gambar tanda tangan</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  {f.ttd_pejabat ? (
                    <img src={f.ttd_pejabat} alt="Tanda tangan pejabat" className="h-16 max-w-[12rem] rounded-lg border border-slate-200 bg-white object-contain p-1" />
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada gambar tanda tangan.</span>
                  )}
                  <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500">
                    {muatTtd ? 'Memproses...' : f.ttd_pejabat ? 'Ganti' : 'Unggah'}
                    <input type="file" accept="image/png,image/jpeg" onChange={onPilihTtd} disabled={muatTtd} className="sr-only" />
                  </label>
                  {f.ttd_pejabat && (
                    <button type="button" onClick={onHapusTtd} disabled={muatTtd} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-400 disabled:opacity-60">Hapus</button>
                  )}
                </div>
                <span className="mt-1 block text-[0.72rem] font-normal text-slate-400">PNG dengan latar transparan paling rapi, maks 512 KB. Langsung tersimpan saat diunggah.</span>
              </div>
            </Kartu>

            <Kartu judul="Penomoran & Akses Peserta">
              {teks('format_nomor', 'Format nomor', { petunjuk: 'Gunakan {urut} (wajib, otomatis 01, 02, ...) dan {tahun}. Contoh: {urut}/BKPSDM/SERT/{tahun}. Nomor yang sudah terbit tidak berubah; bisa diubah per sertifikat.' })}
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={f.peserta_bisa_unduh === '1'}
                  onChange={(e) => { setF((p) => ({ ...p, peserta_bisa_unduh: e.target.checked ? '1' : '0' })); setInfo('') }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                <span>
                  Peserta boleh mengunduh sertifikat sendiri di halaman Cek Status
                  <span className="block text-xs text-slate-400">Tombol muncul otomatis setelah status Diterima dan periode magang selesai.</span>
                </span>
              </label>
            </Kartu>

            {galat && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{galat}</p>}
            {info && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p>}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={simpan}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
                {simpan ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
              <button type="button" onClick={lihat} disabled={muatPratinjau}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
                {muatPratinjau ? 'Membuat...' : 'Lihat Pratinjau'}
              </button>
              <button type="button" onClick={() => { setF({ ...bawaan, ttd_pejabat: f.ttd_pejabat }); setInfo('Dikembalikan ke teks bawaan. Klik Simpan untuk menerapkan.') }}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400">
                Kembalikan ke bawaan
              </button>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {pratinjau ? (
                <iframe title="Pratinjau sertifikat" src={pratinjau} className="aspect-[297/210] w-full rounded-lg" />
              ) : (
                <div className="flex aspect-[297/210] items-center justify-center rounded-lg bg-slate-50 px-6 text-center text-sm text-slate-400">
                  Klik “Lihat Pratinjau” untuk melihat sertifikat dengan data contoh.
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  )
}