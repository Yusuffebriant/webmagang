import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import Icon, { CheckCircle } from '../../components/Icon'
import SafeImage from '../../components/SafeImage'
import { FooterBody } from '../../components/Footer'

// Foto: taruh di public/images/ (hero-bkpsdm.jpg, gedung-bkpsdm.jpg, laptop.jpg). Kalau belum ada, tampil gradien.
const FOTO_HERO = '/images/gedung_bkpsdm.jpeg'
const FOTO_GEDUNG = '/images/gedung-bkpsdm.jpg'
const FOTO_LAPTOP = '/images/laptop.jpg'

const BIDANG_DEFAULT = ['Teknologi Informasi', 'Administrasi', 'Kepegawaian', 'Keuangan', 'Pelayanan']

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

const kapital = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)

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
  <p className="mb-1 -rotate-1 origin-left font-script text-2xl text-brand-500">{children}</p>
)

const Container = ({ className = '', children }) => (
  <div className={`relative z-10 mx-auto max-w-7xl px-6 ${className}`}>{children}</div>
)

// ===== LACI ARSIP =====
// Hero bergeser naik seperti biasa. Setelah itu tiap section adalah map arsip yang menempel (sticky) di dalam laci:
// map yang baru ditarik naik masih rebah ke belakang (tepi atasnya tetap rapat dengan map di depannya) lalu tegak, sedangkan map di depannya ikut rebah ke belakang
// (sedikit mengecil dan menggelap) saat tertimpa. Map yang lebih tinggi dari layar menempel di dasar layar supaya
// isinya sempat terbaca. Transform dipasang pada div dalam (bukan pada <section> yang sticky), sehingga posisi yang
// dibaca untuk menghitung progres tidak terpengaruh transform sendiri. Per frame hanya `transform` + `opacity` yang berubah.
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

function SlideStack({ children }) {
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (!root || REDUCED) return
    const slides = Array.from(root.querySelectorAll(':scope > section'))
    let raf = 0

    const measure = () => {
      const vh = window.innerHeight
      slides.forEach((el) => { el.style.top = `${Math.min(0, vh - el.offsetHeight)}px` })
    }
    const update = () => {
      raf = 0
      const vh = window.innerHeight || 1
      // baca semua posisi dulu, baru tulis style (tanpa layout thrashing)
      const own = slides.map((el) => el.getBoundingClientRect().top)
      const nxt = slides.map((el) => el.nextElementSibling?.getBoundingClientRect().top ?? vh)
      slides.forEach((el, i) => {
        const q = clamp01(own[i] / (vh * 0.85)) // 1 = map baru muncul dari bawah, 0 = sudah tegak
        const p = clamp01(1 - nxt[i] / vh) // 0 = belum tertimpa, 1 = tertimpa penuh
        const e = el.firstElementChild // lapisan luar: map baru ditarik (tepi atas tetap di tempat)
        const d = e.firstElementChild // lapisan dalam: map yang tertimpa (tepi bawah tetap di tempat)
        e.style.transform = q ? `perspective(1800px) rotateX(${(-7 * q).toFixed(2)}deg)` : ''
        d.style.transform = p ? `perspective(1800px) rotateX(${(5 * p).toFixed(2)}deg) scale(${(1 - 0.05 * p).toFixed(4)})` : ''
        d.firstElementChild.style.opacity = String(p * 0.2)
      })
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update) }
    const onResize = () => { measure(); kick() }

    const ro = new ResizeObserver(onResize)
    slides.forEach((el) => ro.observe(el))
    measure()
    update()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // pt-10 = ruang di bawah hero supaya sudut atas map 01 tidak menempel ke foto hero.
  // Lapisan navy = bagian dalam laci: mengisi ruang itu (menyatu dengan hero), sudut atas map 01, dan sisi map saat mengecil.
  return (
    <div ref={ref} className="relative z-10 overflow-x-clip pt-10">
      <div aria-hidden="true" className="absolute inset-0 bg-brand-900" />
      {children}
    </div>
  )
}

