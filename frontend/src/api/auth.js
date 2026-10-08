import api from './client'
import { getToken, getAdmin, simpanSesi, hapusSesi, hapusSesiLama } from './session'

export { getToken, getAdmin }

const bearer = (t) => ({ headers: { Authorization: `Bearer ${t}` } })

// POST /api/admin/login  ->  { user: {id, name, email}, token }
export async function login(email, password) {
  const { data } = await api.post('/admin/login', { email, password })
  simpanSesi(data.token, data.user)
  return data.user
}

// POST /api/admin/logout  (token dihapus di server, lalu bersihkan di browser)
export async function logout() {
  const token = getToken()
  hapusSesi()
  if (!token) return
  try {
    await api.post('/admin/logout', null, bearer(token))
  } catch {
    // token mungkin sudah kedaluwarsa/dihapus; sesi lokal sudah bersih
  }
}

// Dipanggil saat halaman login dibuka: sesi lama (sessionStorage maupun sisa
// localStorage versi lama) dihapus & dicabut di server, jadi login selalu minta password.
export function akhiriSesiSekarang() {
  const token = getToken()
  const lama = hapusSesiLama()
  hapusSesi()
  ;[token, lama].filter(Boolean).forEach((t) => {
    api.post('/admin/logout', null, bearer(t)).catch(() => {})
  })
}