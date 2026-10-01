import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Beranda from '../pages/public/Beranda'

export const router = createBrowserRouter([
    {
        element: <PublicLayout />,
        children: [
            { path: '/', element: <Beranda /> },
            // TODO: /pendaftaran, /cek-status
        ],
    },
    // TODO: /admin/login, /admin/*
])