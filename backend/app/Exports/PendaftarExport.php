<?php

namespace App\Exports;

use App\Models\Pendaftar;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

class PendaftarExport extends DefaultValueBinder implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithCustomStartCell,
    WithCustomValueBinder,
    WithEvents,
    WithTitle
{
    private const BARIS_HEADER = 6;
    private const KOLOM_AKHIR  = 'N';

    // NIM, NIK, No. WhatsApp: wajib disimpan sebagai teks agar tidak jadi 2.02E+08 / hilang angka nol.
    private const KOLOM_TEKS = ['D', 'E', 'K'];

    private const LEBAR_KOLOM = [
        'A' => 6,  'B' => 24, 'C' => 28, 'D' => 16, 'E' => 20, 'F' => 28, 'G' => 28,
        'H' => 10, 'I' => 32, 'J' => 28, 'K' => 18, 'L' => 32, 'M' => 22, 'N' => 18,
    ];

    // Warna latar & huruf per status (kunci = nilai enum StatusPendaftar).
    private const WARNA_STATUS = [
        'menunggu_verifikasi' => ['fill' => 'FFF3CD', 'font' => '7A5B00'],
        'diverifikasi'        => ['fill' => 'DCECFD', 'font' => '0B4F8A'],
        'diterima'            => ['fill' => 'D9F2E3', 'font' => '1E6B3C'],
        'ditolak'             => ['fill' => 'FADBD8', 'font' => '922B21'],
    ];

    private ?Collection $data = null;
    private int $no = 0;

    public function collection(): Collection
    {
        return $this->data = Pendaftar::with('program', 'bidang')->latest()->get();
    }

    public function startCell(): string
    {
        return 'A' . self::BARIS_HEADER;
    }

    public function title(): string
    {
        return 'Data Pendaftar';
    }

    public function headings(): array
    {
        return [
            'No', 'Nomor Pendaftaran', 'Nama Lengkap', 'NIM', 'NIK',
            'Universitas', 'Program Studi', 'Semester',
            'Program Magang', 'Bidang', 'No. WhatsApp', 'Email',
            'Status', 'Tanggal Daftar',
        ];
    }

    public function map($pendaftar): array
    {
        return [
            ++$this->no,
            $pendaftar->nomor_pendaftaran,
            $pendaftar->nama_lengkap,
            $pendaftar->nim,
            $pendaftar->nik,
            $pendaftar->universitas,
            $pendaftar->program_studi,
            $pendaftar->semester,
            $pendaftar->program?->nama_program,
            $pendaftar->bidang?->nama_bidang,
            $pendaftar->no_whatsapp,
            $pendaftar->email,
            $pendaftar->status->label(),
            $pendaftar->created_at->format('d-m-Y H:i'),
        ];
    }

    public function bindValue(Cell $cell, $value): bool
    {
        if (
            is_string($value)
            && $cell->getRow() > self::BARIS_HEADER
            && in_array($cell->getColumn(), self::KOLOM_TEKS, true)
        ) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $s       = $event->sheet->getDelegate();
                $akhir   = self::KOLOM_AKHIR;
                $header  = self::BARIS_HEADER;
                $data    = $this->data ?? collect();
                $jumlah  = $data->count();
                $terakhir = $header + max($jumlah, 1);
                $navy    = '0B2A4A';

                $s->setShowGridlines(false);

                // ---------- Judul ----------
                $s->mergeCells("A1:{$akhir}1");
                $s->mergeCells("A2:{$akhir}2");
                $s->mergeCells("A3:{$akhir}3");
                $s->mergeCells("A4:{$akhir}4");

                $s->setCellValue('A1', 'DATA PENDAFTAR MAGANG');
                $s->setCellValue('A2', 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kota Yogyakarta');
                $s->setCellValue('A3', 'Dicetak: ' . now()->translatedFormat('d F Y, H:i') . ' WIB');

                $hitung = $data->countBy(fn ($p) => $p->status->value);
                $s->setCellValue('A4', sprintf(
                    'Total: %d   |   Menunggu Verifikasi: %d   |   Diverifikasi: %d   |   Diterima: %d   |   Ditolak: %d',
                    $jumlah,
                    $hitung['menunggu_verifikasi'] ?? 0,
                    $hitung['diverifikasi'] ?? 0,
                    $hitung['diterima'] ?? 0,
                    $hitung['ditolak'] ?? 0,
                ));

                $tengah = [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical'   => Alignment::VERTICAL_CENTER,
                ];

                $s->getStyle("A1:{$akhir}1")->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 16, 'color' => ['rgb' => $navy]],
                    'alignment' => $tengah,
                ]);
                $s->getStyle("A2:{$akhir}2")->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $navy]],
                    'alignment' => $tengah,
                ]);
                $s->getStyle("A3:{$akhir}3")->applyFromArray([
                    'font'      => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '64748B']],
                    'alignment' => $tengah,
                ]);
                $s->getStyle("A4:{$akhir}4")->applyFromArray([
                    'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $navy]],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F0F7FF']],
                    'alignment' => $tengah,
                ]);
                $s->getRowDimension(1)->setRowHeight(28);
                $s->getRowDimension(4)->setRowHeight(22);

                // ---------- Header tabel ----------
                $s->getStyle("A{$header}:{$akhir}{$header}")->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $navy]],
                    'alignment' => $tengah + ['wrapText' => true],
                ]);
                $s->getRowDimension($header)->setRowHeight(30);

                // ---------- Isi tabel ----------
                $s->getStyle("A{$header}:{$akhir}{$terakhir}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'C5CFDB']],
                    ],
                ]);

                if ($jumlah > 0) {
                    $awal = $header + 1;

                    $s->getStyle("A{$awal}:{$akhir}{$terakhir}")
                        ->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                    foreach (['A', 'H', 'M', 'N'] as $kol) {
                        $s->getStyle("{$kol}{$awal}:{$kol}{$terakhir}")
                            ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    }

                    // Baris selang-seling + warna status
                    foreach ($data->values() as $i => $p) {
                        $baris = $awal + $i;

                        if ($i % 2 === 1) {
                            $s->getStyle("A{$baris}:{$akhir}{$baris}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F7FAFD');
                        }

                        $warna = self::WARNA_STATUS[$p->status->value] ?? null;
                        if ($warna) {
                            $s->getStyle("M{$baris}")->applyFromArray([
                                'font' => ['bold' => true, 'color' => ['rgb' => $warna['font']]],
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $warna['fill']]],
                            ]);
                        }
                    }
                }

                // ---------- Lebar kolom, filter, freeze, cetak ----------
                foreach (self::LEBAR_KOLOM as $kol => $lebar) {
                    $s->getColumnDimension($kol)->setWidth($lebar);
                }

                $s->setAutoFilter("A{$header}:{$akhir}{$terakhir}");
                $s->freezePane('A' . ($header + 1));

                $s->getPageSetup()
                    ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
                    ->setPaperSize(PageSetup::PAPERSIZE_A4)
                    ->setFitToPage(true)
                    ->setFitToWidth(1)
                    ->setFitToHeight(0)
                    ->setRowsToRepeatAtTopByStartAndEnd($header, $header);
            },
        ];
    }
}