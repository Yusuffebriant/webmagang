import api from './client'

// GET /api/admin/dashboard
// -> { total, menunggu, diverifikasi, diterima, ditolak, terbaru: [{id, nomor_pendaftaran, nama_lengkap, status, created_at}] }
export async function getDashboard(signal) {
  const { data } = await api.get('/admin/dashboard', { signal })
  return data
}

// GET /api/admin/pendaftar/export  ->  file .xlsx
export async function unduhPendaftar() {
  const res = await api.get('/admin/pendaftar/export', { responseType: 'blob' })
  const cd = res.headers['content-disposition'] ?? ''
  const nama = /filename="?([^";]+)"?/i.exec(cd)?.[1] ?? 'data-pendaftar.xlsx'
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// GET /api/admin/pendaftar?status=&search=&page=  ->  { data: [...], links, meta }  (15 per halaman)
export async function getPendaftarList(params, signal) {
  const { data } = await api.get('/admin/pendaftar', { params, signal })
  return data
}

// GET /api/admin/pendaftar/{id}  ->  detail lengkap + dokumen
export async function getPendaftar(id, signal) {
  const { data } = await api.get(`/admin/pendaftar/${id}`, { signal })
  return data.data ?? data
}

// PATCH /api/admin/pendaftar/{id}/status  { status, catatan }
export async function ubahStatus(id, { status, catatan }) {
  const { data } = await api.patch(`/admin/pendaftar/${id}/status`, { status, catatan })
  return data.data ?? data
}

// POST /api/admin/pendaftar/{id}/loa  (multipart: loa) -> pendaftar terbaru. Hanya untuk status 'diverifikasi'.
export async function unggahLoa(id, file) {
  const form = new FormData()
  form.append('loa', file)
  const { data } = await api.post(`/admin/pendaftar/${id}/loa`, form)
  return data.data ?? data
}