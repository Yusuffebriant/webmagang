// Pembuat PDF sertifikat. jsPDF dimuat dinamis (seperti Bukti Pendaftaran) agar bundle halaman lain tetap ringan.
import bingkaiUrl from '../assets/sertifikat/bingkai.png'
import logoUrl from '../assets/sertifikat/logo.png'
import { bangunDokumen } from './sertifikatGambar'

export { tanggalPanjang, teksPeriode, isiTemplate } from './sertifikatGambar'

let asetCache = null

async function keDataUrl(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Gagal membaca gambar sertifikat'))
    r.readAsDataURL(blob)
  })
}

async function muatAset() {
  asetCache ??= Promise.all([keDataUrl(bingkaiUrl), keDataUrl(logoUrl)])
    .then(([bingkai, logo]) => ({ bingkai, logo }))
    .catch((e) => { asetCache = null; throw e })
  return asetCache
}

async function buat(daftar, pengaturan) {
  const { jsPDF } = await import('jspdf')
  return bangunDokumen(jsPDF, daftar, pengaturan, await muatAset())
}

const aman = (s) => String(s ?? 'peserta').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'peserta'

/** Unduh sertifikat satu orang. */
export async function unduhSertifikat(item, pengaturan) {
  const doc = await buat([item], pengaturan)
  doc.save(`Sertifikat-${aman(item.nama)}.pdf`)
}

/** Unduh semua peserta dalam satu file (satu halaman per orang). */
export async function unduhSemuaSertifikat(daftar, pengaturan, namaBerkas = 'Sertifikat-Kelompok') {
  const doc = await buat(daftar, pengaturan)
  doc.save(`${aman(namaBerkas)}.pdf`)
}

/** URL blob untuk pratinjau di <iframe>. Panggil URL.revokeObjectURL bila sudah tidak dipakai. */
export async function urlPratinjau(daftar, pengaturan) {
  const doc = await buat(daftar, pengaturan)
  return URL.createObjectURL(doc.output('blob'))
}