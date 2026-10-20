// Mengubah teks deskripsi bidang menjadi blok yang siap ditampilkan.
// Mendukung teks hasil paste dari PDF/Word (kalimat yang terpotong di akhir baris disambung lagi).
//
// Aturan baca:
//  - Bila ada baris bernomor/bullet ("1.", "2)", "-", "•"): setiap penanda = SATU tugas.
//    Baris tanpa penanda di bawahnya dianggap lanjutan kalimat tugas itu.
//    Teks sebelum/sesudah daftar menjadi paragraf, atau subjudul bila pendek dan tanpa tanda baca akhir.
//  - Bila tidak ada penanda sama sekali: setiap baris = satu tugas; baris berakhiran ":" = subjudul.
//  - Teks satu baris tanpa penanda = paragraf biasa.
const PENANDA = /^\s*(?:[-*•–]|\d+[.)])\s+/
const AKHIR_TANDA = /[.;,:!?]$/

// "…pada Bidang X;" / "…; dan" -> tanda baca sambung dari kalimat berundak dibuang
const rapikan = (t) => t.replace(/\s+/g, ' ').replace(/\s*;\s*(?:dan|atau)?\s*$/i, '').trim()

function jenisParagraf(teks) {
  const t = teks.replace(/\s+/g, ' ').trim()
  if (t.length <= 90 && (t.endsWith(':') || !AKHIR_TANDA.test(t))) {
    return { jenis: 'subjudul', teks: t.replace(/:$/, '').trim() }
  }
  return { jenis: 'paragraf', teks: t }
}

function bacaBerPenanda(baris) {
  const blok = []
  let daftar = null // daftar yang sedang terbuka
  let cur = null    // { kind: 'item' | 'para', parts: [] }

  const tutup = () => {
    if (!cur) return
    if (cur.kind === 'item') {
      const t = rapikan(cur.parts.join(' '))
      if (t) daftar.butir.push(t)
    } else {
      const t = cur.parts.join(' ').trim()
      if (t) blok.push(jenisParagraf(t))
      daftar = null
    }
    cur = null
  }

  for (const b of baris) {
    if (b === '') { tutup(); continue }

    if (PENANDA.test(b)) {
      if (cur?.kind === 'para') tutup()
      else if (cur) tutup()
      if (!daftar) { daftar = { jenis: 'daftar', butir: [] }; blok.push(daftar) }
      cur = { kind: 'item', parts: [b.replace(PENANDA, '')] }
      continue
    }

    if (!cur) { daftar = null; cur = { kind: 'para', parts: [b] }; continue }

    const sebelum = cur.parts.join(' ')
    const mulaiHurufBesar = /^[A-Z]/.test(b)
    const kalimatSelesai = sebelum.endsWith('.')
    const judulPendek = cur.kind === 'para' && cur.parts.length === 1 && sebelum.length <= 60 && !AKHIR_TANDA.test(sebelum)

    if (mulaiHurufBesar && (kalimatSelesai || judulPendek)) {
      // baris baru yang jelas bukan lanjutan -> mulai paragraf baru
      tutup(); daftar = null
      cur = { kind: 'para', parts: [b] }
    } else {
      cur.parts.push(b)
    }
  }
  tutup()
  return blok
}

function bacaPerBaris(baris) {
  const isi = baris.filter(Boolean)
  if (isi.length === 0) return []
  if (isi.length === 1 && !isi[0].endsWith(':')) return [{ jenis: 'paragraf', teks: isi[0] }]

  const blok = []
  let daftar = null
  for (const b of isi) {
    if (b.endsWith(':')) { daftar = null; blok.push({ jenis: 'subjudul', teks: b.slice(0, -1).trim() }); continue }
    if (!daftar) { daftar = { jenis: 'daftar', butir: [] }; blok.push(daftar) }
    daftar.butir.push(b)
  }
  return blok
}

export function bacaDeskripsi(teks) {
  const baris = String(teks ?? '').split(/\r?\n/).map((b) => b.trim())
  return baris.some((b) => PENANDA.test(b)) ? bacaBerPenanda(baris) : bacaPerBaris(baris)
}

// Jumlah tugas = jumlah butir di semua daftar
export function hitungTugas(teks) {
  return bacaDeskripsi(teks).reduce((n, b) => n + (b.jenis === 'daftar' ? b.butir.length : 0), 0)
}

// Ringkasan satu baris untuk pratinjau di kartu
export function ringkasDeskripsi(teks) {
  const blok = bacaDeskripsi(teks)
  if (blok.length === 0) return ''
  const n = hitungTugas(teks)
  if (n > 0) return `${n} tugas selama magang. Klik untuk melihat rincian.`
  return blok.find((b) => b.jenis === 'paragraf')?.teks ?? blok[0].teks
}