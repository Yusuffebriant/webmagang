import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import SafeImage from '../../components/SafeImage'

// Foto: taruh di public/images/ (hero-bkpsdm.jpg, gedung-bkpsdm.jpg, laptop.jpg). Kalau belum ada, tampil gradien.
const FOTO_HERO = '/images/gedung_bkpsdm.jpeg'
const FOTO_GEDUNG = '/images/gedung-bkpsdm.jpg'
const FOTO_LAPTOP = '/images/laptop.jpg'

const BIDANG_DEFAULT = [
  'Pendamping Teknis Pranata Komputer',
  'Pendamping Pengelola Keuangan & Administrasi',
  'Pendamping Teknis Pengelola Arsip',
  'Programer Teknologi Informasi Data Pegawai',
  'Pendamping Komunikasi Publik, Website & Media Sosial',
  'Pendamping Psikologi Uji Kompetensi & Potensi',
  'Pendamping Pengelola Talent Pool & Kediklatan',
]

const tentangMenu = [
  { icon: 'target', title: 'Visi & Misi', desc: 'Tujuan dan arah kami', href: 'https://bkpsdm.jogjakota.go.id/page/visi-misi' },
  { icon: 'fileText', title: 'Tugas & Fungsi', desc: 'Peran dan tanggung jawab', href: 'https://bkpsdm.jogjakota.go.id/page/gambaran-umum-opd' },
  { icon: 'network', title: 'Struktur Organisasi', desc: 'Pimpinan dan unit kerja', href: 'https://bkpsdm.jogjakota.go.id/page/struktur-organisasi' },
  { icon: 'pin', title: 'Lokasi & Kontak', desc: 'Temukan kami di sini', href: 'https://bkpsdm.jogjakota.go.id/page/hubungi-kami' },
]

const persyaratan = [
  'Mahasiswa aktif',
  'Surat pengantar dari kampus',
  'Bersedia mengikuti jadwal magang',
  'Mengikuti ketentuan instansi',
  'Melengkapi data pendaftaran',
]

const alur = [
  ['Kenali Instansi', 'Pelajari profil dan informasi instansi.'],
  ['Baca Informasi Magang', 'Pahami program, persyaratan, dan bidang yang tersedia.'],
  ['Isi Formulir Pendaftaran', 'Lengkapi data dan unggah dokumen.'],
  ['Verifikasi Data', 'Pemeriksaan kelengkapan dan kebenaran data.'],
  ['Menunggu Hasil Seleksi', 'Informasi akan dikirim melalui email/website.'],
  ['Mulai Magang', 'Selamat bergabung dengan tim kami!'],
]

function formatPeriode(mulai, selesai) {
  if (!mulai || !selesai) return '-'
  const s = new Date(mulai)
  const e = new Date(selesai)
  const bulan = (d) => d.toLocaleDateString('id-ID', { month: 'long', timeZone: 'UTC' })
  const sy = s.getUTCFullYear()
  const ey = e.getUTCFullYear()
  return sy === ey ? `${bulan(s)} – ${bulan(e)} ${sy}` : `${bulan(s)} ${sy} – ${bulan(e)} ${ey}`
}

const Eyebrow = ({ children }) => (
  <p className="mb-2 text-sm font-semibold tracking-wide text-brand-500 uppercase">{children}</p>
)

const Container = ({ className = '', children }) => (
  <div className={`mx-auto max-w-7xl px-6 ${className}`}>{children}</div>
)

