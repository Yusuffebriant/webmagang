import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Beranda from '../pages/public/Beranda'
import Pendaftaran from '../pages/public/pendaftaran'
import CekStatus from '../pages/public/CekStatus'

export const router = createBrowserRouter([
    {
        element: <PublicLayout />,
        children: [
            { path: '/', element: <Beranda /> },
            { path: '/pendaftaran', element: <Pendaftaran /> },
            { path: '/cek-status', element: <CekStatus /> },
        ],
    },
    // TODO: /admin/login, /admin/*
])