<?php

namespace App\Exports;

use App\Enums\StatusPendaftar;
use App\Models\BidangMagang;
use App\Models\Pendaftar;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

/**
 * Rekap penempatan magang, mengikuti format kertas "DAFTAR MAGANG BKPSDM TAHUN ...".
 *
 * Kolom: NO | BIDANG | KAMPUS/MHS | TANGGAL | DIGANTI/KAMPUS/MHS | TANGGAL | ...
 * - Hanya peserta berstatus Diterima (ketua + anggota kelompok).
 * - Satu baris tabel per bidang. Peserta satu kampus & periode yang sama dikelompokkan
 *   (nama kampus tebal, nama peserta di bawahnya "- Nama").
 * - Periode yang saling tumpang-tindih ditaruh bertumpuk di gelombang yang sama;
 *   periode yang mulai setelah gelombang sebelumnya berakhir pindah ke kolom "DIGANTI".
 *   Jumlah pasangan kolom otomatis bertambah (minimal 3 gelombang, seperti di kertas).
 */
class DaftarMagangSheet implements FromArray, WithTitle, WithEvents
{
    private const BARIS_HEADER   = 3;
    private const MIN_GELOMBANG  = 3;
    private const LEBAR_KAMPUS   = 34;
    private const LEBAR_TANGGAL  = 20;

    public function array(): array
    {
        return [];
    }

