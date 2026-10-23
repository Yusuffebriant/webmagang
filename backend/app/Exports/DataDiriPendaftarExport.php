<?php

namespace App\Exports;

use App\Enums\StatusPendaftar;
use App\Models\Pendaftar;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

/**
 * Unduhan dari halaman admin "Data Pendaftar".
 *
 * Kolom : No | Nomor Pendaftaran | Peran (+ foto) | Biodata | Hasil Magang
 * Baris : satu baris = satu orang. Ketua lalu anggotanya tepat di bawahnya;
 *         kolom No & Nomor Pendaftaran digabung (merge) sepanjang satu kelompok.
 * Jumlah pendaftar / orang dihitung otomatis oleh rumus Excel (bukan angka mati).
 * Mengikuti filter status & pencarian yang sedang aktif di halaman.
 */
class DataDiriPendaftarExport implements FromArray, WithTitle, WithEvents
{
    private const BARIS_HEADER = 5;
    private const KOLOM_AKHIR  = 'E';

    private const LEBAR_KOLOM = ['A' => 7, 'B' => 22, 'C' => 24, 'D' => 62, 'E' => 54];

    private const BIRU_TUA   = '0B2A4A';
    private const ABU        = '000000'; // semua teks hitam
    private const TINGGI_FOTO = 120;   // px
    private const LEBAR_MAKS_FOTO = 150; // px
    private const LEBAR_PX_KOLOM_C = 173; // kira-kira lebar kolom C (24 karakter) dalam px

    /**
     * @param  string|null  $status  nilai enum StatusPendaftar, null = semua
     * @param  string|null  $cari    kata kunci pencarian (nama / no. pendaftaran / NIM / universitas)
     */
    public function __construct(private ?string $status = null, private ?string $cari = null)
    {
    }

    public function array(): array
    {
        return [];
    }

