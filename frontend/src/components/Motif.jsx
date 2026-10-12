import { useEffect, useRef, useState } from 'react'
import SafeImage from './SafeImage'

// Elemen desain yang dipakai bersama oleh Beranda dan halaman dalam (Info Kuota, Pendaftaran, Cek Status, Login),
// supaya semua halaman terasa satu keluarga: hero foto navy, "map arsip" dengan sudut membulat, eyebrow tulisan tangan, stiker, dan animasi Reveal.

export const FOTO_HERO = '/images/gedung_bkpsdm.jpeg'

export const Container = ({ className = '', max = 'max-w-7xl', children }) => (
  <div className={`pad-x relative z-10 mx-auto ${max} px-6 ${className}`}>{children}</div>
)

export const Eyebrow = ({ light = false, children }) => (
  <p className={`mb-1 -rotate-1 origin-left font-script text-2xl ${light ? 'text-brand-200' : 'text-brand-500'}`}>{children}</p>
)

// Stiker dekoratif: bentuk datar, outline 2px, miring seperti ditempel, bergoyang pelan. Warna memakai palet brand yang ada.
const STIKER = {
  sparkle: { d: 'M50 4 C54 30 70 46 96 50 C70 54 54 70 50 96 C46 70 30 54 4 50 C30 46 46 30 50 4 Z', fill: 'fill-brand-200' },
  bolt: { d: 'M58 4 L18 56 H46 L38 96 L82 40 H54 Z', fill: 'fill-brand-500' },
  heart: { d: 'M50 88 C10 60 6 30 28 20 C40 15 50 24 50 32 C50 24 60 15 72 20 C94 30 90 60 50 88 Z', fill: 'fill-brand-200' },
}
export function Sticker({ kind = 'sparkle', rotate = 10, className = '' }) {
  const k = STIKER[kind]
  const ref = useRef(null)
  const [show, setShow] = useState(false)

  // Muncul pelan saat sudah masuk layar (animasi di index.css), di-reset saat benar-benar keluar layar supaya muncul lagi di scroll berikutnya.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ioIn = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShow(true) }, { rootMargin: '0px 0px -12% 0px' })
    const ioOut = new IntersectionObserver(([e]) => { if (!e.isIntersecting) setShow(false) })
    ioIn.observe(el)
    ioOut.observe(el)
    return () => { ioIn.disconnect(); ioOut.disconnect() }
  }, [])

  // z-30: stiker selalu menimpa kartu/konten lain di sekitarnya (bukan tertimpa).
  return (
    <svg ref={ref} aria-hidden="true" viewBox="0 0 100 100" data-show={show ? 'true' : undefined}
      style={{ '--r': `${rotate}deg`, transform: `rotate(${rotate}deg)` }}
      className={`sticker pointer-events-none absolute z-30 hidden h-14 w-14 md:block ${className}`}>
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
export function Reveal({ as: Tag = 'div', delay = 0, tilt = 0, variant = 'sticker', className = '', children, ...rest }) {
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
      {...rest}
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
export function useHeroZoom() {
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

// Hero halaman dalam: foto gedung + lapisan navy seperti hero Beranda, tapi lebih pendek. Isi muncul berurutan (rise-in) dan ikut zoom saat di-scroll.
// Dasar hero memudar ke navy penuh supaya sudut atas <Sheet> pertama tidak menempel ke foto (sama seperti "laci" navy di Beranda).
export function PageHero({ eyebrow, title, children }) {
  const { sectionRef, innerRef } = useHeroZoom()
  return (
    <section ref={sectionRef} className="relative shrink-0 overflow-hidden bg-brand-900">
      <div ref={innerRef} className="relative will-change-transform">
        <SafeImage src={FOTO_HERO} className="absolute inset-0 h-full w-full object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/40" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-brand-900 from-45% to-transparent" />
        <Container className="pt-32 pb-24 md:pt-44 md:pb-32">
          <div className="max-w-3xl max-md:mx-auto max-md:text-center">
            {eyebrow && (
              <p style={{ '--d': '150ms' }} className="rise-in mb-2 -rotate-1 origin-left font-script text-3xl text-brand-200">{eyebrow}</p>
            )}
            <h1 style={{ '--d': '250ms' }} className="rise-in text-2xl leading-[1.15] font-semibold text-slate-100 sm:text-3xl md:text-4xl lg:text-5xl">
              {title}
            </h1>
            {children && (
              <p style={{ '--d': '420ms' }} className="rise-in mt-5 max-w-xl text-base leading-relaxed text-slate-100 max-md:mx-auto sm:text-lg">{children}</p>
            )}
          </div>
        </Container>
      </div>
    </section>
  )
}

// "Map arsip" statis untuk halaman dalam: bentuk sama seperti section Beranda (sudut atas membulat, garis navy 1.5px, bayangan lembut),
// naik menimpa bagian bawah elemen di atasnya. `first` = map pertama (menimpa hero), `tone` = 'white' | 'blue' (selang-seling seperti Beranda).
// Footer di bawahnya juga naik menimpa map terakhir, jadi tiap map memberi ruang kosong di bawah (pb-36).
export function Sheet({ tone = 'white', first = false, max = 'max-w-7xl', className = '', children }) {
  const bg = tone === 'blue' ? 'bg-brand-50' : 'bg-white'
  return (
    <section className={`relative flex-1 ${first ? '-mt-14 md:-mt-20' : '-mt-16 md:-mt-20'} ${bg} rounded-t-[2rem] border-x-[1.5px] border-t-[1.5px] border-brand-900 origin-bottom will-change-transform pt-14 pb-36 last:pb-32 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] md:rounded-t-[56px] md:pt-16 ${className}`}>
      {/* lapisan gelap saat tertimpa footer (dipakai PublicLayout) */}
      <div aria-hidden="true" data-recede className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-brand-900 opacity-0" />
      <Container max={max}>{children}</Container>
    </section>
  )
}

// ===== LACI ARSIP (dipakai Beranda dan Info Kuota) =====
// Hero bergeser naik seperti biasa. Setelah itu tiap section adalah map arsip yang menempel (sticky) di dalam laci:
// map yang baru ditarik naik masih rebah ke belakang (tepi atasnya tetap rapat dengan map di depannya) lalu tegak, sedangkan map di depannya ikut rebah ke belakang
// (sedikit mengecil dan menggelap) saat tertimpa. Map yang lebih tinggi dari layar menempel di dasar layar supaya
// isinya sempat terbaca. Transform dipasang pada div dalam (bukan pada <section> yang sticky), sehingga posisi yang
// dibaca untuk menghitung progres tidak terpengaruh transform sendiri. Per frame hanya `transform` + `opacity` yang berubah.
// Efek tumpukan/miring saat scroll dimatikan di HP (< 768px) dan bagi yang meminta animasi dikurangi: di layar kecil efek ini membuat section melompat & menimpa isi.
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

export function SlideStack({ className = '', watch, children }) {
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
      const dasar = slides.map((el) => el.getBoundingClientRect().bottom)
      slides.forEach((el, i) => {
        // Map terakhir (footer) lebih pendek dari layar sehingga tepi atasnya tak pernah mencapai 0: tanpa koreksi ini ia tetap miring saat
        // halaman sudah di dasar dan tepi bawahnya terangkat beberapa px (menyisakan garis map di belakang). Maka ia dianggap tegak begitu dasarnya menyentuh dasar layar.
        const posisi = i === slides.length - 1 ? Math.min(own[i], dasar[i] - vh) : own[i]
        const q = clamp01(posisi / (vh * 0.85)) // 1 = map baru muncul dari bawah, 0 = sudah tegak
        const p = clamp01(1 - nxt[i] / vh) // 0 = belum tertimpa, 1 = tertimpa penuh (map di bawah footer hanya mengecil sebagian, sesuai tinggi footer)
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
  }, [watch]) // `watch`: ubah nilainya bila jumlah map berubah (mis. map yang muncul bersyarat) agar daftar map dibaca ulang

  // pt-10 = ruang di bawah hero supaya sudut atas map 01 tidak menempel ke foto hero.
  // Lapisan navy = bagian dalam laci: mengisi ruang itu (menyatu dengan hero), sudut atas map 01, dan sisi map saat mengecil.
  return (
    <div ref={ref} className={`relative z-10 shrink-0 overflow-x-clip pt-10 ${className}`}>
      <div aria-hidden="true" className="absolute inset-0 bg-brand-900" />
      {children}
    </div>
  )
}

// `lift` (hanya map pertama) = margin negatif agar map naik menimpa bawah hero tanpa menaikkan lapisan navy tumpukan (yang akan memotong foto hero).
// Map ke-2 dst. dinaikkan (margin negatif) sehingga menimpa bagian bawah map sebelumnya sejak awal: tepi bawah map di belakang
// tidak pernah terlihat sebagai potongan lurus, dan sudut atas membulat map di depan jatuh di atas kertas map sebelumnya.
export function Slide({ no, first = no === '01', lift = '', overlap = '-mt-16 md:-mt-20', edge = 'border-brand-900', className = '', children, ...rest }) {
  return (
    <section {...rest} className={`${REDUCED ? 'relative' : 'sticky'} ${first ? lift : overlap}`}>
      <div className="origin-top will-change-transform">
      <div className={`relative origin-bottom will-change-transform rounded-t-[2rem] border-x-[1.5px] border-t-[1.5px] ${edge} shadow-[0_-2px_20px_rgba(0,0,0,0.06)] md:rounded-t-[56px] ${className}`}>
        {/* lapisan gelap saat tertimpa map berikutnya (elemen pertama, dipakai SlideStack) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-brand-900 opacity-0" />
        {children}
      </div>
      </div>
    </section>
  )
}