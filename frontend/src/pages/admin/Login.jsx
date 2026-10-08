import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { getNotice, hapusNotice } from '../../api/session'
import Icon from '../../components/Icon'
import Logo from '../../components/Logo'
import SafeImage from '../../components/SafeImage'
import { Container, FOTO_HERO } from '../../components/Motif'

const FORMAT_EMAIL = /^\S+@\S+\.\S+$/

// Pesan bawaan Laravel berbahasa Inggris -> Indonesia
function terjemah(msg) {
  if (!msg) return msg
  if (/valid email/i.test(msg)) return 'Format email belum sesuai. Contoh: nama@email.com'
  if (/field is required/i.test(msg)) return 'Bagian ini wajib diisi.'
  return msg
}

// Menerjemahkan error backend menjadi pesan untuk form.
//  - 422: validasi / kredensial salah -> { errors: { email: [...], password: [...] } }
//  - 429: kena throttle (maks 5 percobaan per menit)
function bacaError(err) {
  const res = err.response
  if (!res) return { umum: 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.' }

  if (res.status === 422) {
    const e = res.data?.errors ?? {}
    return {
      email: terjemah(e.email?.[0]),
      password: terjemah(e.password?.[0]),
      umum: !e.email && !e.password ? terjemah(res.data?.message) : undefined,
    }
  }
  if (res.status === 429) return { umum: 'Terlalu banyak percobaan masuk. Tunggu 1 menit, lalu coba lagi.' }
  return { umum: 'Server sedang bermasalah. Coba lagi beberapa saat lagi.' }
}

const inputCls = (invalid, pr = 'pr-4') =>
  `block w-full rounded-xl border bg-brand-900/50 py-3.5 pl-11 ${pr} font-sans text-base font-medium text-white caret-white [color-scheme:dark] placeholder:text-base placeholder:font-normal placeholder:text-transparent focus:placeholder:text-white/60 outline-none transition focus:bg-brand-900/70 focus:ring-1 [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] ${
    invalid
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
      : 'border-white/40 hover:border-white/60 focus:border-brand-500 focus:ring-brand-500'
  }`

// Label mengambang: tampil sebagai hint di dalam kotak saat kosong; saat difokus / terisi naik ke atas kotak (di luar garis tepi).
const labelCls = 'pointer-events-none absolute -top-7 left-1 text-sm font-semibold text-white transition-all duration-300 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:left-11 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-200 peer-focus:-top-7 peer-focus:left-1 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:font-semibold peer-focus:text-brand-200'

// Kartu kaca tipis dengan garis tepi (dipakai untuk kartu judul dan kartu form)
const kartuCls = 'rounded-[2.5rem] border-[1.5px] border-white/50 bg-white/[0.16] shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-lg'

const ikonKiri = 'pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-white/70 transition-colors peer-focus:text-brand-500'

export default function Login() {
  const navigate = useNavigate()
  const emailRef = useRef(null)
  const timerError = useRef(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [lihat, setLihat] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState({})
  const [notice, setNotice] = useState(() => getNotice())

  useEffect(() => {
    document.title = 'Login Admin | BKPSDM Kota Yogyakarta'
    // Fokus otomatis ke email hanya di layar lebar dengan mouse; di HP/tablet dilewati supaya keyboard tidak muncul sendiri.
    if (window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) emailRef.current?.focus()
  }, [])

  // Pastikan timer pesan error dibersihkan saat halaman ditutup
  useEffect(() => () => clearTimeout(timerError.current), [])

  const ubah = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError((er) => ({ ...er, [e.target.name]: undefined, umum: undefined }))
  }

  async function kirim(e) {
    e.preventDefault()
    if (loading) return

    const lokal = {}
    if (!form.email.trim()) lokal.email = 'Email belum diisi.'
    else if (!FORMAT_EMAIL.test(form.email.trim())) lokal.email = 'Format email belum sesuai. Contoh: nama@email.com'
    if (!form.password) lokal.password = 'Password belum diisi.'
    clearTimeout(timerError.current)
    if (lokal.email || lokal.password) {
      setError(lokal)
      // Peringatan "belum diisi" / format email hilang sendiri setelah 4 detik
      timerError.current = setTimeout(() => setError((er) => ({ ...er, email: undefined, password: undefined })), 4000)
      return
    }

    setLoading(true)
    setError({})
    hapusNotice()
    setNotice(null)
    try {
      await login(form.email.trim(), form.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(bacaError(err))
      setForm((f) => ({ ...f, password: '' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-900">
      <SafeImage src={FOTO_HERO} className="absolute inset-0 h-full w-full object-cover object-bottom" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/50" />

      <Container className="flex flex-1 items-center py-24">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Sisi kiri: salam, seperti hero Beranda */}
          <div className="max-w-xl lg:pb-16">
            <Link to="/" aria-label="Beranda BKPSDM" className="rise-in inline-block"><Logo light /></Link>
            <p style={{ '--d': '150ms' }} className="rise-in mt-8 mb-2 -rotate-1 origin-left font-script text-3xl text-brand-200">Panel Admin</p>
            <h1 style={{ '--d': '250ms' }} className="rise-in text-3xl leading-[1.15] font-semibold text-slate-100 md:text-4xl lg:text-5xl">
              Kelola Magang <span className="text-brand-500">BKPSDM Kota Yogyakarta</span>
            </h1>
            <p style={{ '--d': '420ms' }} className="rise-in mt-5 text-lg leading-relaxed text-slate-100">
              Masuk untuk memverifikasi pendaftar, mengatur kuota formasi, dan memantau program magang.
            </p>
          </div>

          {/* Sisi kanan: satu kartu kaca berisi judul + form */}
          <div style={{ '--d': '500ms' }} className={`rise-in ${kartuCls} w-full max-w-md justify-self-center px-7 py-10 sm:px-10 lg:justify-self-end`}>
            <h2 className="text-2xl font-semibold text-white">Masuk ke panel admin</h2>
            <p className="mt-1.5 text-sm text-slate-200">Gunakan email dan password akun admin Anda.</p>

            {notice && !error.umum && (
              <div role="status" className="mt-5 flex items-start gap-2.5 rounded-lg border-l-4 border-amber-400 bg-amber-400/15 px-4 py-3 text-sm text-amber-100">
                <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {error.umum && (
              <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-lg border-l-4 border-red-400 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                <Icon name="xCircle" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error.umum}</span>
              </div>
            )}

            <form onSubmit={kirim} noValidate className="mt-10">
              <div className="space-y-11">
              <div className="relative">
                <div className="relative">
                  <input
                    id="email" name="email" type="email" autoComplete="username" ref={emailRef}
                    value={form.email} onChange={ubah} placeholder="Masukkan email Anda"
                    aria-invalid={!!error.email} aria-describedby={error.email ? 'email-err' : undefined}
                    className={`peer ${inputCls(error.email)}`}
                  />
                  <label htmlFor="email" className={labelCls}>Email</label>
                  <svg className={ikonKiri} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" />
                    <path d="m4 7.5 8 6 8-6" />
                  </svg>
                </div>
                {error.email && <p id="email-err" className="absolute top-full left-1 mt-1 text-xs text-red-300">{error.email}</p>}
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    id="password" name="password" type={lihat ? 'text' : 'password'} autoComplete="current-password"
                    value={form.password} onChange={ubah} placeholder="Masukkan password Anda"
                    onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                    onBlur={() => setCapsLock(false)}
                    aria-invalid={!!error.password} aria-describedby={error.password ? 'password-err' : undefined}
                    className={`peer ${inputCls(error.password, 'pr-12')}`}
                  />
                  <label htmlFor="password" className={labelCls}>Password</label>
                  <svg className={ikonKiri} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                  </svg>
                  <button
                    type="button" onClick={() => setLihat((v) => !v)}
                    aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-brand-500"
                  >
                    <Icon name={lihat ? 'eye' : 'eyeOff'} className="h-5 w-5" />
                  </button>
                </div>
                {error.password && <p id="password-err" className="absolute top-full left-1 mt-1 text-xs text-red-300">{error.password}</p>}
                {capsLock && !error.password && <p className="absolute top-full left-1 mt-1 text-xs text-amber-300">Caps Lock sedang aktif.</p>}
              </div>

              </div>

              <div className="mt-10 space-y-3">
              <button
                type="submit" disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Memproses…
                  </>
                ) : (
                  <>
                    Masuk <Icon name="arrowRight" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <Link
                to="/"
                className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/70 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                <Icon name="arrowRight" className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" /> Beranda
              </Link>
              </div>
            </form>
          </div>
        </div>
      </Container>

      <p className="relative z-10 pb-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} BKPSDM Kota Yogyakarta</p>
    </div>
  )
}