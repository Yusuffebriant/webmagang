import { useState } from 'react'

// Menampilkan gambar; kalau file belum ada, tampilkan fallback (default: kosong).
export default function SafeImage({ src, alt = '', className = '', fallback = null }) {
  const [broken, setBroken] = useState(false)
  if (broken) return fallback
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />
}