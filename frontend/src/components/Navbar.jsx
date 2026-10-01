import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'

export const navLinks = [
  { label: 'Beranda', to: '/', end: true },
  { label: 'Tentang Instansi', href: '/#tentang' },
  { label: 'Program Magang', href: '/#program' },
  { label: 'Pendaftaran', to: '/pendaftaran' },
  { label: 'Cek Status', to: '/cek-status' },
]

const base = 'flex h-full items-center border-b-2 px-0.5 text-sm font-medium transition-colors'
const idle = 'border-transparent text-slate-600 hover:text-brand-500'
const active = 'border-brand-500 text-brand-500'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-6">
        <Logo />

        <nav className="hidden h-full items-center gap-8 md:flex" aria-label="Menu utama">
          {navLinks.map((l) =>
            l.to ? (
              <NavLink key={l.label} to={l.to} end={l.end}
                className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
                {l.label}
              </NavLink>
            ) : (
              <a key={l.label} href={l.href} className={`${base} ${idle}`}>{l.label}</a>
            )
          )}
        </nav>

        <Link to="/admin/login"
          className="hidden items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 md:inline-flex">
          <Icon name="user" className="h-4 w-4" /> Login Admin
        </Link>

        <button type="button" onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-brand-900 md:hidden" aria-label="Buka menu" aria-expanded={open}>
          <Icon name={open ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-100 bg-white px-6 py-3 md:hidden" aria-label="Menu seluler">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href ?? l.to} onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50">
              {l.label}
            </a>
          ))}
          <Link to="/admin/login" onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-500 hover:bg-brand-50">
            Login Admin
          </Link>
        </nav>
      )}
    </header>
  )
}