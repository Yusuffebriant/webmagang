import { useEffect } from 'react'
import { BATAS_IDLE_MS, sentuhAktivitas, terakhirAktif } from '../api/session'

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

// Panggil onTimeout bila tidak ada aktivitas selama BATAS_IDLE_MS.
export default function useIdleLogout(onTimeout) {
  useEffect(() => {
    let terakhirCatat = 0
    const catat = () => {
      const now = Date.now()
      if (now - terakhirCatat > 1000) {
        terakhirCatat = now
        sentuhAktivitas()
      }
    }
    const cek = () => {
      if (Date.now() - terakhirAktif() >= BATAS_IDLE_MS) onTimeout()
    }

    sentuhAktivitas()
    EVENTS.forEach((e) => window.addEventListener(e, catat, { passive: true }))
    document.addEventListener('visibilitychange', cek) // laptop baru dibuka setelah sleep
    const timer = setInterval(cek, 15_000)

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, catat))
      document.removeEventListener('visibilitychange', cek)
      clearInterval(timer)
    }
  }, [onTimeout])
}