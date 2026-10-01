import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Beranda from '../pages/public/Beranda'
import Pendaftaran from '../pages/public/pendaftaran'

export const router = createBrowserRouter([
    {
        element: <PublicLayout />,
        children: [
            { path: '/', element: <Beranda /> },
            { path: '/pendaftaran', element: <Pendaftaran /> },
            // TODO: /cek-status
        ],
    },
    // TODO: /admin/login, /admin/*
])