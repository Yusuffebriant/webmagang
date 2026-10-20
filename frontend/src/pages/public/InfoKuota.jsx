import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon from '../../components/Icon'
import { FooterBody } from '../../components/Footer'
import { Container, Eyebrow, PageHero, Reveal, Slide, SlideStack, Sticker } from '../../components/Motif'
import useRuangFooter from '../../hooks/useRuangFooter'
import { statusKuota } from '../../utils/kuota'
import { bacaDeskripsi, hitungTugas, ringkasDeskripsi } from '../../utils/deskripsi'

// Kelompok status, urut dari yang paling berguna bagi pendaftar
const KELOMPOK = [
  { id: 'tersedia', judul: 'Tersedia', ket: 'Masih terbuka untuk dipilih', titik: 'bg-emerald-500', kode: ['tersedia'] },
  { id: 'hampir', judul: 'Hampir penuh', ket: 'Sisa kuota tinggal 1-2 orang', titik: 'bg-amber-500', kode: ['hampir'] },
  { id: 'penuh', judul: 'Penuh / Ditutup', ket: 'Belum bisa dipilih', titik: 'bg-red-500', kode: ['penuh', 'tutup'] },
  { id: 'belum', judul: 'Kuota belum ditetapkan', ket: 'Menunggu penetapan dari BKPSDM', titik: 'bg-slate-400', kode: ['belum'] },
]

const BAYANGAN = 'shadow-[0_2px_20px_rgba(0,0,0,0.06)]'

