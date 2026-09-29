import { createBrowserRouter } from 'react-router-dom'
import Beranda from '../pages/public/Beranda'

export const router = createBrowserRouter([
    { path: '/', element: <Beranda /> },
])