import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import SafeImage from '../../components/SafeImage'
import { FooterBody } from '../../components/Footer'
import useRuangFooter from '../../hooks/useRuangFooter'
import { statusKuota } from '../../utils/kuota'
import { Container, Eyebrow, FOTO_HERO, Reveal, Slide, SlideStack, Sticker, useHeroZoom } from '../../components/Motif'

// Foto: taruh di public/images/ (hero-bkpsdm.jpg, gedung-bkpsdm.jpg, laptop.jpg). Kalau belum ada, tampil gradien.
const FOTO_GEDUNG = '/images/tentang-instansi.jpg'
const FOTO_MAHASISWI = '/images/mahasiswi-bingung.webp'
const FOTO_DUO = '/images/duo-asn-mahasiswi.webp'

const tentangMenu = [
  { icon: 'target', title: 'Visi & Misi', desc: 'Tujuan dan arah kami', href: 'https://bkpsdm.jogjakota.go.id/page/visi-misi' },
  { icon: 'fileText', title: 'Tugas & Fungsi', desc: 'Peran dan tanggung jawab', href: 'https://bkpsdm.jogjakota.go.id/page/gambaran-umum-opd' },
  { icon: 'network', title: 'Struktur Organisasi', desc: 'Pimpinan dan unit kerja', href: 'https://bkpsdm.jogjakota.go.id/page/struktur-organisasi' },
  { icon: 'pin', title: 'Lokasi & Kontak', desc: 'Temukan kami di sini', href: 'https://bkpsdm.jogjakota.go.id/page/hubungi-kami' },
]

const persyaratan = [
  'Pelajar SMA/SMK atau mahasiswa aktif (D1 sampai S1)',
  'Surat pengantar dari sekolah/kampus (PDF, JPG, atau PNG, maks. 2MB)',
  'Memilih minimal satu formasi yang kuotanya masih tersedia',
  'Mengisi data diri lengkap (NIK, NIM, semester, WhatsApp & email aktif)',
  'Menentukan periode magang (tanggal mulai dan selesai)',
  'Menyetujui pernyataan kebenaran data dan aturan instansi',
]

const alur = [
  ['Kenali Instansi', 'Pelajari profil dan informasi instansi.'],
  ['Cek Kuota Formasi', 'Lihat formasi yang masih tersedia di halaman Info Kuota.'],
  ['Isi Formulir', 'Lengkapi data, pilih formasi dan periode, lalu unggah dokumen.'],
  ['Simpan Nomor Pendaftaran', 'Nomor dan bukti pendaftaran (PDF) diberikan setelah formulir terkirim.'],
  ['Verifikasi Data', 'BKPSDM Kota Yogyakarta memeriksa kelengkapan dan kebenaran data.'],
  ['Pantau di Cek Status', 'Hasil seleksi diumumkan di website.'],
]

const kapital = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)

// Jumlah formasi yang ditampilkan di kartu Program Magang (sisanya diringkas "+N formasi lainnya")
const MAKS_FORMASI_TAMPIL = 5

// Kartu info kecil di section Program Magang
function InfoItem({ icon, label, n, children }) {
  return (
    <Reveal variant="up" delay={200 + n * 130} className="group max-md:text-center">
      <span style={{ '--d': `${350 + n * 130}ms` }} className="pop-in mb-3 flex h-11 w-11 items-center justify-center max-md:mx-auto rounded-lg bg-white text-brand-500 shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="text-base font-semibold text-brand-900">{label}</p>
      {children}
    </Reveal>
  )
}