function Ringkasan({ judul, nilai, catatan, icon, gelap = false }) {
  return (
    <div className={`group flex h-full items-center gap-3 rounded-xl px-4 py-4 sm:gap-4 sm:px-5 ${BAYANGAN} ${gelap ? 'bg-brand-900 text-white' : 'border border-slate-100 bg-white'}`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${gelap ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-500'}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold tracking-wide uppercase ${gelap ? 'text-slate-300' : 'text-slate-500'}`}>{judul}</p>
        <p className={`text-2xl leading-tight font-semibold tabular-nums sm:text-3xl ${gelap ? '' : 'text-brand-900'}`}>{nilai}</p>
        {catatan && <p className={`text-xs ${gelap ? 'text-slate-300' : 'text-slate-500'}`}>{catatan}</p>}
      </div>
    </div>
  )
}

function KartuFormasi({ f, onBuka }) {
  const st = statusKuota(f)
  const diatur = f.kuota !== null && f.kuota > 0
  const habis = st.kode === 'penuh' || st.kode === 'tutup'

  return (
    <button type="button" onClick={() => onBuka(f)} aria-haspopup="dialog" aria-label={`Lihat tugas bidang ${f.nama_bidang}`}
      className={`flex h-full w-full cursor-pointer flex-col rounded-xl border p-4 text-left transition ${BAYANGAN} ${habis ? 'border-slate-200 bg-slate-50 hover:border-slate-300' : 'border-slate-100 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_6px_28px_rgba(0,0,0,0.10)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-sm leading-snug font-semibold ${habis ? 'text-slate-500' : 'text-brand-900'}`}>{f.nama_bidang}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.86rem] font-semibold ${st.badge}`}>{st.label}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
        {ringkasDeskripsi(f.deskripsi) || 'Belum ada deskripsi untuk formasi ini.'}
      </p>
      <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
        {diatur ? (
          <>
            <div>
              <p className={`text-2xl leading-none font-semibold tabular-nums ${st.kode === 'hampir' ? 'text-amber-600' : habis ? 'text-slate-400' : 'text-brand-900'}`}>{f.sisa_kuota}</p>
              <p className="mt-0.5 text-[0.86rem] text-slate-500">kuota tersisa</p>
            </div>
            <p className="text-[0.86rem] text-slate-500">
              <span className="font-semibold text-slate-700 tabular-nums">{f.terisi}</span> terisi dari{' '}
              <span className="font-semibold text-slate-700 tabular-nums">{f.kuota}</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-500">{f.kuota === 0 ? 'Formasi sedang ditutup.' : 'Kuota belum ditetapkan.'}</p>
        )}
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-500">
        Lihat tugas magang <Icon name="chevronRight" className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}

// Jendela rincian: isi deskripsi (daftar tugas) ditata rapi
function DetailBidang({ f, onTutup }) {
  const st = statusKuota(f)
  const diatur = f.kuota !== null && f.kuota > 0
  const blok = useMemo(() => bacaDeskripsi(f.deskripsi), [f.deskripsi])
  const jumlah = useMemo(() => hitungTugas(f.deskripsi), [f.deskripsi])

  useEffect(() => {
    const tekan = (e) => { if (e.key === 'Escape') onTutup() }
    document.addEventListener('keydown', tekan)
    const awal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', tekan); document.body.style.overflow = awal }
  }, [onTutup])

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="judul-detail"
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.86rem] font-semibold ${st.badge}`}>{st.label}</span>
            <h2 id="judul-detail" className="mt-2 text-xl leading-snug font-semibold text-brand-900">{f.nama_bidang}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {diatur ? <>Sisa kuota <span className="font-semibold text-slate-700 tabular-nums">{f.sisa_kuota}</span> dari <span className="font-semibold text-slate-700 tabular-nums">{f.kuota}</span></>
                : f.kuota === 0 ? 'Formasi sedang ditutup' : 'Kuota belum ditetapkan'}
            </p>
          </div>
          <button type="button" onClick={onTutup} aria-label="Tutup"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-brand-500 uppercase">
            Tugas selama magang
            {jumlah > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600 normal-case tabular-nums">{jumlah} tugas</span>}
          </h3>
          {blok.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Rincian tugas untuk bidang ini belum tersedia.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {blok.map((b, i) => {
                if (b.jenis === 'paragraf') return <p key={i} className="text-sm leading-relaxed text-slate-700">{b.teks}</p>
                if (b.jenis === 'subjudul') return <h4 key={i} className="border-l-4 border-brand-500 pl-3 text-sm font-semibold text-brand-900 first:mt-0 not-first:pt-2">{b.teks}</h4>
                return (
                  <ol key={i} className="space-y-2.5">
                    {b.butir.map((t, j) => (
                      <li key={j} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                        <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 tabular-nums">{j + 1}</span>
                        <span className="min-w-0 break-words">{t}</span>
                      </li>
                    ))}
                  </ol>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onTutup}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500">
            Tutup
          </button>
          {st.bisaDipilih && (
            <Link to="/pendaftaran"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
              Daftar Magang <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-brand-50" />)}
    </div>
  )
}

export default function InfoKuota() {
  const [formasi, setFormasi] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)
  const [cari, setCari] = useState('')
  const [dipilihId, setDipilihId] = useState(null)

  const muat = () => {
    setMemuat(true)
    setGagal(false)
    return api.get('/public/bidang')
      .then((r) => setFormasi(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muat() }, [])

  const adaData = !memuat && !gagal && formasi.length > 0

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
  const dipilih = formasi.find((f) => f.id === dipilihId) ?? null
  const jumlahTampil = kelompok.reduce((n, k) => n + k.isi.length, 0)
  const ruangFooter = useRuangFooter() // ruang kosong sebesar footer di bawah daftar (lihat hooks/useRuangFooter.js)

  return (
    <>
      <PageHero eyebrow="Sebelum Mendaftar" title={<>Info <span className="text-brand-500">Kuota Formasi</span> Magang</>}>
        Cek ketersediaan kuota tiap formasi sebelum mendaftar.
      </PageHero>

      <SlideStack>
        {/* KETERSEDIAAN FORMASI */}
        <Slide first lift="-mt-24 md:-mt-30" className="bg-white pt-14 pb-[var(--pb,9rem)] md:pt-20" style={ruangFooter}>
          <Container>
            <Sticker kind="sparkle" rotate={12} className="-top-4 right-4" />
            <Reveal className="max-md:text-center">
              <Eyebrow>Ketersediaan Formasi</Eyebrow>
              <h2 className="text-2xl font-semibold text-brand-900 sm:text-3xl">Pilih Formasi yang Sesuai</h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600 max-md:mx-auto">
                Lihat sisa kuota tiap formasi, lalu pilih yang paling cocok dengan minat dan bidang studi Anda.
              </p>
            </Reveal>

            {/* Ringkasan */}
            {adaData && (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Reveal variant="up" delay={0}><Ringkasan judul="Total Formasi" nilai={total.formasi} icon="briefcase" /></Reveal>
                <Reveal variant="up" delay={100}><Ringkasan judul="Total Kuota" nilai={total.kuota} catatan="dari formasi yang sudah diatur" icon="users" /></Reveal>
                <Reveal variant="up" delay={200}><Ringkasan judul="Sudah Terisi" nilai={total.terisi} catatan="peserta diterima" icon="shieldCheck" /></Reveal>
                <Reveal variant="up" delay={300}><Ringkasan judul="Kuota Tersisa" nilai={total.sisa} icon="target" gelap /></Reveal>
              </div>
            )}

            {/* Pencarian & ringkasan status */}
            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="search" value={cari} onChange={(e) => setCari(e.target.value)}
                  placeholder="Cari nama formasi…" aria-label="Cari formasi"
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pr-5 pl-11 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none" />
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600 max-md:justify-center">
                {KELOMPOK.slice(0, 3).map((k) => (
                  <li key={k.id} className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${k.titik}`} />
                    {k.judul}: <span className="font-semibold text-slate-800 tabular-nums">{formasi.filter((f) => k.kode.includes(statusKuota(f).kode)).length}</span>
                  </li>
                ))}
              </ul>
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
                jumlahTampil === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-brand-50 px-6 py-12 text-center text-sm text-slate-600">
                    Tidak ada formasi yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {kelompok.map((k) => (
                      <section key={k.id} aria-labelledby={`kel-${k.id}`}>
                        <div className="mb-3 flex items-center gap-2.5">
                          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${k.titik}`} />
                          <h3 id={`kel-${k.id}`} className="text-base font-semibold text-brand-900">{k.judul}</h3>
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.86rem] font-semibold text-slate-600 tabular-nums">{k.isi.length}</span>
                          <span className="hidden text-xs text-slate-500 sm:inline">{k.ket}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {k.isi.map((f) => <KartuFormasi key={f.id} f={f} onBuka={(x) => setDipilihId(x.id)} />)}
                        </div>
                      </section>
                    ))}
                  </div>
                )
              )}
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              Kuota terisi dihitung per orang (ketua dan anggota kelompok) dari pendaftaran yang sudah berstatus <span className="font-semibold">diterima</span>.
              Angka dapat berubah sewaktu-waktu mengikuti hasil verifikasi.
            </p>

            {/* Ajakan daftar */}
            <Reveal className="mt-10 flex flex-col items-center gap-3 rounded-xl bg-brand-900 px-5 py-4 text-center sm:flex-row sm:items-center sm:text-left">
              <span className="float-y flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                <Icon name="cap" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">Sudah Menemukan Formasi yang Cocok?</h2>
                <p className="mt-0.5 text-sm text-slate-300">
                  Isi formulir pendaftaran dan dapatkan nomor pendaftaran Anda.
                </p>
              </div>
              <Link to="/pendaftaran"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
                <Icon name="userPlus" className="h-4 w-4" /> Daftar Magang <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </Container>
        </Slide>

        {/* FOOTER (map terakhir) */}
        <Slide id="footer-slide" overlap="-mt-6 md:-mt-8" edge="border-brand-500" className="bg-brand-900 text-slate-300">
          <FooterBody />
        </Slide>
      </SlideStack>

      {dipilih && <DetailBidang f={dipilih} onTutup={() => setDipilihId(null)} />}
    </>
  )
}