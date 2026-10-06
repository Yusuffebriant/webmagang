import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { navLinks } from './Navbar'

const socials = [
  { name: 'instagram', label: 'Instagram', href: '#' },
  { name: 'youtube', label: 'YouTube', href: '#' },
  { name: 'globe', label: 'Website', href: '#' },
]

// Isi footer; dipakai sebagai map terakhir di dalam tumpukan Beranda, dan oleh Footer mandiri di bawah untuk halaman lain.
export function FooterBody() {
  return (
  <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <Logo light />
      <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm" aria-label="Menu footer">
        {navLinks.map((l, i) =>
          l.to ? (
            <Link key={l.label} to={l.to} className={i === 0 ? 'text-brand-500' : 'hover:text-white'}>{l.label}</Link>
          ) : (
            <a key={l.label} href={l.href} className="hover:text-white">{l.label}</a>
          )
        )}
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
      <p>© {new Date().getFullYear()} BKPSDM Kota Yogyakarta. All rights reserved.</p>
      <p className="text-slate-300">Melayani dengan Profesional, Membangun SDM Unggul</p>
    </div>
  </div>
  )
}

const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Footer = map arsip terakhir (tanpa tab, biru awal): bentuk sama seperti section di Beranda, dan ikut "ditarik" dari laci
// (rebah ke belakang dengan tepi atas tetap rapat, lalu tegak) saat masuk layar.
export default function Footer() {
  const ref = useRef(null)
  const [shown, setShown] = useState(REDUCED)

  useEffect(() => {
    const el = ref.current
    if (!el || REDUCED) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <footer
      ref={ref}
      style={{
        transform: shown ? 'none' : 'perspective(1800px) rotateX(-7deg)',
        transition: REDUCED ? 'none' : 'transform 800ms cubic-bezier(0.34, 1.4, 0.64, 1)',
      }}
      className="relative z-20 origin-top rounded-t-[32px] border-x-[1.5px] border-t-[1.5px] border-brand-500 bg-brand-900 text-slate-300 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] md:rounded-t-[56px]"
    >
      <FooterBody />
    </footer>
  )
}