export default function Beranda() {
  const { sectionRef, innerRef } = useHeroZoom()
  const ruangFooter = useRuangFooter() // ruang kosong sebesar footer di bawah CTA (lihat hooks/useRuangFooter.js)
  const [bidang, setBidang] = useState(null) // null = belum dimuat
  const [bidangGagal, setBidangGagal] = useState(false)
  const [heroOn, setHeroOn] = useState(true) // false saat hero sudah di luar layar -> animasi masuk diputar ulang saat kembali

  useEffect(() => {
    let ignore = false
    api.get('/public/bidang')
      // Hanya formasi yang masih bisa dipilih (kuota belum penuh / tidak ditutup), sama seperti di formulir pendaftaran.
      .then((r) => { if (!ignore) setBidang(r.data.filter((x) => statusKuota(x).bisaDipilih).map((x) => x.nama_bidang)) })
      .catch(() => { if (!ignore) setBidangGagal(true) })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setHeroOn(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [sectionRef])

  const daftarBidang = (bidang ?? []).map(kapital)
  const sisaBidang = daftarBidang.length - MAKS_FORMASI_TAMPIL

  // Disesuaikan dengan formulir pendaftaran: jenjang SMA/SMK sampai S1, individu/kelompok (ketua + maks. 9 anggota),
  // periode diisi pendaftar lewat tanggal mulai & selesai (durasi dihitung otomatis), formasi dipilih dari daftar atau "Lainnya".
  const infoProgram = [
    { icon: 'cap', label: 'Peserta', value: 'Pelajar SMA/SMK dan mahasiswa D1 sampai S1' },
    { icon: 'users', label: 'Bentuk Pendaftaran', value: 'Individu atau kelompok, maksimal 10 orang termasuk ketua' },
    { icon: 'calendar', label: 'Periode', value: 'Ditentukan sendiri lewat tanggal mulai dan selesai' },
  ]

  return (
    <div>
      {/* HERO */}
      <section ref={sectionRef} className="relative overflow-hidden bg-brand-900">
        <div ref={innerRef} className="relative will-change-transform">
        <SafeImage src={FOTO_HERO} className="absolute inset-0 h-full w-full object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/75 to-brand-900/15 max-md:bg-none max-md:bg-brand-900/80" />
        <Container className="relative flex min-h-[35rem] items-center py-20 md:min-h-[max(41.25rem,100svh)]">
          <div className="max-w-4xl max-md:mx-auto max-md:text-center">
            <h1 style={{ '--d': '250ms' }} className={`${heroOn ? 'rise-in' : ''} text-2xl leading-[1.15] font-semibold text-slate-100 sm:text-3xl md:text-4xl lg:text-5xl`}>
              Selamat Datang di Program Magang <span className="text-brand-500">BKPSDM Kota Yogyakarta</span>
            </h1>
            <p style={{ '--d': '420ms' }} className={`${heroOn ? 'rise-in' : ''} mt-5 max-w-xl text-base leading-relaxed text-slate-100 max-md:mx-auto sm:mt-6 sm:text-lg`}>
              Kenali lebih dekat instansi kami, lingkungan kerja, serta kesempatan belajar yang tersedia bagi mahasiswa melalui program magang.
            </p>
            <div style={{ '--d': '580ms' }} className={`${heroOn ? 'rise-in' : ''} mt-8 flex flex-wrap gap-3 max-md:justify-center sm:mt-9 sm:gap-4`}>
              <a href="#tentang"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-600 sm:px-7 sm:py-3.5">
                Kenali Instansi <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <Link to="/pendaftaran"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 sm:px-7 sm:py-3.5">
                Daftar Magang
              </Link>
            </div>
          </div>
        </Container>
        </div>
      </section>

      <SlideStack>
      {/* TENTANG INSTANSI */}
      <Slide id="tentang" no="01" className="bg-white pt-14 pb-28 min-h-[80svh] md:pt-20 md:pb-36">
        <Container max="max-w-7xl max-lg:max-w-xl" className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr_1fr]">
          <Sticker kind="sparkle" rotate={12} className="top-0 right-4" />
          <Reveal className="max-md:text-center">
            <Eyebrow>Tentang Instansi</Eyebrow>
            <h2 className="text-2xl leading-tight font-semibold text-brand-900 sm:text-3xl lg:text-4xl">Mengenal Lebih Dekat BKPSDM Kota Yogyakarta</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kota Yogyakarta merupakan instansi yang bertugas dalam pengelolaan kepegawaian, pengembangan kompetensi, dan peningkatan kualitas sumber daya manusia di lingkungan pemerintah daerah.
            </p>
            <a href="https://bkpsdm.jogjakota.go.id/" target="_blank" rel="noopener noreferrer"
              className="group mt-5 inline-flex items-center gap-2 rounded-full border border-brand-900 px-6 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white">
              Selengkapnya <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>

          <Reveal delay={150} tilt={3} className="group aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <SafeImage src={FOTO_GEDUNG} alt="Maskot ASN BKPSDM di depan gedung" className="h-full w-full object-cover object-[50%_center] transition-transform duration-700 ease-out group-hover:scale-105" />
          </Reveal>

          <Reveal as="ul" delay={300} tilt={-2} className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            {tentangMenu.map((m, i) => (
              <Reveal as="li" variant="slide" delay={450 + i * 110} key={m.title}>
                <a href={m.href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-5 py-4 transition hover:bg-brand-50">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon name={m.icon} className="h-6 w-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold text-brand-900">{m.title}</span>
                    <span className="block text-sm text-slate-500">{m.desc}</span>
                  </span>
                  <Icon name="chevronRight" className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Reveal>
            ))}
          </Reveal>
        </Container>
      </Slide>

      {/* PROGRAM MAGANG */}
      <Slide id="program" no="02" className="bg-brand-50 pt-14 pb-28 min-h-[66svh] md:pt-16 md:pb-32">
        <Container max="max-w-7xl max-lg:max-w-xl" className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          <Sticker kind="bolt" rotate={-10} className="-top-4 right-6" />
          <Reveal className="max-md:text-center">
            <Eyebrow>Program Magang</Eyebrow>
            <h2 className="text-2xl font-semibold text-brand-900 sm:text-3xl">Informasi Program Magang</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Program magang di BKPSDM Kota Yogyakarta memberikan kesempatan bagi pelajar dan mahasiswa untuk belajar langsung di lingkungan kerja profesional, mengembangkan kompetensi, dan menerapkan ilmu yang telah dipelajari. Kuota formasi dihitung per orang (ketua dan anggota kelompok) dari pendaftar yang sudah diterima.
            </p>
            <Link to="/info-kuota"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Cek Kuota Formasi <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {infoProgram.map((i, n) => (
              <InfoItem key={i.label} icon={i.icon} label={i.label} n={n}>
                <p className="mt-1 text-sm leading-snug text-slate-500">{i.value}</p>
              </InfoItem>
            ))}
            <InfoItem icon="briefcase" label="Formasi yang Tersedia" n={infoProgram.length}>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm leading-snug text-slate-500 marker:text-brand-500 max-md:mx-auto max-md:w-fit max-md:text-left">
                {bidangGagal && <li className="list-none -ml-4">Daftar formasi belum bisa dimuat. Lihat di halaman Info Kuota.</li>}
                {bidang === null && !bidangGagal && <li className="list-none -ml-4">Memuat formasi…</li>}
                {bidang !== null && daftarBidang.length === 0 && <li className="list-none -ml-4">Saat ini semua formasi sedang penuh atau ditutup.</li>}
                {daftarBidang.slice(0, MAKS_FORMASI_TAMPIL).map((b) => <li key={b}>{b}</li>)}
                {sisaBidang > 0 && <li>+{sisaBidang} formasi lainnya</li>}
              </ul>
            </InfoItem>
          </div>
        </Container>
      </Slide>

      {/* PERSYARATAN */}
      <Slide no="03" className="bg-white pt-14 pb-28 min-h-[80svh] md:pt-20 md:pb-36">
        {/* Karakter mahasiswi di kanan: berdiri dari dasar section (dipotong di tepi section, bagian bawahnya tertutup map berikutnya) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-[inherit] lg:block">
          <div className="relative mx-auto h-full max-w-7xl px-6">
            <div className="absolute right-14 bottom-6 h-[85%]">
              <img src={FOTO_MAHASISWI} alt="" loading="lazy" decoding="async" className="h-full w-auto" />
              {/* awan pikiran */}
              <div className="absolute top-[3%] right-[82%] w-48 xl:w-56">
                <div className="relative rounded-[2rem] border-[1.5px] border-brand-900 bg-white px-5 py-4 text-center shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                  <p className="font-script text-2xl leading-tight text-brand-900 xl:text-3xl">Syaratnya apa aja ya?</p>
                  <span className="absolute -right-2 -bottom-4 h-4 w-4 rounded-full border-[1.5px] border-brand-900 bg-white" />
                  <span className="absolute -right-6 -bottom-8 h-2.5 w-2.5 rounded-full border-[1.5px] border-brand-900 bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Container>
          <Sticker kind="heart" rotate={9} className="-top-6 left-[28rem]" />
          <Reveal className="max-w-xl max-lg:mx-auto max-md:text-center">
            <Eyebrow>Persyaratan</Eyebrow>
            <h2 className="text-2xl font-semibold text-brand-900 sm:text-3xl">Persyaratan Pendaftaran</h2>
            <p className="mt-2 text-base text-slate-600">
              Pastikan Anda memenuhi persyaratan berikut sebelum melakukan pendaftaran magang.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 text-base text-slate-700 max-md:mx-auto max-md:w-fit max-md:text-left sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-3">
              {persyaratan.map((p, i) => (
                <Reveal as="li" variant="slide" delay={250 + i * 110} key={p} className="flex items-center gap-2.5">
                  <span style={{ '--d': `${400 + i * 110}ms` }} className="pop-in flex shrink-0"><CheckCircle className="h-5 w-5 shrink-0 text-brand-500" /></span>{p}
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Slide>

      {/* ALUR PENDAFTARAN */}
      <Slide no="04" className="bg-brand-50 pt-14 pb-28 min-h-[66svh] md:pt-16 md:pb-32">
        <Container>
          <Sticker kind="sparkle" rotate={-14} className="-top-4 right-8" />
          <Reveal className="max-md:text-center">
          <Eyebrow>Alur Pendaftaran</Eyebrow>
          <h2 className="text-2xl font-semibold text-brand-900 sm:text-3xl">Mudah dan Terstruktur</h2>
          <p className="mt-2 text-base text-slate-600">
            Ikuti langkah-langkah berikut untuk mendaftar program magang di <span className="text-brand-500">BKPSDM Kota Yogyakarta</span>.
          </p>
          </Reveal>
          <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {alur.map(([judul, desc], i) => (
              <Reveal as="li" key={judul} delay={i * 120} tilt={i % 2 ? 3 : -3} className="max-md:text-center">
                <div className="flex items-center gap-2 max-md:justify-center">
                  <span style={{ '--d': `${i * 120 + 200}ms` }} className="pop-in flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white ring-4 ring-brand-500/15">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {i < alur.length - 1 && (
                    <span className="hidden flex-1 items-center gap-1 text-brand-200 lg:flex">
                      <span style={{ '--d': `${i * 120 + 450}ms` }} className="line-draw h-px flex-1 bg-brand-200" />
                      <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-brand-900">{judul}</p>
                <p className="mt-1 text-sm leading-snug text-slate-500 md:pr-2">{desc}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Slide>

      {/* CTA (versi ringkas) */}
      <Slide no="05" className="flex min-h-[42rem] flex-col justify-start bg-white pt-10 pb-[var(--pb,4.5rem)] md:min-h-[38rem] md:justify-end md:pb-[var(--pb,7rem)]" style={ruangFooter}>
        {/* Gambar berdiri di dasar section, di tengah, lapisan paling bawah, tanpa animasi sendiri (seperti gambar di section 3). Dasar gambar menempel di dasar section (bottom-0); bagian bawahnya tertutup map footer */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <img src={FOTO_DUO} alt="" loading="lazy" decoding="async" className="absolute bottom-0 left-1/2 h-[20rem] w-auto max-w-none -translate-x-1/2 sm:h-[22rem] md:h-[36rem]" />
        </div>
        <Container className="max-md:w-full md:absolute! md:inset-x-0 md:bottom-28">
          <Reveal className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-xl bg-brand-900 px-6 py-5 text-center sm:flex-row sm:items-center sm:text-left md:h-32 md:gap-5 md:px-8">
            <span className="float-y flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
              <Icon name="cap" className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">Siap Menjadi Bagian dari Kami?</h2>
              <p className="mt-1 text-sm text-slate-300">
                Daftarkan diri Anda sekarang dan raih pengalaman berharga bersama BKPSDM Kota Yogyakarta.
              </p>
            </div>
            <Link to="/pendaftaran"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600">
              <Icon name="userPlus" className="h-4 w-4" /> Daftar Magang <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </Container>
      </Slide>
        <Slide id="footer-slide" overlap="-mt-6 md:-mt-8" edge="border-brand-500" className="bg-brand-900 text-slate-300">
        <FooterBody />
      </Slide>
    </SlideStack>
    </div>
  )
}