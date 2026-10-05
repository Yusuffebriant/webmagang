import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { navLinks } from './Navbar'

const socials = [
  { name: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/bkpsdmkotayk/' },
  { name: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@bkpsdmkotajogja9527' },
  { name: 'globe', label: 'Website', href: 'https://bkpsdm.jogjakota.go.id/' },
]

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-slate-300">
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
          <p>© {new Date().getFullYear()} BY. UNIVERSITAS DUTA BANGSA SURAKARTA - BKPSDM Kota Yogyakarta. All rights reserved.</p>
          <p className="text-slate-300">Melayani dengan Profesional, Membangun SDM Unggul</p>
        </div>
      </div>
    </footer>
  )
}