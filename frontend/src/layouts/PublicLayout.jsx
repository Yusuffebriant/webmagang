import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function PublicLayout() {
  // Navbar melayang (fixed) menimpa konten. Beranda memang dimulai dari hero foto, halaman lain perlu ruang di atasnya.
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className={`flex-1 ${pathname === '/' ? '' : 'pt-28'}`}><Outlet /></main>
    </div>
  )
}