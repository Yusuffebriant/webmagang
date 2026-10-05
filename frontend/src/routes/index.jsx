import { createBrowserRouter, redirect } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Beranda from '../pages/public/Beranda'
import Pendaftaran from '../pages/public/pendaftaran'
import CekStatus from '../pages/public/CekStatus'
import Login from '../pages/admin/Login'
import Dashboard from '../pages/admin/Dashboard'
import Pendaftar from '../pages/admin/Pendaftar'
import Kuota from '../pages/admin/Kuota'
import AdminLayout from '../layouts/AdminLayout'
import { akhiriSesiSekarang } from '../api/auth'
import { getToken, sesiMasihValid, setNotice } from '../api/session'

// Sesi masih valid -> langsung ke dashboard. Selain itu tampilkan form login
// (sisa sesi kedaluwarsa / token versi lama dibersihkan & dicabut di server).
const hanyaTamu = () => {
  if (sesiMasihValid()) return redirect('/admin')
  akhiriSesiSekarang()
  return null
}

// Halaman admin: wajib punya sesi yang masih valid (belum lewat batas tidak-aktif).
const wajibLogin = () => {
  if (sesiMasihValid()) return null
  const adaSesi = Boolean(getToken())
  akhiriSesiSekarang()
  if (adaSesi) setNotice('Sesi Anda berakhir karena tidak ada aktivitas. Silakan login kembali.')
  return redirect('/admin/login')
}

export const router = createBrowserRouter([
    {
        element: <PublicLayout />,
        children: [
            { path: '/', element: <Beranda /> },
            { path: '/pendaftaran', element: <Pendaftaran /> },
            { path: '/cek-status', element: <CekStatus /> },
        ],
    },
    { path: '/admin/login', element: <Login />, loader: hanyaTamu },
    {
        path: '/admin',
        element: <AdminLayout />,
        loader: wajibLogin,
        children: [
            { index: true, element: <Dashboard /> },
            { path: 'pendaftar', element: <Pendaftar /> },
            { path: 'kuota', element: <Kuota /> },
        ],
    },
])