import axios from 'axios'
import { getToken, hapusSesi, setNotice } from './session'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Token ditolak server (dihapus / tidak valid) -> bersihkan sesi lalu kembali ke login.
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && getToken()) {
            hapusSesi()
            setNotice('Sesi Anda telah berakhir. Silakan login kembali.')
            window.location.replace('/admin/login')
        }
        return Promise.reject(err)
    },
)

export default api