    public function title(): string
    {
        return 'Data Diri Pendaftar';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => fn (AfterSheet $event) => $this->tulis($event->sheet->getDelegate()),
        ];
    }

    // ------------------------------------------------------------------ data

    private function ambilPendaftar(): Collection
    {
        $query = Pendaftar::with('program', 'bidang', 'anggota.bidang')->latest();

        if ($this->status) {
            $query->where('status', $this->status);
        }

        if ($this->cari) {
            $cari = $this->cari;
            $query->where(function ($q) use ($cari) {
                $q->where('nama_lengkap', 'like', "%{$cari}%")
                  ->orWhere('nomor_pendaftaran', 'like', "%{$cari}%")
                  ->orWhere('nim', 'like', "%{$cari}%")
                  ->orWhere('universitas', 'like', "%{$cari}%");
            });
        }

        return $query->get();
    }

    /** Isi kolom Biodata: [label => nilai], urut dari NIM sampai Tanggal Daftar. */
    private function daftarBiodata($o, Pendaftar $k): array
    {
        $periode = ($k->periode_mulai && $k->periode_selesai)
            ? $k->periode_mulai->format('d-m-Y') . ' s.d. ' . $k->periode_selesai->format('d-m-Y')
            : null;

        return [
            'NIM'                     => $o->nim,
            'NIK'                     => $o->nik,
            'Tempat Lahir'            => $o->tempat_lahir,
            'Tanggal Lahir'           => $o->tanggal_lahir?->format('d-m-Y'),
            'Jenis Kelamin'           => match ($o->jenis_kelamin) {
                'L'     => 'Laki-laki',
                'P'     => 'Perempuan',
                default => $o->jenis_kelamin,
            },
            'Alamat'                  => $o->alamat,
            'Email'                   => $o->email,
            'No. HP / WhatsApp'       => $o->no_whatsapp,
            'Universitas / Kampus'    => $o->universitas,
            'Fakultas'                => $o->fakultas,
            'Program Studi / Jurusan' => $o->program_studi,
            'Jenjang'                 => $o->jenjang ?? null,
            'Semester'                => $o->semester,
            'Program Magang'          => $k->program?->nama_program,
            'Bidang'                  => ($o->bidang ?? $k->bidang)?->nama_bidang,
            'Periode Magang'          => $periode,
            'Status'                  => $k->status->label(),
            'Tanggal Daftar'          => $k->created_at?->format('d-m-Y H:i'),
        ];
    }

    // ----------------------------------------------------------- rich text

    private function tambah(RichText $rt, string $teks, bool $tebal = false, int $ukuran = 10, string $warna = '000000', bool $miring = false): void
    {
        $run = $rt->createTextRun($teks);
        $run->getFont()
            ->setName('Times New Roman')
            ->setSize($ukuran)
            ->setBold($tebal)
            ->setItalic($miring)
            ->setColor(new Color('FF' . $warna));
    }

    private function kosong($nilai): string
    {
        $nilai = trim((string) $nilai);

        return $nilai === '' ? '-' : $nilai;
    }

    private function sel_biodata($o, Pendaftar $k): array
    {
        $rt     = new RichText();
        $baris  = 3.1; // jarak atas (kecil) + nama (besar) + satu baris kosong
        $this->tambah($rt, " \n", false, 4);   // jarak tipis di atas nama supaya tidak menempel ke garis
        $this->tambah($rt, mb_strtoupper($this->kosong($o->nama_lengkap)), true, 14, '000000');
        $this->tambah($rt, "\n");               // satu enter (baris kosong) setelah nama

        foreach ($this->daftarBiodata($o, $k) as $label => $nilai) {
            $nilai = $this->kosong($nilai);
            $this->tambah($rt, "\n" . $label, true);
            $this->tambah($rt, ' : ' . $nilai);
            $baris += $this->hitungBaris($label . ' : ' . $nilai, 66);
        }

        return [$rt, $baris];
    }

    private function sel_hasil($o): array
    {
        $nilai    = $o->nilai_akhir;
        $ringkas  = trim((string) $o->hasil_magang);

        if ($nilai === null && $ringkas === '') {
            $rt = new RichText();
            $this->tambah($rt, 'Belum diisi', false, 10, self::ABU, true);

            return [$rt, 1];
        }

        $rt    = new RichText();
        $baris = 1;
        $this->tambah($rt, 'Nilai Akhir', true);
        $this->tambah($rt, ' : ' . ($nilai ?? '-'));

        if ($ringkas !== '') {
            $this->tambah($rt, "\nRingkasan Kegiatan / Hasil Magang :", true);
            $this->tambah($rt, "\n" . $ringkas);
            $baris += 1 + $this->hitungBaris($ringkas, 58);
        }

        return [$rt, $baris];
    }

    // ----------------------------------------------------------------- foto

    /** Pasang foto di bawah tulisan peran. Kembalikan false bila file tidak ada / tidak terbaca. */
    private function pasangFoto($s, ?string $foto, int $baris): bool
    {
        if (! filled($foto) || ! Storage::disk('public')->exists($foto)) {
            return false;
        }

        $path = Storage::disk('public')->path($foto);
        $info = @getimagesize($path);

        if (! $info || $info[0] < 1 || $info[1] < 1) {
            return false;
        }

        [$w0, $h0] = $info;
        $h = self::TINGGI_FOTO;
        $w = (int) round($w0 * $h / $h0);

        if ($w > self::LEBAR_MAKS_FOTO) {
            $w = self::LEBAR_MAKS_FOTO;
            $h = (int) round($h0 * $w / $w0);
        }

        $gambar = null;

        // Perkecil dulu (2x ukuran tampil) supaya file Excel tidak membengkak oleh foto 2 MB.
        if (function_exists('imagecreatefromstring') && function_exists('imagescale')) {
            $isi = @file_get_contents($path);
            $src = $isi ? @imagecreatefromstring($isi) : false;

            if ($src) {
                $kecil = @imagescale($src, $w * 2, $h * 2);
                if ($kecil) {
                    $png    = ($info[2] ?? null) === IMAGETYPE_PNG;
                    $gambar = new MemoryDrawing();
                    $gambar->setImageResource($kecil);
                    $gambar->setRenderingFunction($png ? MemoryDrawing::RENDERING_PNG : MemoryDrawing::RENDERING_JPEG);
                    $gambar->setMimeType(MemoryDrawing::MIMETYPE_DEFAULT);
                }
            }
        }

        if (! $gambar) {
            $gambar = new Drawing();
            $gambar->setPath($path);
        }

        $gambar->setResizeProportional(false);
        $gambar->setWidthAndHeight($w, $h);
        $gambar->setCoordinates('C' . $baris);
        $gambar->setOffsetX(max(0, (int) round((self::LEBAR_PX_KOLOM_C - $w) / 2)));
        $gambar->setOffsetY(30);
        $gambar->setWorksheet($s);

        return true;
    }

    // ----------------------------------------------------------------- tulis

    private function tulis($s): void
    {
        $akhir  = self::KOLOM_AKHIR;
        $header = self::BARIS_HEADER;
        $hitam  = '000000';
        $tengah = ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER];
        $garis  = ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $hitam]]];

        $kelompok = $this->ambilPendaftar();

        $s->setShowGridlines(true); // garis bantu abu-abu bawaan Excel tetap tampil di layar
        $s->getParent()->getDefaultStyle()->getFont()->setName('Times New Roman')->setSize(10);

        // ---------- Header tabel (judul ditulis belakangan karena butuh alamat rentang data) ----------
        foreach (['No', 'Nomor Pendaftaran', 'Peran', 'Biodata', 'Hasil Magang'] as $i => $teks) {
            $s->setCellValue(chr(65 + $i) . $header, $teks);
        }
        $s->getStyle("A{$header}:{$akhir}{$header}")->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::BIRU_TUA]],
            'alignment' => $tengah + ['wrapText' => true],
            'borders'   => $garis,
        ]);
        $s->getRowDimension($header)->setRowHeight(30);

        // ---------- Isi: satu kelompok = satu blok baris ----------
        $baris = $header + 1;
        $awalData = $baris;
        $no = 0;

        foreach ($kelompok as $k) {
            $no++;
            $orang = collect([['o' => $k, 'peran' => 'Ketua']]);
            foreach ($k->anggota as $i => $a) {
                $orang->push(['o' => $a, 'peran' => 'Anggota ' . ($i + 1)]);
            }

            $awalKelompok = $baris;

            foreach ($orang as $item) {
                $o = $item['o'];

                [$rtBio, $barisBio]     = $this->sel_biodata($o, $k);
                [$rtHasil, $barisHasil] = $this->sel_hasil($o);

                // Peran + foto
                $adaFoto = $this->pasangFoto($s, $o->foto, $baris);
                $rtPeran = new RichText();
                $this->tambah($rtPeran, $item['peran'], $item['peran'] === 'Ketua');
                if (! $adaFoto) {
                    $this->tambah($rtPeran, "\n(tidak ada foto)", false, 10, self::ABU);
                }
                $s->setCellValue("C{$baris}", $rtPeran);
                $s->setCellValue("D{$baris}", $rtBio);
                $s->setCellValue("E{$baris}", $rtHasil);

                // Tinggi baris: cukup untuk biodata / hasil magang / foto, mana yang paling tinggi.
                $tinggiTeks = max($barisBio, $barisHasil) * 13.2 + 10;
                $tinggiFoto = $adaFoto ? (30 + self::TINGGI_FOTO + 12) * 0.75 : 0;
                $s->getRowDimension($baris)->setRowHeight(min(409, max(40, $tinggiTeks, $tinggiFoto)));

                $baris++;
            }

            $akhirKelompok = $baris - 1;

            // No & Nomor Pendaftaran: satu per kelompok, digabung sepanjang kelompok.
            $s->setCellValue("A{$awalKelompok}", $no);
            $s->setCellValueExplicit("B{$awalKelompok}", (string) $k->nomor_pendaftaran, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            if ($akhirKelompok > $awalKelompok) {
                $s->mergeCells("A{$awalKelompok}:A{$akhirKelompok}");
                $s->mergeCells("B{$awalKelompok}:B{$akhirKelompok}");
            }
        }

        // Tidak ada data -> satu baris keterangan agar tabel tidak kosong.
        if ($kelompok->isEmpty()) {
            $s->mergeCells("A{$baris}:{$akhir}{$baris}");
            $s->setCellValue("A{$baris}", 'Tidak ada data pendaftar.');
            $s->getStyle("A{$baris}")->applyFromArray(['alignment' => $tengah, 'font' => ['italic' => true]]);
            $s->getRowDimension($baris)->setRowHeight(28);
            $baris++;
        }

        $akhirData = $baris - 1;

        // Garis tipis seluruh tabel (garis luar kelompok yang tebal ditimpa lagi di bawah).
        $s->getStyle("A{$header}:{$akhir}{$akhirData}")->applyFromArray(['borders' => $garis]);

        // Perataan isi
        $awal = $header + 1;
        $s->getStyle("A{$awal}:{$akhir}{$akhirData}")->getAlignment()
            ->setVertical(Alignment::VERTICAL_TOP)->setWrapText(true);
        $s->getStyle("A{$awal}:C{$akhirData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $s->getStyle("D{$awal}:E{$akhirData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);

        // Garis luar tebal memisahkan antar kelompok (diterapkan setelah garis tipis agar tidak tertimpa).
        $pos = $awal;
        foreach ($kelompok as $k) {
            $ujung = $pos + $k->anggota->count(); // ketua + anggota = 1 + n baris
            $s->getStyle("A{$pos}:{$akhir}{$ujung}")->applyFromArray([
                'borders' => ['outline' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $hitam]]],
            ]);
            $pos = $ujung + 1;
        }

        // ---------- Rumus jumlah otomatis ----------
        // Pendaftar = banyak nomor di kolom A (satu angka per kelompok); orang = banyak sel terisi di kolom Peran.
        $fPendaftar = "COUNT(A{$awal}:A{$akhirData})";
        $fOrang     = "COUNTA(C{$awal}:C{$akhirData})";

        // ---------- Judul ----------
        foreach ([1, 2, 3] as $r) {
            $s->mergeCells("A{$r}:{$akhir}{$r}");
        }

        $label = $this->status
            ? (StatusPendaftar::tryFrom($this->status)?->label() ?? $this->status)
            : 'Semua status';

        $teksCetak = sprintf(
            'Dicetak: %s WIB   |   Filter: %s%s   |   ',
            now()->translatedFormat('d F Y, H:i'),
            $label,
            $this->cari ? ' · cari "' . $this->cari . '"' : '',
        );

        $s->setCellValue('A1', 'DATA DIRI PENDAFTAR MAGANG');
        $s->setCellValue('A2', 'BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA (BKPSDM) KOTA YOGYAKARTA');
        $s->setCellValue('A3', '="' . str_replace('"', '""', $teksCetak) . '"&' . $fPendaftar . '&" pendaftar, "&' . $fOrang . '&" orang"');

        $s->getStyle("A1:{$akhir}3")->applyFromArray(['font' => ['bold' => true, 'size' => 12], 'alignment' => $tengah]);
        $s->getStyle("A1")->getFont()->setSize(14);
        $s->getStyle("A3:{$akhir}3")->applyFromArray(['font' => ['bold' => false, 'size' => 9]]);
        $s->getRowDimension(1)->setRowHeight(24);
        $s->getRowDimension(4)->setRowHeight(8);

        // ---------- Baris total ----------
        $total = $akhirData + 1;
        $s->mergeCells("A{$total}:{$akhir}{$total}");
        $s->setCellValue("A{$total}", '="TOTAL  "&' . $fPendaftar . '&" pendaftar, "&' . $fOrang . '&" orang"');
        $s->getStyle("A{$total}:{$akhir}{$total}")->applyFromArray([
            'font'      => ['bold' => true],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
            'borders'   => $garis,
        ]);
        $s->getRowDimension($total)->setRowHeight(22);

        // ---------- Lebar kolom, freeze, cetak ----------
        foreach (self::LEBAR_KOLOM as $kol => $lebar) {
            $s->getColumnDimension($kol)->setWidth($lebar);
        }

        // Autofilter sengaja tidak dipasang: sel yang digabung (No & Nomor Pendaftaran) membuat filter Excel berantakan.
        // Penyaringan dilakukan lewat filter status & kotak cari di halaman Data Pendaftar sebelum mengunduh.
        $s->freezePane('A' . ($header + 1));

        $s->getPageSetup()
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setPaperSize(PageSetup::PAPERSIZE_A4)
            ->setFitToPage(true)
            ->setFitToWidth(1)
            ->setFitToHeight(0)
            ->setRowsToRepeatAtTopByStartAndEnd($header, $header);
    }

    // ---------------------------------------------------------------- bantu

    /** Perkiraan jumlah baris tampil bila teks dibungkus pada lebar tertentu (karakter). */
    private function hitungBaris(string $teks, int $lebar): int
    {
        $n = 0;
        foreach (preg_split('/\R/u', $teks) ?: [''] as $paragraf) {
            $n += max(1, (int) ceil(mb_strlen($paragraf) / $lebar));
        }

        return $n;
    }
}