    public function title(): string
    {
        return 'Daftar Magang';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => fn (AfterSheet $event) => $this->tulis($event->sheet->getDelegate()),
        ];
    }

    // ------------------------------------------------------------------ data

    /** Satu elemen = satu orang peserta (ketua atau anggota) yang sudah diterima. */
    private function kumpulkanPeserta(): Collection
    {
        $relasi    = BidangMagang::punyaAnggota() ? ['anggota'] : [];
        $pendaftar = Pendaftar::with($relasi)
            ->where('status', StatusPendaftar::Diterima->value)
            ->orderBy('periode_mulai')->orderBy('id')
            ->get();

        $orang = collect();

        foreach ($pendaftar as $p) {
            $orang->push([
                'bidang'  => $p->bidang_magang_id,
                'kampus'  => $this->labelKampus($p->universitas, $p->fakultas),
                'nama'    => $p->nama_lengkap,
                'mulai'   => $p->periode_mulai,
                'selesai' => $p->periode_selesai,
            ]);

            if (! BidangMagang::punyaAnggota()) {
                continue;
            }

            foreach ($p->anggota as $a) {
                $orang->push([
                    'bidang'  => $a->bidang_magang_id ?? $p->bidang_magang_id,
                    'kampus'  => $this->labelKampus($a->universitas ?: $p->universitas, $a->fakultas),
                    'nama'    => $a->nama_lengkap,
                    'mulai'   => $p->periode_mulai,
                    'selesai' => $p->periode_selesai,
                ]);
            }
        }

        return $orang;
    }

    private function labelKampus(?string $universitas, ?string $fakultas): string
    {
        $universitas = trim((string) $universitas);
        $fakultas    = trim((string) $fakultas);

        return $fakultas !== '' ? "{$universitas} ({$fakultas})" : $universitas;
    }

    /**
     * @return array{0: Collection, 1: int} [blok per bidang, jumlah gelombang]
     */
    private function susun(Collection $peserta): array
    {
        $perBidang = $peserta->groupBy('bidang');

        $daftarBidang = BidangMagang::orderBy('id')->get()
            ->filter(fn ($b) => $b->status === 'aktif' || $perBidang->has($b->id))
            ->values();

        $maks = self::MIN_GELOMBANG;

        $blok = $daftarBidang->map(function ($bidang, $i) use ($perBidang, &$maks) {
            // 1) kelompokkan per kampus + periode -> satu "entri"
            $entri = collect($perBidang->get($bidang->id, []))
                ->groupBy(fn ($o) => $o['kampus'] . '|' . $o['mulai']->toDateString() . '|' . $o['selesai']->toDateString())
                ->map(fn ($grup) => [
                    'kampus'  => $grup->first()['kampus'],
                    'mulai'   => $grup->first()['mulai'],
                    'selesai' => $grup->first()['selesai'],
                    'nama'    => $grup->pluck('nama')->all(),
                ])
                ->sortBy(fn ($e) => $e['mulai']->toDateString() . '|' . $e['kampus'])
                ->values();

            // 2) bagi ke gelombang: tumpang-tindih = gelombang sama, mulai sesudah berakhir = gelombang berikutnya
            $gelombang = [];
            foreach ($entri as $e) {
                $tempat = null;
                foreach ($gelombang as $g => $info) {
                    if ($e['mulai']->lte($info['akhir'])) {
                        $tempat = $g;
                        break;
                    }
                }

                if ($tempat === null) {
                    $gelombang[] = ['akhir' => $e['selesai'], 'entri' => [$e]];
                } else {
                    $gelombang[$tempat]['entri'][] = $e;
                    if ($e['selesai']->gt($gelombang[$tempat]['akhir'])) {
                        $gelombang[$tempat]['akhir'] = $e['selesai'];
                    }
                }
            }

            $maks = max($maks, count($gelombang));

            return [
                'no'        => $i + 1,
                'nama'      => $bidang->nama_bidang,
                'gelombang' => array_column($gelombang, 'entri'),
                'tinggi'    => max(1, ...array_map('count', array_column($gelombang, 'entri') ?: [[]])),
            ];
        });

        return [$blok, $maks];
    }

    // ----------------------------------------------------------------- tulis

    private function tulis($s): void
    {
        $peserta       = $this->kumpulkanPeserta();
        [$blok, $jumlahGel] = $this->susun($peserta);

        $header   = self::BARIS_HEADER;
        $kolomAkhirIdx = 2 + 2 * $jumlahGel;
        $akhir    = Coordinate::stringFromColumnIndex($kolomAkhirIdx);
        $tahun    = $peserta->isNotEmpty() ? $peserta->min(fn ($o) => $o['mulai']->toDateString()) : null;
        $tahun    = $tahun ? Carbon::parse($tahun)->year : now()->year;

        $s->setShowGridlines(false);

        // ---------- Judul ----------
        $s->mergeCells("A1:{$akhir}1");
        $s->setCellValue('A1', "DAFTAR MAGANG BKPSDM TAHUN {$tahun}");
        $s->getStyle("A1")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $s->getRowDimension(1)->setRowHeight(26);

        $s->mergeCells("A2:{$akhir}2");
        $s->setCellValue('A2', 'Peserta berstatus Diterima  |  Dicetak: ' . Carbon::now()->locale('id')->translatedFormat('j F Y, H:i') . ' WIB');
        $s->getStyle('A2')->applyFromArray([
            'font'      => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // ---------- Header ----------
        $s->setCellValue("A{$header}", 'NO.');
        $s->setCellValue("B{$header}", 'SEKRETARIAT/BIDANG/UPT PKP');
        for ($g = 0; $g < $jumlahGel; $g++) {
            $kKampus  = Coordinate::stringFromColumnIndex(3 + 2 * $g);
            $kTanggal = Coordinate::stringFromColumnIndex(4 + 2 * $g);
            $s->setCellValue("{$kKampus}{$header}", $g === 0 ? 'KAMPUS/MHS' : 'DIGANTI/KAMPUS/MHS');
            $s->setCellValue("{$kTanggal}{$header}", 'TANGGAL');
        }
        $s->getStyle("A{$header}:{$akhir}{$header}")->applyFromArray([
            'font'      => ['bold' => true],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D9D9D9']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        $s->getRowDimension($header)->setRowHeight(24);

        // ---------- Isi ----------
        $baris = $header + 1;

        foreach ($blok as $b) {
            $awal  = $baris;
            $tinggi = $b['tinggi'];
            $ujung = $awal + $tinggi - 1;

            $s->setCellValue("A{$awal}", $b['no'] . '.');
            $s->setCellValue("B{$awal}", $b['nama']);
            if ($tinggi > 1) {
                $s->mergeCells("A{$awal}:A{$ujung}");
                $s->mergeCells("B{$awal}:B{$ujung}");
            }

            $tinggiBaris = array_fill(0, $tinggi, 0);

            foreach ($b['gelombang'] as $g => $daftarEntri) {
                $kKampus  = Coordinate::stringFromColumnIndex(3 + 2 * $g);
                $kTanggal = Coordinate::stringFromColumnIndex(4 + 2 * $g);

                foreach ($daftarEntri as $k => $e) {
                    $r = $awal + $k;

                    $teks = new RichText();
                    $teks->createTextRun($e['kampus'])->getFont()->setBold(true);
                    foreach ($e['nama'] as $nama) {
                        $teks->createText("\n- " . $nama);
                    }
                    $s->setCellValue("{$kKampus}{$r}", $teks);
                    $s->setCellValue("{$kTanggal}{$r}", $this->formatPeriode($e['mulai'], $e['selesai']));

                    $baris_visual = $this->hitungBaris($e['kampus'], self::LEBAR_KAMPUS);
                    foreach ($e['nama'] as $nama) {
                        $baris_visual += $this->hitungBaris('- ' . $nama, self::LEBAR_KAMPUS);
                    }
                    $tinggiBaris[$k] = max($tinggiBaris[$k], $baris_visual);
                }
            }

            foreach ($tinggiBaris as $k => $jumlahBaris) {
                $s->getRowDimension($awal + $k)->setRowHeight(max(34, $jumlahBaris * 15 + 6));
            }

            $baris = $ujung + 1;
        }

        $terakhir = max($baris - 1, $header + 1);

        // Garis kotak: tipis hitam di seluruh tabel; tumpukan entri dalam satu bidang tanpa garis pemisah (seperti di kertas)
        $s->getStyle("A{$header}:{$akhir}{$terakhir}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
        $pos = $header + 1;
        foreach ($blok as $b) {
            $ujung = $pos + $b['tinggi'] - 1;
            if ($b['tinggi'] > 1) {
                $s->getStyle("C{$pos}:{$akhir}{$ujung}")->applyFromArray([
                    'borders' => ['horizontal' => ['borderStyle' => Border::BORDER_NONE]],
                ]);
            }
            $s->getStyle("A{$pos}:{$akhir}{$ujung}")->applyFromArray([
                'borders' => ['outline' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            ]);
            $pos = $ujung + 1;
        }

        if ($terakhir > $header) {
            $s->getStyle("A" . ($header + 1) . ":{$akhir}{$terakhir}")->applyFromArray([
                'alignment' => ['vertical' => Alignment::VERTICAL_TOP, 'wrapText' => true],
            ]);
            $s->getStyle("A" . ($header + 1) . ":A{$terakhir}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // ---------- Lebar kolom & cetak ----------
        $s->getColumnDimension('A')->setWidth(6);
        $s->getColumnDimension('B')->setWidth(30);
        for ($g = 0; $g < $jumlahGel; $g++) {
            $s->getColumnDimension(Coordinate::stringFromColumnIndex(3 + 2 * $g))->setWidth(self::LEBAR_KAMPUS);
            $s->getColumnDimension(Coordinate::stringFromColumnIndex(4 + 2 * $g))->setWidth(self::LEBAR_TANGGAL);
        }

        $s->freezePane('C' . ($header + 1));
        $s->getPageSetup()
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setPaperSize(PageSetup::PAPERSIZE_A4)
            ->setFitToPage(true)
            ->setFitToWidth(1)
            ->setFitToHeight(0)
            ->setRowsToRepeatAtTopByStartAndEnd($header, $header);
    }

    // ---------------------------------------------------------------- bantu

    /** "29 Juni sd 31 Juli" (tahun hanya ditulis bila periode lintas tahun). */
    private function formatPeriode($mulai, $selesai): string
    {
        $a = Carbon::parse($mulai)->locale('id');
        $b = Carbon::parse($selesai)->locale('id');

        if ($a->isSameDay($b)) {
            return $a->translatedFormat('j F');
        }

        $format = $a->year === $b->year ? 'j F' : 'j F Y';

        return $a->translatedFormat($format) . ' sd ' . $b->translatedFormat($format);
    }

    /** Perkiraan jumlah baris tampil bila teks dibungkus pada lebar kolom tertentu. */
    private function hitungBaris(string $teks, int $lebar): int
    {
        return max(1, (int) ceil(mb_strlen($teks) / ($lebar * 1.05)));
    }
}