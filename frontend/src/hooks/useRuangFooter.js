import { useEffect, useState } from 'react'

// Ruang kosong di bawah map terakhir sebuah halaman bertumpuk, sebesar tinggi footer.
// Map yang lebih tinggi dari layar menempel di dasar layar dan footer naik menimpanya; tanpa ruang ini footer
// menutupi isi paling bawah sebelum user selesai membaca. Footer harus diberi id="footer-slide".
// Pakai: const ruangFooter = useRuangFooter(); lalu <Slide ... className="pb-[var(--pb,9rem)]" style={ruangFooter}>.
// `kunci` (opsional): ubah nilainya bila map footer dirender ulang sebagai elemen baru (mis. pindah tampilan).
const SELISIH = -32 // px relatif terhadap tinggi footer. Makin kecil = ruang kosong makin pendek, tapi footer mulai menutupi bagian bawah kartu.

export default function useRuangFooter(kunci) {
  const [tinggi, setTinggi] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches) return undefined // tanpa animasi tumpukan: tidak perlu ruang ekstra
    const el = document.getElementById('footer-slide')
    if (!el) return undefined
    const ukur = () => setTinggi(Math.round(el.offsetHeight))
    ukur()
    if (!('ResizeObserver' in window)) {
      window.addEventListener('resize', ukur)
      return () => window.removeEventListener('resize', ukur)
    }
    const ro = new ResizeObserver(ukur)
    ro.observe(el)
    return () => ro.disconnect()
  }, [kunci])

  return tinggi ? { '--pb': `${Math.max(0, tinggi + SELISIH)}px` } : undefined
}