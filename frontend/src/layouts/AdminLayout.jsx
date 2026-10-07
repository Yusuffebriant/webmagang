import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getAdmin, logout } from '../api/auth'
import { setNotice } from '../api/session'
import useIdleLogout from '../hooks/useIdleLogout'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

const itemCls = 'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition'

function Sidebar({ admin, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col bg-brand-900 text-slate-300">
      <div className="px-5 py-6">
        <Logo light />
        <p className="mt-3 text-[11px] font-semibold tracking-widest text-brand-200/70 uppercase">Panel Admin Magang</p>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Menu admin">
        <NavLink
          to="/admin" end onClick={onNavigate}
          className={({ isActive }) =>
            `${itemCls} ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <Icon name="grid" className="h-5 w-5" /> Dashboard
        </NavLink>

        <NavLink
          to="/admin/pendaftar" onClick={onNavigate}
          className={({ isActive }) =>
            `${itemCls} ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <Icon name="users" className="h-5 w-5" /> Data Pendaftar
        </NavLink>

        <NavLink
          to="/admin/kuota" onClick={onNavigate}
          className={({ isActive }) =>
            `${itemCls} ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <Icon name="briefcase" className="h-5 w-5" /> Kuota Magang
        </NavLink>
      </nav>

      <div className="m-3 rounded-xl bg-white/5 p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {(admin?.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{admin?.name ?? 'Admin'}</p>
            <p className="truncate text-xs text-slate-400">{admin?.email}</p>
          </div>
        </div>
        <button
          type="button" onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Icon name="logout" className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  )
}

function KonfirmasiKeluar({ memproses, onBatal, onYakin }) {
  useEffect(() => {
    const tekan = (e) => { if (e.key === 'Escape' && !memproses) onBatal() }
    document.addEventListener('keydown', tekan)
    return () => document.removeEventListener('keydown', tekan)
  }, [memproses, onBatal])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !memproses) onBatal() }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="judul-keluar" aria-describedby="isi-keluar"
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="px-6 pt-6 pb-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Icon name="logout" className="h-6 w-6" />
          </span>
          <h2 id="judul-keluar" className="mt-4 text-base font-bold text-brand-900">Yakin mau keluar?</h2>
          <p id="isi-keluar" className="mt-1.5 text-sm text-slate-500">
            Kamu akan keluar dari panel admin dan perlu login lagi untuk masuk kembali.
          </p>
        </div>
        <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onBatal} disabled={memproses} autoFocus
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-500 disabled:opacity-60">
            Batal
          </button>
          <button type="button" onClick={onYakin} disabled={memproses}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
            {memproses ? 'Keluar...' : 'Ya, Keluar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const admin = getAdmin()
  const [open, setOpen] = useState(false)
  const [tanyaKeluar, setTanyaKeluar] = useState(false)
  const [sedangKeluar, setSedangKeluar] = useState(false)

  const keluar = useCallback(
    async (pesan) => {
      if (pesan) setNotice(pesan)
      await logout()
      // Logout manual -> beranda publik; keluar otomatis (idle) -> login agar pesannya terbaca.
      navigate(pesan ? '/admin/login' : '/', { replace: true })
    },
    [navigate],
  )
  const habis = useCallback(() => keluar('Anda keluar otomatis karena tidak ada aktivitas selama 30 menit.'), [keluar])
  useIdleLogout(habis)

  const mintaKeluar = () => { setOpen(false); setTanyaKeluar(true) }
  const yakinKeluar = async () => {
    setSedangKeluar(true)
    try { await keluar() } finally { setSedangKeluar(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar admin={admin} onLogout={mintaKeluar} />
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link to="/admin" aria-label="Dashboard admin"><Logo /></Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu" className="rounded-lg p-2 text-brand-900">
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="relative h-full w-72 max-w-[85%]">
            <Sidebar admin={admin} onNavigate={() => setOpen(false)} onLogout={mintaKeluar} />
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu"
              className="absolute top-4 -right-12 rounded-full bg-white p-2 text-brand-900">
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {tanyaKeluar && <KonfirmasiKeluar memproses={sedangKeluar} onBatal={() => setTanyaKeluar(false)} onYakin={yakinKeluar} />}
    </div>
  )
}