// Penyimpanan sesi admin.
// Pakai sessionStorage (BUKAN localStorage): sesi hilang otomatis saat tab/browser ditutup,
// jadi laptop yang dipinjam orang lain tidak langsung masuk ke panel admin.

export const TOKEN_KEY = 'admin_token'
export const USER_KEY = 'admin_user'
const AKTIF_KEY = 'admin_last_active'
const NOTICE_KEY = 'admin_notice'

// Batas tanpa aktivitas sebelum otomatis logout.
export const BATAS_IDLE_MS = 30 * 60 * 1000

export const getToken = () => sessionStorage.getItem(TOKEN_KEY)

export function getAdmin() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function simpanSesi(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  sentuhAktivitas()
}

export function hapusSesi() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(AKTIF_KEY)
}

// Versi lama aplikasi menyimpan token di localStorage (tidak pernah hilang).
// Dibersihkan di sini; token lama dikembalikan supaya bisa dicabut di server.
export function hapusSesiLama() {
  const token = localStorage.getItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  return token
}

export const sentuhAktivitas = () => sessionStorage.setItem(AKTIF_KEY, String(Date.now()))

export function sesiMasihValid() {
  if (!getToken()) return false
  const terakhir = Number(sessionStorage.getItem(AKTIF_KEY))
  return Boolean(terakhir) && Date.now() - terakhir < BATAS_IDLE_MS
}

export const terakhirAktif = () => Number(sessionStorage.getItem(AKTIF_KEY)) || Date.now()

// Pesan singkat yang ditampilkan di halaman login (mis. "sesi berakhir").
export const setNotice = (msg) => sessionStorage.setItem(NOTICE_KEY, msg)
export const getNotice = () => sessionStorage.getItem(NOTICE_KEY)
export const hapusNotice = () => sessionStorage.removeItem(NOTICE_KEY)