export default function Beranda() {
  const [program, setProgram] = useState(null)
  const [bidang, setBidang] = useState([])

  useEffect(() => {
    let ignore = false
    Promise.allSettled([api.get('/public/program'), api.get('/public/bidang')]).then(([p, b]) => {
      if (ignore) return
      if (p.status === 'fulfilled') setProgram(p.value.data[0] ?? null)
      if (b.status === 'fulfilled') setBidang(b.value.data.map((x) => x.nama_bidang))
    })
    return () => { ignore = true }
  }, [])

  const daftarBidang = bidang.length ? bidang : BIDANG_DEFAULT

  const infoProgram = [
    { icon: 'calendar', label: 'Periode Magang', value: formatPeriode(program?.periode_mulai, program?.periode_selesai) },
    { icon: 'clock', label: 'Durasi', value: program?.durasi ? `Minimal ${program.durasi} bulan` : '-' },
    { icon: 'users', label: 'Peserta', value: 'Mahasiswa aktif' },
  ]

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-900">
        <SafeImage src={FOTO_HERO} className="absolute inset-0 h-full w-full object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/75 to-brand-900/15" />
        <Container className="relative flex min-h-[560px] items-center py-20 md:min-h-[660px]">
          <div className="max-w-2xl">
            <span className="inline-block rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
              Program Magang
            </span>
            <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold text-white md:text-6xl">
              Selamat Datang di Program Magang <span className="text-brand-500">BKPSDM</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-100">
              Kenali lebih dekat instansi kami, lingkungan kerja, serta kesempatan belajar yang tersedia bagi mahasiswa melalui program magang.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#tentang"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600">
                <Icon name="building" className="h-4 w-4" /> Kenali Instansi
              </a>
              <Link to="/pendaftaran"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
                <Icon name="userPlus" className="h-4 w-4" /> Daftar Magang
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* TENTANG INSTANSI */}
      <section id="tentang" className="bg-white py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <Eyebrow>Tentang Instansi</Eyebrow>
            <h2 className="text-4xl leading-tight font-bold text-brand-900">Mengenal Lebih Dekat BKPSDM</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kota Yogyakarta merupakan instansi yang bertugas dalam pengelolaan kepegawaian, pengembangan kompetensi, dan peningkatan kualitas sumber daya manusia di lingkungan pemerintah daerah.
            </p>
            <a href="https://bkpsdm.jogjakota.go.id/" target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-900 px-6 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white">
              Selengkapnya <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="aspect-[1.1] overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-md">
            <SafeImage src={FOTO_GEDUNG} alt="Gedung BKPSDM" className="h-full w-full object-cover" />
          </div>

          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white shadow-md">
            {tentangMenu.map((m) => (
              <li key={m.title}>
                <a href={m.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-4 transition hover:bg-brand-50">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <Icon name={m.icon} className="h-6 w-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold text-brand-900">{m.title}</span>
                    <span className="block text-sm text-slate-500">{m.desc}</span>
                  </span>
                  <Icon name="chevronRight" className="h-4 w-4 text-slate-400" />
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* PROGRAM MAGANG */}
      <section id="program" className="bg-brand-50 py-16">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          <div>
            <Eyebrow>Program Magang</Eyebrow>
            <h2 className="text-3xl font-bold text-brand-900">Informasi Program Magang</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Program magang di BKPSDM memberikan kesempatan bagi mahasiswa untuk belajar langsung di lingkungan kerja profesional, mengembangkan kompetensi, dan menerapkan ilmu yang telah dipelajari di bangku kuliah.
            </p>
            <a href="#program"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Lihat Detail Program <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {infoProgram.map((i) => (
              <div key={i.label}>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm">
                  <Icon name={i.icon} className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-brand-900">{i.label}</p>
                <p className="mt-1 text-sm text-slate-500">{i.value}</p>
              </div>
            ))}
            <div>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm">
                <Icon name="briefcase" className="h-5 w-5" />
              </span>
              <p className="text-base font-semibold text-brand-900">Bidang yang Tersedia</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-500 marker:text-brand-500">
                {daftarBidang.slice(0, 5).map((b) => <li key={b}>{b}</li>)}
                <li>Bidang lainnya</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* PERSYARATAN */}
      <section className="bg-white py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <Eyebrow>Persyaratan</Eyebrow>
            <h2 className="text-3xl font-bold text-brand-900">Persyaratan Pendaftaran</h2>
            <p className="mt-2 text-base text-slate-600">
              Pastikan Anda memenuhi persyaratan berikut sebelum melakukan pendaftaran magang.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 text-base text-slate-700 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-3">
              {persyaratan.map((p) => (
                <li key={p} className="flex items-center gap-2.5"><CheckCircle className="h-5 w-5 shrink-0 text-brand-500" />{p}</li>
              ))}
            </ul>
          </div>

          <div className="relative h-72 md:h-80 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-brand-100 shadow-md">
            <SafeImage src={FOTO_LAPTOP} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute right-8 bottom-8 -rotate-6 text-right">
              <p className="font-script text-4xl leading-[1.05] text-brand-900">Bersama<br />Membangun<br />Masa Depan</p>
              <span className="mt-1 ml-auto block h-0.5 w-20 -rotate-3 rounded bg-brand-500" />
            </div>
          </div>
        </Container>
      </section>

      {/* ALUR PENDAFTARAN */}
      <section className="bg-brand-50 py-16">
        <Container>
          <Eyebrow>Alur Pendaftaran</Eyebrow>
          <h2 className="text-3xl font-bold text-brand-900">Mudah dan Terstruktur</h2>
          <p className="mt-2 text-base text-slate-600">
            Ikuti langkah-langkah berikut untuk mendaftar program magang di <span className="text-brand-500">BKPSDM</span>.
          </p>
          <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {alur.map(([judul, desc], i) => (
              <li key={judul}>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white ring-4 ring-brand-500/15">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {i < alur.length - 1 && (
                    <span className="hidden flex-1 items-center gap-1 text-brand-200 lg:flex">
                      <span className="h-px flex-1 bg-brand-200" />
                      <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-brand-900">{judul}</p>
                <p className="mt-1 pr-2 text-sm leading-snug text-slate-500">{desc}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-white py-14">
        <Container>
          <div className="flex flex-col items-start gap-5 rounded-2xl bg-brand-900 px-10 py-10 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
              <Icon name="cap" className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Siap Menjadi Bagian dari Kami?</h2>
              <p className="mt-1 text-base text-slate-200">
                Daftarkan diri Anda sekarang dan raih pengalaman berharga bersama BKPSDM.
              </p>
            </div>
            <Link to="/pendaftaran"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600">
              <Icon name="userPlus" className="h-4 w-4" /> Daftar Magang <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}