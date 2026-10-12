import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { navbarLinks } from './Navbar'

const socials = [
  { name: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/bkpsdmkotayk/' },
  { name: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@bkpsdmkotajogja9527' },
  { name: 'globe', label: 'Website', href: 'https://bkpsdm.jogjakota.go.id/' },
]

// Data kontak footer: ubah di sini bila ada perubahan alamat/email.
const kontak = {
  alamat: 'Jl. Kenari No. 56, Muja Muju, Umbulharjo, Kota Yogyakarta, DIY 55165',
  email: 'bkpsdm@jogjakota.go.id',
  website: 'bkpsdm.jogjakota.go.id',
  websiteHref: 'https://bkpsdm.jogjakota.go.id/',
}

function Judul({ children }) {
  return <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">{children}</h3>
}

// Isi footer; dipakai sebagai map terakhir di dalam tumpukan halaman, dan oleh Footer mandiri di bawah.
export function FooterBody() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-14 pb-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr]">
        {/* Identitas */}
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
            Portal pendaftaran magang Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kota Yogyakarta.
          </p>
          <div className="mt-6 flex gap-3">
            {socials.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-500">
                <Icon name={s.name} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Menu */}
        <nav aria-label="Menu footer">
          <Judul>Menu</Judul>
          <ul className="space-y-2.5 text-sm">
            {navbarLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to ?? l.href} className="inline-flex items-center gap-1.5 transition hover:text-white">
                  <Icon name="chevronRight" className="h-3.5 w-3.5 text-brand-500" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Kontak */}
        <div>
          <Judul>Hubungi Kami</Judul>
          <ul className="space-y-3.5 text-sm">
            <li className="flex gap-3">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>BKPSDM Kota Yogyakarta<br />{kontak.alamat}</span>
            </li>
            <li className="flex gap-3">
              <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <a href={`mailto:${kontak.email}`} className="transition hover:text-white">{kontak.email}</a>
            </li>
            <li className="flex gap-3">
              <Icon name="globe" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <a href={kontak.websiteHref} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">{kontak.website}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-between gap-2 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex-row">
        <p>© {new Date().getFullYear()} By. UNIVERSITAS DUTA BANGSA SURAKARTA - BKPSDM Kota Yogyakarta. All rights reserved.</p>
        <p className="text-slate-300">Melayani dengan Profesional, Membangun SDM Unggul</p>
      </div>
    </div>
  )
}

const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

// Footer halaman dalam = map arsip terakhir, persis seperti footer di Beranda: bentuk yang sama, dan kemiringannya (tepi atas tetap rapat,
// badan rebah ke belakang) dihitung dari posisi scroll dengan rumus yang sama seperti SlideStack di Beranda. Posisi dibaca dari <footer>
// luar (tidak ikut miring), sedangkan transform dipasang pada div dalam.
export default function Footer({ className = '' }) {
  const ref = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    if (REDUCED) return
    const el = ref.current
    const inner = innerRef.current
    if (!el || !inner) return
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight || 1
      const r = el.getBoundingClientRect()
      const q = clamp01(Math.min(r.top, r.bottom - vh) / (vh * 0.85)) // 1 = baru muncul dari bawah, 0 = tegak (juga tegak begitu dasar footer menyentuh dasar layar)
      inner.style.transform = q ? `perspective(1800px) rotateX(${(-7 * q).toFixed(2)}deg)` : ''
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update) }
    const ro = new ResizeObserver(kick)
    ro.observe(document.body)
    update()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', kick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <footer ref={ref} className={`relative z-20 ${className}`}>
      <div ref={innerRef} className="origin-top will-change-transform">
        <div className="relative origin-bottom will-change-transform rounded-t-[2rem] border-x-[1.5px] border-t-[1.5px] border-brand-500 bg-brand-900 text-slate-300 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] md:rounded-t-[56px]">
          <FooterBody />
        </div>
      </div>
    </footer>
  )
}