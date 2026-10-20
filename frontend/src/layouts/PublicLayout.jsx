import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Efek tumpukan/miring saat scroll dimatikan di HP (< 768px) dan bagi yang meminta animasi dikurangi: di layar kecil efek ini membuat section melompat & menimpa isi.
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

export default function PublicLayout() {
  // Navbar melayang (fixed) menimpa konten. Beranda dan halaman dalam sama-sama dimulai dari hero foto navy (tiap halaman memasangnya sendiri).
  // Beranda membawa footer sendiri sebagai map terakhir di tumpukan; halaman dalam memakai Footer yang naik menimpa map terakhir.
  const { pathname } = useLocation()
  const beranda = ['/', '/info-kuota', '/pendaftaran', '/cek-status'].includes(pathname) // halaman bertumpuk: membawa footer sendiri sebagai map terakhir
  const rootRef = useRef(null)
  const mainRef = useRef(null)

  // Seperti di Beranda: map terakhir ikut "rebah" (sedikit mengecil dan menggelap) saat tertimpa footer.
  useEffect(() => {
    if (beranda || REDUCED) return
    const root = rootRef.current
    const main = mainRef.current
    if (!root || !main) return
    let raf = 0
    let last = null

    const update = () => {
      raf = 0
      const foot = root.querySelector(':scope > footer')
      const sheet = main.lastElementChild
      if (last && last !== sheet) { last.style.transform = ''; const o = last.querySelector(':scope > [data-recede]'); if (o) o.style.opacity = '0' }
      last = sheet
      if (!foot || !sheet || sheet.tagName !== 'SECTION') return
      const vh = window.innerHeight || 1
      const p = clamp01(1 - foot.getBoundingClientRect().top / vh)
      sheet.style.transform = p ? `perspective(1800px) rotateX(${(5 * p).toFixed(2)}deg) scale(${(1 - 0.05 * p).toFixed(4)})` : ''
      const o = sheet.querySelector(':scope > [data-recede]')
      if (o) o.style.opacity = String(p * 0.2)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update) }

    const ro = new ResizeObserver(kick)
    ro.observe(main)
    update()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', kick)
      if (raf) cancelAnimationFrame(raf)
      if (last) { last.style.transform = ''; const o = last.querySelector(':scope > [data-recede]'); if (o) o.style.opacity = '0' }
    }
  }, [beranda, pathname])

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <Navbar />
      {/* bg navy = bagian dalam laci (terlihat di sisi map saat mengecil), sama seperti Beranda */}
      <main ref={mainRef} className={`flex-1 ${beranda ? '' : 'flex flex-col overflow-x-clip bg-brand-900'}`}><Outlet /></main>
      {!beranda && <Footer className="-mt-16 md:-mt-20" />}
    </div>
  )
}