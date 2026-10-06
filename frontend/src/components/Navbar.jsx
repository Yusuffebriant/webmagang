import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'

export const navLinks = [
  { label: 'Beranda', to: '/', end: true },
  { label: 'Tentang Instansi', href: '/#tentang' },
  { label: 'Program Magang', href: '/#program' },
  { label: 'Pendaftaran', to: '/pendaftaran' },
  { label: 'Cek Status', to: '/cek-status' },
]

// Posisi (dari atas dokumen) tempat section berada saat tidak menempel.
// Section di Beranda bersifat `position: sticky`, jadi getBoundingClientRect/scrollIntoView memberi posisi saat
// menempel (sudah di layar) dan klik menu terasa "tidak bergerak". Posisi aslinya dihitung dari urutan section di dalam tumpukan.
// Section dihentikan 96px (6rem) di bawah tepi atas layar: di bawah navbar, dengan tepi map sebelumnya masih mengintip di atasnya.
const SECTION_OFFSET = 96
function sectionTop(el) {
  if (getComputedStyle(el).position !== 'sticky') {
    return el.getBoundingClientRect().top + window.scrollY - SECTION_OFFSET
  }
  const root = el.parentElement
  let top = root.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(root).paddingTop)
  for (const slide of Array.from(root.children).filter((c) => c.tagName === 'SECTION')) {
    top += parseFloat(getComputedStyle(slide).marginTop) || 0
    if (slide === el) break
    top += slide.offsetHeight
  }
  return top - SECTION_OFFSET
}

const base = 'rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors'
const idle = 'text-slate-300 hover:text-white'
const active = 'bg-white/10 text-white'

// Navbar kapsul melayang: menempel di atas layar, kaca gelap transparan.
// Saat halaman sedang di-scroll (naik/turun) navbar bergeser keluar ke atas layar;
// berhenti scroll -> turun kembali ke posisi normal.
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const timer = useRef(null)
  const { pathname, hash, key } = useLocation()
  const prevPath = useRef(null)
  // Sembunyi hanya saat scroll berlangsung, dan tidak saat menu seluler sedang dibuka.
  const hidden = scrolling && !open

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      setScrolling(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setScrolling(false), 200)
    }
    setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer.current)
    }
  }, [])

  // Setiap kali menu ditekan (termasuk menu yang sama berulang kali): gulir ke section tujuan,
  // atau ke paling atas bila tujuannya halaman/Beranda tanpa #section.
  useEffect(() => {
    const first = prevPath.current === null
    const samePage = prevPath.current === pathname
    prevPath.current = pathname
    const id = decodeURIComponent(hash.slice(1))
    if (!id && first) return // buka halaman biasa: biarkan browser memulihkan posisi scroll
    let r2
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        const el = id ? document.getElementById(id) : null
        if (id && !el) return
        window.scrollTo({ top: el ? Math.max(0, sectionTop(el)) : 0, behavior: first || !samePage ? 'auto' : 'smooth' })
      })
    })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [key, pathname, hash])

  return (
    <header className="nav-drop fixed inset-x-0 top-3 z-50 px-4 font-geist md:top-4">
      <div
        style={{ transform: hidden ? 'translateY(-170%)' : 'translateY(0)' }}
        aria-hidden={hidden}
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 py-2 pr-2 pl-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-[transform,background-color] duration-300 ease-out ${
          scrolled || open ? 'bg-brand-900/90' : 'bg-brand-900/60'
        }`}
      >
        <Link to="/" aria-label="Beranda BKPSDM" className="shrink-0"><Logo light compact /></Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu utama">
          {navLinks.map((l) =>
            l.to ? (
              <NavLink key={l.label} to={l.to} end={l.end}
                className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
                {l.label}
              </NavLink>
            ) : (
              <Link key={l.label} to={l.href} className={`${base} ${idle}`}>{l.label}</Link>
            )
          )}
        </nav>

        <Link to="/admin/login"
          className="hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-100 lg:inline-flex">
          <Icon name="user" className="h-4 w-4" /> Login Admin
        </Link>

        <button type="button" onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
          aria-label="Buka menu" aria-expanded={open}>
          <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <nav className="mx-auto mt-2 max-w-6xl rounded-3xl border border-white/10 bg-brand-900/90 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden" aria-label="Menu seluler">
          {navLinks.map((l) => (
            <Link key={l.label} to={l.href ?? l.to} onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </Link>
          ))}
          <Link to="/admin/login" onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-brand-900">
            <Icon name="user" className="h-4 w-4" /> Login Admin
          </Link>
        </nav>
      )}
    </header>
  )
}