// Map ke-2 dst. dinaikkan (margin negatif) sehingga menimpa bagian bawah map sebelumnya sejak awal: tepi bawah map di belakang
// tidak pernah terlihat sebagai potongan lurus, dan sudut atas membulat map di depan jatuh di atas kertas map sebelumnya.
function Slide({ no, edge = 'border-brand-900', className = '', children, ...rest }) {
  return (
    <section {...rest} className={`${REDUCED ? 'relative' : 'sticky'} ${no === '01' ? '' : '-mt-16 md:-mt-20'}`}>
      <div className="origin-top will-change-transform">
      <div className={`relative origin-bottom will-change-transform rounded-t-[32px] border-x-[1.5px] border-t-[1.5px] ${edge} shadow-[0_-2px_20px_rgba(0,0,0,0.06)] md:rounded-t-[56px] ${className}`}>
        {/* lapisan gelap saat tertimpa map berikutnya (elemen pertama, dipakai SlideStack) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-brand-900 opacity-0" />
        {children}
      </div>
      </div>
    </section>
  )
}

// Stiker dekoratif: bentuk datar, outline 2px, miring seperti ditempel, bergoyang pelan. Warna memakai palet brand yang ada.
const STIKER = {
  sparkle: { d: 'M50 4 C54 30 70 46 96 50 C70 54 54 70 50 96 C46 70 30 54 4 50 C30 46 46 30 50 4 Z', fill: 'fill-brand-200' },
  bolt: { d: 'M58 4 L18 56 H46 L38 96 L82 40 H54 Z', fill: 'fill-brand-500' },
  heart: { d: 'M50 88 C10 60 6 30 28 20 C40 15 50 24 50 32 C50 24 60 15 72 20 C94 30 90 60 50 88 Z', fill: 'fill-brand-200' },
}
function Sticker({ kind = 'sparkle', rotate = 10, className = '' }) {
  const k = STIKER[kind]
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" style={{ '--r': `${rotate}deg`, transform: `rotate(${rotate}deg)` }}
      className={`sticker pointer-events-none absolute hidden h-14 w-14 md:block ${className}`}>
      <path d={k.d} strokeWidth="5" strokeLinejoin="round" className={`${k.fill} stroke-brand-900`} />
    </svg>
  )
}

// Efek "stiker ditempel": elemen muncul naik sambil sedikit miring (`tilt`, derajat), lalu mendarat lurus dengan sedikit membal.
// Animasi diulang setiap kali elemen masuk layar lagi (tampil saat masuk, di-reset saat sudah benar-benar keluar layar). `delay` dipakai untuk membuat urutan bergelombang.
// `variant`: 'sticker' (naik + miring + membal, bawaan) | 'slide' (geser dari kiri, untuk item daftar) | 'up' (naik halus, untuk kolom info).
// Saat tampil, elemen diberi data-show="true" -> dipakai CSS (.pop-in, .line-draw) untuk animasi anak di dalamnya.
const HIDDEN = {
  sticker: (tilt) => `translateY(48px) rotate(${tilt}deg) scale(0.94)`,
  slide: () => 'translateX(-28px)',
  up: () => 'translateY(28px)',
}
function Reveal({ as: Tag = 'div', delay = 0, tilt = 0, variant = 'sticker', className = '', children }) {
  const ref = useRef(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    // tampil: saat elemen sudah masuk 12% dari tepi bawah layar
    const ioIn = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShow(true) }, { rootMargin: '0px 0px -12% 0px' })
    // reset: hanya saat elemen sudah sepenuhnya di luar layar (jeda dua ambang ini mencegah berkedip di tepi)
    const ioOut = new IntersectionObserver(([e]) => { if (!e.isIntersecting) setShow(false) })
    ioIn.observe(el)
    ioOut.observe(el)
    return () => { ioIn.disconnect(); ioOut.disconnect() }
  }, [reduced])

  const visible = reduced || show
  return (
    <Tag
      ref={ref}
      className={className}
      data-show={visible ? 'true' : undefined}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : HIDDEN[variant](tilt),
        transition: reduced || !visible ? 'none' : `opacity 700ms ease ${delay}ms, transform 800ms cubic-bezier(0.34, 1.4, 0.64, 1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  )
}

// Hero zoom: makin ke bawah di-scroll -> mengecil (zoom out), scroll balik ke atas -> membesar lagi (zoom in).
function useHeroZoom() {
  const sectionRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const section = sectionRef.current
    const inner = innerRef.current
    if (!section || !inner) return

    let raf = 0
    const update = () => {
      raf = 0
      const h = section.offsetHeight || 1
      const p = Math.min(Math.max(window.scrollY / h, 0), 1) // 0 = di hero, 1 = hero sudah lewat
      inner.style.transform = `scale(${1 - 0.15 * p})`
      inner.style.opacity = String(1 - 0.6 * p)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return { sectionRef, innerRef }
}

export default function Beranda() {
  const { sectionRef, innerRef } = useHeroZoom()
  const [program, setProgram] = useState(null)
  const [bidang, setBidang] = useState([])
  const [heroOn, setHeroOn] = useState(true) // false saat hero sudah di luar layar -> animasi masuk diputar ulang saat kembali

  useEffect(() => {
    let ignore = false
    Promise.allSettled([api.get('/public/program'), api.get('/public/bidang')]).then(([p, b]) => {
      if (ignore) return
      if (p.status === 'fulfilled') setProgram(p.value.data[0] ?? null)
      if (b.status === 'fulfilled') setBidang(b.value.data.map((x) => x.nama_bidang))
    })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setHeroOn(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [sectionRef])

  const daftarBidang = (bidang.length ? bidang : BIDANG_DEFAULT).map(kapital)

  const infoProgram = [
    { icon: 'calendar', label: 'Periode Magang', value: formatPeriode(program?.periode_mulai, program?.periode_selesai) },
    { icon: 'clock', label: 'Durasi', value: program?.durasi ? `Minimal ${program.durasi} bulan` : '-' },
    { icon: 'users', label: 'Peserta', value: 'Mahasiswa aktif' },
  ]

  return (
    <div>
      {/* HERO */}
      <section ref={sectionRef} className="relative overflow-hidden bg-brand-900">
        <div ref={innerRef} className="relative will-change-transform">
        <SafeImage src={FOTO_HERO} className="absolute inset-0 h-full w-full object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/75 to-brand-900/15" />
        <Container className="relative flex min-h-[560px] items-center py-20 md:min-h-[max(660px,100svh)]">
          <div className="max-w-4xl">
            <h1 style={{ '--d': '250ms' }} className={`${heroOn ? 'rise-in' : ''} text-3xl leading-[1.15] font-semibold text-slate-100 md:text-4xl lg:text-5xl`}>
              Selamat Datang di Program Magang <span className="text-brand-500">BKPSDM Kota Yogyakarta</span>
            </h1>
            <p style={{ '--d': '420ms' }} className={`${heroOn ? 'rise-in' : ''} mt-6 max-w-xl text-lg leading-relaxed text-slate-100`}>
              Kenali lebih dekat instansi kami, lingkungan kerja, serta kesempatan belajar yang tersedia bagi mahasiswa melalui program magang.
            </p>
            <div style={{ '--d': '580ms' }} className={`${heroOn ? 'rise-in' : ''} mt-9 flex flex-wrap gap-4`}>
              <a href="#tentang"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600">
                Kenali Instansi <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <Link to="/pendaftaran"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
                Daftar Magang
              </Link>
            </div>
          </div>
        </Container>
        </div>
      </section>

      <SlideStack>
      {/* TENTANG INSTANSI */}
      <Slide id="tentang" no="01" className="bg-white pt-20 pb-36 min-h-[80svh]">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr_1fr]">
          <Sticker kind="sparkle" rotate={12} className="top-0 right-4" />
          <Reveal>
            <Eyebrow>Tentang Instansi</Eyebrow>
            <h2 className="text-4xl leading-tight font-semibold text-brand-900">Mengenal Lebih Dekat BKPSDM</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kota Yogyakarta merupakan instansi yang bertugas dalam pengelolaan kepegawaian, pengembangan kompetensi, dan peningkatan kualitas sumber daya manusia di lingkungan pemerintah daerah.
            </p>
            <a href="https://bkpsdm.jogjakota.go.id/" target="_blank" rel="noopener noreferrer"
              className="group mt-5 inline-flex items-center gap-2 rounded-full border border-brand-900 px-6 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white">
              Selengkapnya <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>

          <Reveal delay={150} tilt={3} className="group aspect-[1.1] overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <SafeImage src={FOTO_GEDUNG} alt="Gedung BKPSDM" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
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
      <Slide id="program" no="02" className="bg-brand-50 pt-16 pb-32 min-h-[66svh]">
        <Container className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          <Sticker kind="bolt" rotate={-10} className="-top-4 right-6" />
          <Reveal>
            <Eyebrow>Program Magang</Eyebrow>
            <h2 className="text-3xl font-semibold text-brand-900">Informasi Program Magang</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Program magang di BKPSDM memberikan kesempatan bagi mahasiswa untuk belajar langsung di lingkungan kerja profesional, mengembangkan kompetensi, dan menerapkan ilmu yang telah dipelajari di bangku kuliah.
            </p>
            <a href="#program"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Lihat Detail Program <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {infoProgram.map((i, n) => (
              <Reveal variant="up" delay={200 + n * 130} key={i.label} className="group">
                <span style={{ '--d': `${350 + n * 130}ms` }} className="pop-in mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-500 shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6">
                  <Icon name={i.icon} className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-brand-900">{i.label}</p>
                <p className="mt-1 text-sm text-slate-500">{i.value}</p>
              </Reveal>
            ))}
            <Reveal variant="up" delay={200 + infoProgram.length * 130} className="group">
              <span style={{ '--d': `${350 + infoProgram.length * 130}ms` }} className="pop-in mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-500 shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6">
                <Icon name="briefcase" className="h-5 w-5" />
              </span>
              <p className="text-base font-semibold text-brand-900">Bidang yang Tersedia</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-500 marker:text-brand-500">
                {daftarBidang.slice(0, 5).map((b) => <li key={b}>{b}</li>)}
                <li>Bidang lainnya</li>
              </ul>
            </Reveal>
          </div>
        </Container>
      </Slide>

      {/* PERSYARATAN */}
      <Slide no="03" className="bg-white pt-20 pb-36 min-h-[80svh]">
        <Container className="grid items-center gap-8 lg:grid-cols-2">
          <Sticker kind="heart" rotate={9} className="-top-6 right-10" />
          <Reveal>
            <Eyebrow>Persyaratan</Eyebrow>
            <h2 className="text-3xl font-semibold text-brand-900">Persyaratan Pendaftaran</h2>
            <p className="mt-2 text-base text-slate-200">
              Pastikan Anda memenuhi persyaratan berikut sebelum melakukan pendaftaran magang.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 text-base text-slate-700 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-3">
              {persyaratan.map((p, i) => (
                <Reveal as="li" variant="slide" delay={250 + i * 110} key={p} className="flex items-center gap-2.5">
                  <span style={{ '--d': `${400 + i * 110}ms` }} className="pop-in flex shrink-0"><CheckCircle className="h-5 w-5 shrink-0 text-brand-500" /></span>{p}
                </Reveal>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={150} tilt={-3} className="relative h-72 md:h-80 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-brand-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <SafeImage src={FOTO_LAPTOP} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute right-8 bottom-8 -rotate-6 text-right">
              <p className="font-script text-4xl leading-[1.05] text-brand-900">Bersama<br />Membangun<br />Masa Depan</p>
              <span style={{ '--d': '700ms' }} className="line-draw mt-1 ml-auto block h-0.5 w-20 -rotate-3 rounded bg-brand-500" />
            </div>
          </Reveal>
        </Container>
      </Slide>

      {/* ALUR PENDAFTARAN */}
      <Slide no="04" className="bg-brand-50 pt-16 pb-32 min-h-[66svh]">
        <Container>
          <Sticker kind="sparkle" rotate={-14} className="-top-4 right-8" />
          <Reveal>
          <Eyebrow>Alur Pendaftaran</Eyebrow>
          <h2 className="text-3xl font-semibold text-brand-900">Mudah dan Terstruktur</h2>
          <p className="mt-2 text-base text-slate-600">
            Ikuti langkah-langkah berikut untuk mendaftar program magang di <span className="text-brand-500">BKPSDM</span>.
          </p>
          </Reveal>
          <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {alur.map(([judul, desc], i) => (
              <Reveal as="li" key={judul} delay={i * 120} tilt={i % 2 ? 3 : -3}>
                <div className="flex items-center gap-2">
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
                <p className="mt-1 pr-2 text-sm leading-snug text-slate-500">{desc}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Slide>

      {/* CTA */}
      <Slide no="05" className="bg-white pt-14 pb-28 min-h-[66svh]">
        <Container>
          <Reveal className="flex flex-col items-start gap-5 rounded-2xl bg-brand-900 px-10 py-10 sm:flex-row sm:items-center">
            <span className="float-y flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
              <Icon name="cap" className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white">Siap Menjadi Bagian dari Kami?</h2>
              <p className="mt-1 text-base text-slate-600">
                Daftarkan diri Anda sekarang dan raih pengalaman berharga bersama BKPSDM.
              </p>
            </div>
            <Link to="/pendaftaran"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600">
              <Icon name="userPlus" className="h-4 w-4" /> Daftar Magang <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </Container>
      </Slide>
        <Slide edge="border-brand-500" className="bg-brand-900 text-slate-300">
        <FooterBody />
      </Slide>
    </SlideStack>
    </div>
  )
}