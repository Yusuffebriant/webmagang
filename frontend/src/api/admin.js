import api from './client'

// GET /api/admin/dashboard
// -> { total, menunggu, diverifikasi, diterima, ditolak, terbaru: [{id, nomor_pendaftaran, nama_lengkap, status, created_at}] }
export async function getDashboard(signal) {
  const { data } = await api.get('/admin/dashboard', { signal })
  return data
}

// Unduh file dari endpoint admin (respons blob) dan simpan lewat browser
async function unduhBerkas(url, params, namaCadangan) {
  const res = await api.get(url, { params, responseType: 'blob' })
  const cd = res.headers['content-disposition'] ?? ''
  const nama = /filename="?([^";]+)"?/i.exec(cd)?.[1] ?? namaCadangan
  const href = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = href
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

// GET /api/admin/pendaftar/export  ->  file .xlsx
export function unduhPendaftar() {
  return unduhBerkas('/admin/pendaftar/export', undefined, 'data-pendaftar.xlsx')
}

// GET /api/admin/pendaftar/export-data-diri?status=&search=  ->  file .xlsx (data diri lengkap, ikut filter)
export function unduhDataDiriPendaftar({ status, search } = {}) {
  return unduhBerkas('/admin/pendaftar/export-data-diri', { status: status || undefined, search: search || undefined }, 'data-diri-pendaftar.xlsx')
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

// PATCH /api/admin/pendaftar/{id}  (data diri + pendidikan ketua, periode, dan anggota[{id,...}]) -> detail terbaru
export async function ubahDataPendaftar(id, payload) {
  const { data } = await api.patch(`/admin/pendaftar/${id}`, payload)
  return data.data ?? data
}

// PUT /api/admin/pendaftar/{id}/hasil  { nilai_akhir, hasil_magang, anggota: [{id, nilai_akhir, hasil_magang}] }
// Hanya untuk status 'diterima'. -> detail terbaru
export async function simpanHasilMagang(id, payload) {
  const { data } = await api.put(`/admin/pendaftar/${id}/hasil`, payload)
  return data.data ?? data
}

// POST /api/admin/pendaftar/{id}/foto  (multipart: foto, anggota_id?) -> detail terbaru. Tambah/ganti foto ketua atau anggota.
export async function unggahFotoPendaftar(id, file, anggotaId) {
  const form = new FormData()
  form.append('foto', file)
  if (anggotaId) form.append('anggota_id', anggotaId)
  const { data } = await api.post(`/admin/pendaftar/${id}/foto`, form)
  return data.data ?? data
}

// GET /api/admin/kuota -> [{ id, nama_bidang, deskripsi|null, status, kuota|null, terisi, sisa|null, total_pendaftar }]
export async function getKuota(signal) {
  const { data } = await api.get('/admin/kuota', { signal })
  return data.data ?? data
}

// PATCH /api/admin/kuota/{id}  { nama_bidang, deskripsi?, kuota: number|null }  -> bidang terbaru
export async function editBidang(id, payload) {
  const { data } = await api.patch(`/admin/kuota/${id}`, payload)
  return data.data ?? data
}

// Alias untuk Kuota.jsx. Menerima payload objek { nama_bidang, deskripsi, kuota }
// atau langsung angka kuota (number | null).
export async function ubahKuota(id, payload) {
  const body =
    payload !== null && typeof payload === 'object' ? payload : { kuota: payload }
  return editBidang(id, body)
}

// POST /api/admin/bidang  { nama_bidang, deskripsi?, kuota? }  -> bidang baru (status aktif)
export async function tambahBidang(payload) {
  const { data } = await api.post('/admin/bidang', payload)
  return data.data ?? data
}

// DELETE /api/admin/bidang/{id}  -> hanya berhasil jika bidang belum punya pendaftar
export async function hapusBidang(id) {
  const { data } = await api.delete(`/admin/bidang/${id}`)
  return data
}

// ===== Sertifikat =====

// GET /api/admin/pendaftar/{id}/sertifikat -> { pengaturan, sertifikat: [...] }. Hanya untuk status 'diterima';
// nomor sertifikat dibuat otomatis saat pertama kali dipanggil.
export async function getSertifikatPendaftar(id) {
  const { data } = await api.get(`/admin/pendaftar/${id}/sertifikat`)
  return data.data ?? data
}

// PATCH /api/admin/sertifikat/{id}  { nomor, nama?, instansi?, periode_mulai?, periode_selesai?, tanggal_terbit? }
// Field kosong/null = kembali otomatis mengikuti data pendaftar.
export async function ubahSertifikat(id, payload) {
  const { data } = await api.patch(`/admin/sertifikat/${id}`, payload)
  return data.data ?? data
}

// GET /api/admin/sertifikat/pengaturan -> { data: {...pengaturan}, bawaan: {...} }
export async function getPengaturanSertifikat(signal) {
  const { data } = await api.get('/admin/sertifikat/pengaturan', { signal })
  return data
}

// PUT /api/admin/sertifikat/pengaturan -> pengaturan terbaru
export async function simpanPengaturanSertifikat(payload) {
  const { data } = await api.put('/admin/sertifikat/pengaturan', payload)
  return data.data ?? data
}

// POST /api/admin/sertifikat/ttd (multipart: ttd) -> pengaturan terbaru (ttd_pejabat = data URL)
export async function unggahTtdSertifikat(file) {
  const form = new FormData()
  form.append('ttd', file)
  const { data } = await api.post('/admin/sertifikat/ttd', form)
  return data.data ?? data
}

// DELETE /api/admin/sertifikat/ttd -> pengaturan terbaru
export async function hapusTtdSertifikat() {
  const { data } = await api.delete('/admin/sertifikat/ttd')
  return data.data ?? data
}