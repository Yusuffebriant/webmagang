import { useEffect, useRef, useState } from 'react'

const TIPE = ['image/jpeg', 'image/png']
const MAKS_UKURAN = 2 * 1024 * 1024 // 2MB, sama dengan validasi backend

// Input foto diri dengan pratinjau. `value` = File | null, `onChange(file | null)`.
// Format (JPG/PNG) dan ukuran (maks. 2MB) diperiksa di sini sebelum file diterima.
export default function FotoDiri({ id, value, onChange }) {
  const [pratinjau, setPratinjau] = useState('')
  const [galat, setGalat] = useState('')
  const input = useRef(null)

  useEffect(() => {
    if (!value) {
      setPratinjau('')
      return undefined
    }
    const url = URL.createObjectURL(value)
    setPratinjau(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const pilih = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!TIPE.includes(file.type)) {
      setGalat('Foto harus berformat JPG atau PNG.')
      e.target.value = ''
      return
    }
    if (file.size > MAKS_UKURAN) {
      setGalat('Ukuran foto maksimal 2MB.')
      e.target.value = ''
      return
    }
    setGalat('')
    onChange(file)
  }

  const hapus = () => {
    setGalat('')
    if (input.current) input.current.value = ''
    onChange(null)
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-300">
          {pratinjau ? (
            <img src={pratinjau} alt="Pratinjau foto diri" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <input id={id} ref={input} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pilih} className="peer sr-only" />
          <div className="flex flex-wrap gap-2">
            <label htmlFor={id}
              className="cursor-pointer rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/30 hover:bg-brand-600">
              {value ? 'Ganti Foto' : 'Pilih Foto'}
            </label>
            {value && (
              <button type="button" onClick={hapus}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600">
                Hapus
              </button>
            )}
          </div>
          <p className="mt-2 truncate text-xs text-slate-500">{value ? value.name : 'Belum ada foto dipilih'}</p>
        </div>
      </div>
      {galat && <p role="alert" className="mt-1 text-xs text-red-600">{galat}</p>}
    </div>
  )
}