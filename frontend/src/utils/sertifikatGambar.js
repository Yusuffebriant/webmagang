// Menggambar sertifikat (A4 landscape) ke objek jsPDF. Fungsi murni: tidak memuat gambar sendiri,
// jadi bisa dipakai di browser maupun diuji di Node. Semua teks berasal dari `item` (data peserta)
// dan `p` (pengaturan template dari admin).

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function tanggalPanjang(v) {
  if (!v) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v))
  if (!m) return String(v)
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`
}

export function teksPeriode(item) {
  const a = tanggalPanjang(item.periode_mulai)
  const b = tanggalPanjang(item.periode_selesai)
  if (a && b) return `${a} s.d. ${b}`
  return a || b || ''
}

// Ganti placeholder {nama} {instansi} {bidang} {periode} {periode_mulai} {periode_selesai}
export function isiTemplate(template, item) {
  const nilai = {
    nama: item.nama,
    instansi: item.instansi,
    bidang: item.bidang,
    periode: teksPeriode(item),
    periode_mulai: tanggalPanjang(item.periode_mulai),
    periode_selesai: tanggalPanjang(item.periode_selesai),
  }
  return String(template ?? '')
    .replace(/\{(\w+)\}/g, (_, k) => nilai[k] ?? '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const W = 297
const H = 210
const C = W / 2

// Kecilkan font sampai teks muat di lebar maksimum
function pasKan(doc, teks, ukuran, lebarMax, minimum = 8) {
  let u = ukuran
  doc.setFontSize(u)
  while (u > minimum && doc.getTextWidth(teks) > lebarMax) {
    u -= 0.5
    doc.setFontSize(u)
  }
  return u
}

const baris = (v) => String(v ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)

export function gambarSertifikat(doc, item, p, { bingkai, logo, rasioLogo = 168 / 217 }) {
  doc.setTextColor(0, 0, 0)

  // Bingkai & logo
  doc.addImage(bingkai, 'PNG', 0, 0, W, H)
  const hLogo = 26.6
  doc.addImage(logo, 'PNG', 28.2, 12.2, hLogo * rasioLogo, hLogo)

  // Kop instansi
  let y = 20.2
  doc.setFont('helvetica', 'bold')
  baris(p.instansi_nama).forEach((t) => {
    pasKan(doc, t, 14, 190)
    doc.text(t, C, y, { align: 'center' })
    y += 7.3
  })
  y = 33.4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.splitTextToSize(String(p.instansi_alamat ?? ''), 172).forEach((t) => {
    doc.text(t, C, y, { align: 'center' })
    y += 4.6
  })
  if (p.instansi_kontak) doc.text(String(p.instansi_kontak), C, y, { align: 'center' })

  // Judul & nomor
  doc.setFont('times', 'bold')
  pasKan(doc, p.judul, 46, 150, 20)
  doc.text(String(p.judul), C, 61.5, { align: 'center' })
  doc.setFontSize(13)
  doc.text(`NOMOR : ${item.nomor ?? ''}`, C, 70.4, { align: 'center' })

  // Pembuka, nama, instansi/kampus
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.text(String(p.kalimat_pembuka), C, 79.6, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  pasKan(doc, String(item.nama ?? '').toUpperCase(), 27, 235, 14)
  doc.text(String(item.nama ?? '').toUpperCase(), C, 93, { align: 'center' })

  pasKan(doc, String(item.instansi ?? '').toUpperCase(), 17, 235, 10)
  doc.text(String(item.instansi ?? '').toUpperCase(), C, 104.8, { align: 'center' })

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.7)
  doc.line(38, 108.4, 259, 108.4)

  // Kalimat isi (otomatis ikut nama/bidang/periode)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12.5)
  y = 118.4
  const barisIsi = doc.splitTextToSize(isiTemplate(p.kalimat_isi, item), 240)
  barisIsi.forEach((t) => {
    doc.text(t, C, y, { align: 'center' })
    y += 7.3
  })
  const yIsiAkhir = y - 7.3

  // Tanggal, jabatan, penandatangan
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  const tgl = tanggalPanjang(item.tanggal_terbit)
  // Bila kalimat isi lebih dari dua baris, blok tanggal turun sedikit agar tidak rapat
  const yTgl = Math.max(140.9, yIsiAkhir + 9.5)
  doc.text(`${p.kota ?? ''}${p.kota && tgl ? ', ' : ''}${tgl}`, C, yTgl, { align: 'center' })
  y = yTgl + 5.7
  baris(p.jabatan_pejabat).forEach((t) => {
    doc.text(t, C, y, { align: 'center' })
    y += 5.8
  })

  // Gambar tanda tangan (opsional): di antara baris jabatan dan nama pejabat
  if (p.ttd_pejabat) {
    try {
      const props = doc.getImageProperties(p.ttd_pejabat)
      const yTtd = y - 4.5
      const skala = Math.min(50 / props.width, Math.min(18, 172 - yTtd) / props.height)
      const w = props.width * skala
      const h = props.height * skala
      doc.addImage(p.ttd_pejabat, props.fileType, C - w / 2, yTtd, w, h)
    } catch {
      // gambar rusak: sertifikat tetap dicetak tanpa tanda tangan
    }
  }

  doc.setFont('times', 'normal')
  doc.setFontSize(16)
  const pejabat = String(p.nama_pejabat ?? '')
  doc.text(pejabat, C, 173.4, { align: 'center' })
  const lebar = doc.getTextWidth(pejabat) + 11
  doc.setLineWidth(0.4)
  doc.line(C - lebar / 2, 176.2, C + lebar / 2, 176.2)

  if (p.nip_pejabat) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`NIP. ${p.nip_pejabat}`, C, 183.3, { align: 'center' })
  }
}

// Satu dokumen, satu halaman per peserta
export function bangunDokumen(jsPDF, daftar, p, aset) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  daftar.forEach((item, i) => {
    if (i > 0) doc.addPage('a4', 'landscape')
    gambarSertifikat(doc, item, p, aset)
  })
  return doc
}