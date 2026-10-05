// Membuat PDF "Bukti Pendaftaran" yang memuat nomor/token pendaftaran.
// jsPDF dimuat dinamis supaya tidak membebani bundle halaman lain.

const NAVY = [11, 42, 74]
const BLUE = [10, 132, 232]
const ABU = [100, 116, 139]
const GELAP = [30, 41, 59]

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function tgl(v) {
  if (!v) return '-'
  const d = new Date(String(v).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(v)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export async function unduhBuktiPendaftaran(hasil, { jumlahAnggota = 0 } = {}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 20

  // ===== Header =====
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 46, 'F')
  doc.setFillColor(...BLUE)
  doc.rect(0, 46, W, 2.5, 'F')
  // hiasan lingkaran tipis di pojok header
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setGState(new doc.GState({ opacity: 0.12 }))
  doc.circle(W - 12, 6, 30, 'S')
  doc.circle(W - 12, 6, 20, 'S')
  doc.setGState(new doc.GState({ opacity: 1 }))

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('BKPSDM KOTA YOGYAKARTA', M, 17)
  doc.setFontSize(21)
  doc.text('Bukti Pendaftaran Magang', M, 29)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text('Simpan dokumen ini untuk mengecek status pendaftaran Anda.', M, 37)

  // ===== Kotak token =====
  const boxY = 62
  doc.setFillColor(239, 246, 255)
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.6)
  doc.setLineDashPattern([2, 1.5], 0)
  doc.roundedRect(M, boxY, W - 2 * M, 40, 3, 3, 'FD')
  doc.setLineDashPattern([], 0)

  doc.setTextColor(...ABU)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TOKEN / NOMOR PENDAFTARAN', W / 2, boxY + 12, { align: 'center' })
  doc.setTextColor(...BLUE)
  doc.setFont('courier', 'bold')
  doc.setFontSize(28)
  doc.text(String(hasil.nomor_pendaftaran ?? '-'), W / 2, boxY + 27, { align: 'center' })
  doc.setTextColor(...ABU)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Jangan bagikan token ini kepada pihak lain.', W / 2, boxY + 35, { align: 'center' })

  // ===== Rincian =====
  const tipe = jumlahAnggota > 0 ? `Kelompok (${jumlahAnggota + 1} orang)` : 'Individu'
  const periode = hasil.periode_mulai && hasil.periode_selesai
    ? `${tgl(hasil.periode_mulai)} s.d. ${tgl(hasil.periode_selesai)}`
    : '-'
  const baris = [
    ['Nama Pendaftar', hasil.nama_lengkap],
    ['Universitas / Sekolah', hasil.universitas],
    ['Program Studi', hasil.program_studi],
    ['Formasi Magang', hasil.bidang],
    ['Periode Magang', periode],
    ['Tipe Pendaftaran', tipe],
    ['Tanggal Daftar', tgl(hasil.created_at)],
    ['Status', hasil.status_label ?? 'Menunggu Verifikasi'],
  ]

  let y = boxY + 56
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Rincian Pendaftaran', M, y)
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.8)
  doc.line(M, y + 2.5, M + 14, y + 2.5)
  y += 11

  baris.forEach(([label, nilai], i) => {
    const teks = doc.splitTextToSize(String(nilai || '-'), W - 2 * M - 60)
    const tinggi = Math.max(9, teks.length * 5 + 4)
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(M, y - 5.5, W - 2 * M, tinggi, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...ABU)
    doc.text(label, M + 3, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GELAP)
    doc.text(teks, M + 57, y)
    y += tinggi
  })

  // ===== Langkah berikutnya =====
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...NAVY)
  doc.text('Langkah Selanjutnya', M, y)
  doc.setDrawColor(...BLUE)
  doc.line(M, y + 2.5, M + 14, y + 2.5)
  y += 10

  const urlCek = `${window.location.origin}/cek-status?nomor=${encodeURIComponent(hasil.nomor_pendaftaran ?? '')}`
  const langkah = [
    'Data Anda akan diverifikasi oleh BKPSDM Kota Yogyakarta.',
    'Cek status pendaftaran secara berkala menggunakan token di atas.',
    'Pastikan nomor WhatsApp dan email yang Anda isi aktif untuk dihubungi.',
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GELAP)
  langkah.forEach((l, i) => {
    doc.setFillColor(...BLUE)
    doc.circle(M + 3, y - 1.2, 2.6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(String(i + 1), M + 3, y + 0.1, { align: 'center' })
    doc.setTextColor(...GELAP)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const t = doc.splitTextToSize(l, W - 2 * M - 12)
    doc.text(t, M + 9, y)
    y += t.length * 5 + 3.5
  })

  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...ABU)
  doc.text('Cek status online:', M, y)
  doc.setTextColor(...BLUE)
  doc.setFont('helvetica', 'normal')
  doc.textWithLink(urlCek, M + 33, y, { url: urlCek })

  // ===== Footer =====
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(M, H - 20, W - M, H - 20)
  doc.setFontSize(8.5)
  doc.setTextColor(...ABU)
  doc.text(`Dicetak otomatis oleh sistem pada ${tgl(new Date().toISOString())}`, M, H - 13)
  doc.text(`© ${new Date().getFullYear()} BKPSDM Kota Yogyakarta`, W - M, H - 13, { align: 'right' })

  doc.save(`Bukti-Pendaftaran-${hasil.nomor_pendaftaran ?? 'magang'}.pdf`)
}