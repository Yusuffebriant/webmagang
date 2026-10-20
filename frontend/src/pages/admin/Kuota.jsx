import { useCallback, useEffect, useState } from 'react'
import { editBidang, getKuota, hapusBidang, tambahBidang } from '../../api/admin'
import Icon from '../../components/Icon'
import { hitungTugas } from '../../utils/deskripsi'

const BATAS_MAKS = 1000

// Label & warna penanda tiap bidang.
// Hampir penuh = sudah ada yang terisi dan sisa kuota tinggal 1-2 orang.
function penanda(b) {
  if (b.kuota === null) return { label: 'Belum diatur', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300' }
  if (b.kuota === 0) return { label: 'Ditutup', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300' }
  if (b.sisa === 0) return { label: 'Penuh', badge: 'bg-red-50 text-red-700', bar: 'bg-red-500' }
  if (b.terisi > 0 && b.sisa <= 2) return { label: 'Hampir penuh', badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' }
  return { label: 'Tersedia', badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' }
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Memuat data">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200" />
    </div>
  )
}

function Kartu({ judul, nilai, catatan, gelap = false }) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${gelap ? 'bg-brand-900 text-white' : 'border border-slate-200 bg-white'}`}>
      <p className={`text-sm font-medium ${gelap ? 'text-slate-300' : 'text-slate-500'}`}>{judul}</p>
      <p className={`mt-3 text-2xl font-semibold tabular-nums sm:text-3xl ${gelap ? '' : 'text-brand-900'}`}>{nilai}</p>
      {catatan && <p className={`mt-1 text-xs ${gelap ? 'text-slate-300' : 'text-slate-400'}`}>{catatan}</p>}
    </div>
  )
}

const inputCls = 'mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:outline-none'
const inputOk = 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
const inputBad = 'border-red-400 focus:border-red-500 focus:ring-red-500/20'

// Dialog untuk tambah bidang (tanpa prop `bidang`) dan edit bidang (dengan prop `bidang`)
function DialogBidang({ bidang, onTutup, onTersimpan }) {
  const mengedit = Boolean(bidang)
  const [form, setForm] = useState({
    nama_bidang: bidang?.nama_bidang ?? '',
    deskripsi: bidang?.deskripsi ?? '',
    kuota: bidang?.kuota == null ? '' : String(bidang.kuota),
  })
  const [galat, setGalat] = useState({})
  const [menyimpan, setMenyimpan] = useState(false)

  useEffect(() => {
    const tekan = (e) => { if (e.key === 'Escape' && !menyimpan) onTutup() }
    document.addEventListener('keydown', tekan)
    return () => document.removeEventListener('keydown', tekan)
  }, [menyimpan, onTutup])

  const isi = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setGalat((g) => ({ ...g, [k]: undefined, umum: undefined })) }

  async function kirim(e) {
    e.preventDefault()
    const nama = form.nama_bidang.replace(/\s+/g, ' ').trim()
    const kuotaTeks = form.kuota.trim()
    const lokal = {}
    if (!nama) lokal.nama_bidang = 'Nama bidang wajib diisi.'
    else if (nama.length > 100) lokal.nama_bidang = 'Nama bidang maksimal 100 karakter.'
    if (kuotaTeks !== '' && !/^\d+$/.test(kuotaTeks)) lokal.kuota = 'Kuota harus berupa angka bulat (0 atau lebih).'
    else if (kuotaTeks !== '' && Number(kuotaTeks) > BATAS_MAKS) lokal.kuota = `Kuota maksimal ${BATAS_MAKS}.`
    else if (mengedit && kuotaTeks !== '' && Number(kuotaTeks) < bidang.terisi) lokal.kuota = `Kuota tidak boleh lebih kecil dari jumlah yang sudah diterima (${bidang.terisi}).`
    if (Object.keys(lokal).length) return setGalat(lokal)

    setMenyimpan(true)
    setGalat({})
    try {
      const payload = {
        nama_bidang: nama,
        deskripsi: form.deskripsi.trim() || null,
        kuota: kuotaTeks === '' ? null : Number(kuotaTeks),
      }
      const hasil = mengedit ? await editBidang(bidang.id, payload) : await tambahBidang(payload)
      onTersimpan(hasil)
    } catch (err) {
      const er = err.response?.data?.errors
      if (er) {
        setGalat({ nama_bidang: er.nama_bidang?.[0], deskripsi: er.deskripsi?.[0], kuota: er.kuota?.[0] })
      } else {
        setGalat({ umum: er === undefined && err.response?.data?.message && err.response.status >= 500 ? err.response.data.message : (err.response ? 'Gagal menyimpan bidang. Silakan coba lagi.' : 'Tidak dapat terhubung ke server.') })
      }
      setMenyimpan(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !menyimpan) onTutup() }}>
      <form onSubmit={kirim} noValidate role="dialog" aria-modal="true" aria-labelledby="judul-bidang"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="judul-bidang" className="text-base font-semibold text-brand-900">{mengedit ? 'Edit Bidang Magang' : 'Tambah Bidang Magang'}</h2>
            <p className="text-xs text-slate-400">
              {mengedit
                ? 'Ubah nama, deskripsi, dan kuota bidang. Keterangan terisi otomatis dari kuota.'
                : 'Bidang baru langsung berstatus aktif dan tampil pada form pendaftaran.'}
            </p>
          </div>
          <button type="button" onClick={onTutup} disabled={menyimpan} aria-label="Tutup"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {galat.umum && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{galat.umum}</p>}

          <div>
            <label htmlFor="nama_bidang" className="text-sm font-semibold text-brand-900">
              Nama Bidang <span className="text-red-600">*</span>
            </label>
            <input id="nama_bidang" type="text" autoFocus maxLength={100} value={form.nama_bidang} onChange={isi('nama_bidang')}
              placeholder="Contoh: Pengadaan dan Pengembangan"
              aria-invalid={Boolean(galat.nama_bidang)} aria-describedby={galat.nama_bidang ? 'err-nama' : undefined}
              className={`${inputCls} ${galat.nama_bidang ? inputBad : inputOk}`} />
            {galat.nama_bidang && <p id="err-nama" role="alert" className="mt-1.5 text-xs text-red-600">{galat.nama_bidang}</p>}
          </div>

          <div>
            <label htmlFor="deskripsi" className="text-sm font-semibold text-brand-900">Deskripsi</label>
            <textarea id="deskripsi" rows={8} value={form.deskripsi} onChange={isi('deskripsi')}
              placeholder={"Opsional. Tulis tugas selama magang, satu tugas per baris.\nContoh:\nMembantu menyusun dokumen perencanaan kepegawaian\nMerekap data usulan formasi ASN"}
              aria-invalid={Boolean(galat.deskripsi)} aria-describedby="bantu-deskripsi"
              className={`${inputCls} min-h-32 resize-y ${galat.deskripsi ? inputBad : inputOk}`} />
            <p id="bantu-deskripsi" className="mt-1.5 text-xs text-slate-400">
              Tanpa batas huruf. Boleh paste langsung dari PDF/Word: setiap baris bernomor (1., 2., ...) dihitung satu tugas dan kalimat yang terpotong disambung otomatis. Tanpa nomor, satu baris = satu tugas.
            </p>
            {hitungTugas(form.deskripsi) > 0 && (
              <p className="mt-1 text-xs font-semibold text-brand-600">Terdeteksi {hitungTugas(form.deskripsi)} tugas</p>
            )}
            {galat.deskripsi && <p role="alert" className="mt-1.5 text-xs text-red-600">{galat.deskripsi}</p>}
          </div>

          <div>
            <label htmlFor="kuota-baru" className="text-sm font-semibold text-brand-900">Kuota</label>
            <input id="kuota-baru" type="text" inputMode="numeric" value={form.kuota} onChange={(e) => isi('kuota')({ target: { value: e.target.value.replace(/\D/g, '') } })} maxLength={6} pattern="[0-9]*"
              placeholder="Kosongkan bila tanpa batas"
              aria-invalid={Boolean(galat.kuota)}
              className={`${inputCls} sm:w-56 ${galat.kuota ? inputBad : inputOk}`} />
            {galat.kuota && <p role="alert" className="mt-1.5 text-xs text-red-600">{galat.kuota}</p>}
            {mengedit && bidang.terisi > 0 && !galat.kuota && (
              <p className="mt-1.5 text-xs text-slate-400">Minimal {bidang.terisi} (jumlah peserta yang sudah diterima).</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onTutup} disabled={menyimpan}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
            Batal
          </button>
          <button type="submit" disabled={menyimpan}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
            {menyimpan ? 'Menyimpan...' : mengedit ? 'Simpan Perubahan' : 'Simpan Bidang'}
          </button>
        </div>
      </form>
    </div>
  )
}

function DialogHapus({ bidang, onTutup, onTerhapus }) {
  const [menghapus, setMenghapus] = useState(false)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    const tekan = (e) => { if (e.key === 'Escape' && !menghapus) onTutup() }
    document.addEventListener('keydown', tekan)
    return () => document.removeEventListener('keydown', tekan)
  }, [menghapus, onTutup])

  async function hapus() {
    setMenghapus(true)
    setGalat('')
    try {
      await hapusBidang(bidang.id)
      onTerhapus(bidang)
    } catch (err) {
      setGalat(err.response?.data?.errors?.bidang?.[0] ?? (err.response ? 'Gagal menghapus bidang. Silakan coba lagi.' : 'Tidak dapat terhubung ke server.'))
      setMenghapus(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !menghapus) onTutup() }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="judul-hapus" aria-describedby="isi-hapus"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="px-6 py-5">
          <h2 id="judul-hapus" className="text-base font-semibold text-brand-900">Hapus Bidang Magang</h2>
          <p id="isi-hapus" className="mt-2 text-sm text-slate-600">
            Bidang <span className="font-semibold text-brand-900">{bidang.nama_bidang}</span> akan dihapus permanen
            dan tidak lagi tampil pada form pendaftaran. Tindakan ini tidak dapat dibatalkan.
          </p>
          {galat && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{galat}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onTutup} disabled={menghapus} autoFocus
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
            Batal
          </button>
          <button type="button" onClick={hapus} disabled={menghapus}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
            {menghapus ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Kuota() {
  const [daftar, setDaftar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [info, setInfo] = useState('')
  const [dialogTambah, setDialogTambah] = useState(false)
  const [bidangEdit, setBidangEdit] = useState(null)
  const [bidangHapus, setBidangHapus] = useState(null)

  const muat = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      setDaftar(await getKuota(signal))
      setLoading(false)
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return
      setError(err.response ? 'Gagal memuat data kuota. Silakan coba lagi.' : 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Kuota Magang | BKPSDM Kota Yogyakarta'
    const ctrl = new AbortController()
    muat(ctrl.signal)
    return () => ctrl.abort()
  }, [muat])

  const bidangDiedit = useCallback((baru) => {
    setDaftar((arr) => arr.map((x) => (x.id === baru.id ? baru : x)).sort((a, b) => a.nama_bidang.localeCompare(b.nama_bidang, 'id')))
    setBidangEdit(null)
    setInfo(`Bidang ${baru.nama_bidang} berhasil diperbarui.`)
  }, [])

  const bidangBaru = useCallback((baru) => {
    setDaftar((arr) => [...(arr ?? []), baru].sort((a, b) => a.nama_bidang.localeCompare(b.nama_bidang, 'id')))
    setDialogTambah(false)
    setInfo(`Bidang ${baru.nama_bidang} berhasil ditambahkan.`)
  }, [])

  const bidangTerhapus = useCallback((b) => {
    setDaftar((arr) => arr.filter((x) => x.id !== b.id))
    setBidangHapus(null)
    setInfo(`Bidang ${b.nama_bidang} berhasil dihapus.`)
  }, [])

  // Ringkasan hanya dari bidang yang kuotanya sudah diatur
  const diatur = (daftar ?? []).filter((b) => b.kuota !== null)
  const totalKuota = diatur.reduce((n, b) => n + b.kuota, 0)
  const totalTerisi = diatur.reduce((n, b) => n + b.terisi, 0)
  const totalSisa = diatur.reduce((n, b) => n + b.sisa, 0)
  const belumDiatur = (daftar?.length ?? 0) - diatur.length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900 sm:text-3xl">Kuota Magang</h1>
          <p className="mt-1 text-sm text-slate-500">Atur jumlah kuota tiap bidang dan pantau sisa kuota yang tersedia.</p>
        </div>
        <button type="button" onClick={() => muat()} disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
          <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      <div className="mt-6">
        {!daftar && !error ? (
          <Skeleton />
        ) : error && !daftar ? (
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
            {info && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{info}</p>}

            <div className="grid gap-4 sm:grid-cols-3">
              <Kartu gelap judul="Total Kuota" nilai={totalKuota} catatan={belumDiatur ? `${belumDiatur} bidang belum diatur` : 'Seluruh bidang sudah diatur'} />
              <Kartu judul="Sudah Diterima" nilai={totalTerisi} catatan="Pendaftar berstatus Diterima" />
              <Kartu judul="Sisa Kuota" nilai={totalSisa} catatan="Kuota yang masih tersedia" />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-brand-900">Kuota per Bidang</h2>
                  <p className="text-xs text-slate-400">Kuota yang terpakai dihitung dari pendaftar berstatus Diterima. Kosongkan kuota bila tidak ingin dibatasi.</p>
                </div>
                <button type="button" onClick={() => { setDialogTambah(true); setInfo('') }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600">
                  <span aria-hidden="true" className="text-base leading-none">+</span> Tambah Bidang
                </button>
              </div>

              {daftar.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  <Icon name="inbox" className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  Belum ada data bidang magang.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[58rem] text-left text-sm">
                    <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Bidang</th>
                        <th className="px-3 py-3 font-semibold">Deskripsi</th>
                        <th className="px-3 py-3 font-semibold">Keterangan</th>
                        <th className="px-3 py-3 text-center font-semibold">Kuota</th>
                        <th className="px-3 py-3 text-center font-semibold">Diterima</th>
                        <th className="px-3 py-3 text-center font-semibold">Sisa</th>
                        <th className="px-3 py-3 font-semibold">Penggunaan</th>
                        <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {daftar.map((b) => {
                        const p = penanda(b)
                        const persen = b.kuota > 0 ? Math.min(Math.round((b.terisi / b.kuota) * 100), 100) : 0

                        return (
                          <tr key={b.id} className="align-top">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-brand-900">{b.nama_bidang}</p>
                              <p className="text-xs text-slate-400">
                                {b.total_pendaftar} pendaftar{b.status !== 'aktif' ? ' · Bidang nonaktif' : ''}
                              </p>
                            </td>
                            <td className="max-w-[16rem] px-3 py-3.5">
                              {b.deskripsi ? (
                                <p title={b.deskripsi} className="line-clamp-2 text-xs text-slate-600">{b.deskripsi}</p>
                              ) : (
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">Belum ada</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${p.badge}`}>{p.label}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <span className="font-semibold tabular-nums text-brand-900">{b.kuota ?? '-'}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{b.terisi}</td>
                            <td className="px-3 py-3.5 text-center font-semibold tabular-nums text-brand-900">{b.sisa ?? '-'}</td>
                            <td className="px-3 py-3.5">
                              {b.kuota > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${persen}% kuota terpakai`}>
                                    <div className={`h-full ${p.bar}`} style={{ width: `${persen}%` }} />
                                  </div>
                                  <span className="text-xs tabular-nums text-slate-500">{persen}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex gap-2">
                                <button type="button" onClick={() => { setBidangEdit(b); setInfo('') }}
                                  aria-label={`Edit bidang ${b.nama_bidang}`}
                                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500">
                                  Edit
                                </button>
                                <button type="button" onClick={() => { setBidangHapus(b); setInfo('') }}
                                  disabled={b.total_pendaftar > 0}
                                  title={b.total_pendaftar > 0 ? 'Tidak dapat dihapus karena sudah memiliki pendaftar' : undefined}
                                  aria-label={`Hapus bidang ${b.nama_bidang}`}
                                  className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white">
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {dialogTambah && <DialogBidang onTutup={() => setDialogTambah(false)} onTersimpan={bidangBaru} />}
      {bidangEdit && <DialogBidang bidang={bidangEdit} onTutup={() => setBidangEdit(null)} onTersimpan={bidangDiedit} />}
      {bidangHapus && <DialogHapus bidang={bidangHapus} onTutup={() => setBidangHapus(null)} onTerhapus={bidangTerhapus} />}
    </div>
  )
}