import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { navLinks } from './Navbar'

const socials = [
  { name: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/bkpsdmkotayk/' },
  { name: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@bkpsdmkotajogja9527' },
  { name: 'globe', label: 'Website', href: 'https://bkpsdm.jogjakota.go.id/' },
]

// Isi footer; dipakai sebagai map terakhir di dalam tumpukan Beranda, dan oleh Footer mandiri di bawah untuk halaman lain.
export function FooterBody() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <Logo light />
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm" aria-label="Menu footer">
          {navLinks.map((l, i) => (
            <Link key={l.label} to={l.to ?? l.href} className={i === 0 ? 'text-brand-500' : 'hover:text-white'}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-3">
          {socials.map((s) => (
            <a key={s.name} href={s.href} aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-500">
              <Icon name={s.name} className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-2 border-t border-white/10 pt-4 text-xs text-slate-400 sm:flex-row">
        <p>© {new Date().getFullYear()} BY. UNIVERSITAS DUTA BANGSA SURAKARTA - BKPSDM Kota Yogyakarta. All rights reserved.</p>
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
      const q = clamp01(el.getBoundingClientRect().top / (vh * 0.85)) // 1 = baru muncul dari bawah, 0 = tegak
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