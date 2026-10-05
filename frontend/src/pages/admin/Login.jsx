import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { getNotice, hapusNotice } from '../../api/session'
import Icon from '../../components/Icon'
import Logo from '../../components/Logo'

const FORMAT_EMAIL = /^\S+@\S+\.\S+$/

// Pesan bawaan Laravel berbahasa Inggris -> Indonesia
function terjemah(msg) {
  if (!msg) return msg
  if (/valid email/i.test(msg)) return 'Format email-nya belum pas nih. Contoh: nama@email.com'
  if (/field is required/i.test(msg)) return 'Bagian ini wajib diisi ya.'
  return msg
}

// Menerjemahkan error backend menjadi pesan untuk form.
//  - 422: validasi / kredensial salah -> { errors: { email: [...], password: [...] } }
//  - 429: kena throttle (maks 5 percobaan per menit)
function bacaError(err) {
  const res = err.response
  if (!res) return { umum: 'Belum bisa terhubung ke server. Cek dulu backend-nya sudah jalan atau belum.' }

  if (res.status === 422) {
    const e = res.data?.errors ?? {}
    return {
      email: terjemah(e.email?.[0]),
      password: terjemah(e.password?.[0]),
      umum: !e.email && !e.password ? terjemah(res.data?.message) : undefined,
    }
  }
  if (res.status === 429) return { umum: 'Kebanyakan percobaan nih. Tunggu 1 menit dulu ya, lalu coba lagi.' }
  return { umum: 'Server lagi bermasalah. Coba lagi sebentar lagi ya.' }
}

const inputCls = (invalid) =>
  `block w-full rounded-2xl border py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-4 ${
    invalid
      ? 'border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15'
  }`

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [lihat, setLihat] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState({})
  const [notice, setNotice] = useState(() => getNotice())

  useEffect(() => {
    document.title = 'Login Admin | BKPSDM Kota Yogyakarta'
  }, [])

  const ubah = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError((er) => ({ ...er, [e.target.name]: undefined, umum: undefined }))
  }

  async function kirim(e) {
    e.preventDefault()
    if (loading) return

    const lokal = {}
    if (!form.email.trim()) lokal.email = 'Email-nya belum diisi nih.'
    else if (!FORMAT_EMAIL.test(form.email.trim())) lokal.email = 'Format email-nya belum pas nih. Contoh: nama@email.com'
    if (!form.password) lokal.password = 'Password-nya belum diisi nih.'
    if (lokal.email || lokal.password) return setError(lokal)

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-sky-100 via-white to-brand-100 px-5 py-10">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

      <Link
        to="/"
        className="absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-brand-900 shadow-sm ring-1 ring-slate-200 transition hover:text-brand-500 sm:top-7 sm:left-8"
      >
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" /> Beranda
      </Link>

      <div className="relative flex w-full flex-col items-center">
        <Link to="/" aria-label="Beranda BKPSDM" className="mb-7"><Logo /></Link>

        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-brand-900/10 sm:p-9">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
              <Icon name="shieldCheck" className="h-3.5 w-3.5" /> Panel Admin Magang
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-900">
              Halo, Admin! <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">Masuk dulu yuk buat kelola pendaftaran magang.</p>
          </div>

          {notice && !error.umum && (
            <div role="status" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {error.umum && (
            <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span aria-hidden="true" className="mt-px font-bold">!</span>
              <span>{error.umum}</span>
            </div>
          )}

          <form onSubmit={kirim} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-brand-900">Email</label>
              <div className="relative">
                <Icon name="mail" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email" name="email" type="email" autoComplete="username" autoFocus
                  value={form.email} onChange={ubah} placeholder="emailkamu@contoh.com"
                  aria-invalid={!!error.email} aria-describedby={error.email ? 'email-err' : undefined}
                  className={inputCls(error.email)}
                />
              </div>
              {error.email && <p id="email-err" className="mt-1.5 text-xs text-red-600">{error.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-brand-900">Password</label>
              <div className="relative">
                <Icon name="lock" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password" name="password" type={lihat ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password} onChange={ubah} placeholder="Password kamu"
                  onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                  onBlur={() => setCapsLock(false)}
                  aria-invalid={!!error.password} aria-describedby={error.password ? 'password-err' : undefined}
                  className={`${inputCls(error.password)} pr-12`}
                />
                <button
                  type="button" onClick={() => setLihat((v) => !v)}
                  aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-brand-500"
                >
                  <Icon name={lihat ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                </button>
              </div>
              {error.password && <p id="password-err" className="mt-1.5 text-xs text-red-600">{error.password}</p>}
              {capsLock && !error.password && <p className="mt-1.5 text-xs text-amber-600">Eh, Caps Lock-nya lagi nyala.</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-500 to-sky-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/35 focus:ring-4 focus:ring-brand-500/25 focus:outline-none active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Bentar ya...
                </>
              ) : (
                <>Masuk <Icon name="arrowRight" className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-xs text-slate-500">© {new Date().getFullYear()} BKPSDM Kota Yogyakarta</p>
      </div>
    </div>
  )
}