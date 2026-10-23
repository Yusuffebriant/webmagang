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

/**
 * Unduhan dari halaman admin "Data Pendaftar": data diri lengkap per orang.
 * Satu baris = satu orang (ketua, lalu anggota kelompoknya tepat di bawahnya).
 * Mengikuti filter status & pencarian yang sedang aktif di halaman.
 */
class DataDiriPendaftarExport extends DefaultValueBinder implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithCustomStartCell,
    WithCustomValueBinder,
    WithEvents,
    WithTitle
{
    private const BARIS_HEADER = 5;
    private const KOLOM_AKHIR  = 'W';

    // NIM (E), NIK (F), No. WhatsApp (L): simpan sebagai teks supaya angka nol depan tidak hilang.
    private const KOLOM_TEKS = ['E', 'F', 'L'];

    private const LEBAR_KOLOM = [
        'A' => 8,  'B' => 26, 'C' => 14, 'D' => 32, 'E' => 20, 'F' => 24, 'G' => 20, 'H' => 17,
        'I' => 17, 'J' => 46, 'K' => 32, 'L' => 20, 'M' => 34, 'N' => 32, 'O' => 32, 'P' => 12,
        'Q' => 12, 'R' => 28, 'S' => 32, 'T' => 17, 'U' => 17, 'V' => 22, 'W' => 20,
    ];

    private ?Collection $baris = null;
    private int $no = 0;

    /**
     * @param  string|null  $status  nilai enum StatusPendaftar, null = semua
     * @param  string|null  $cari    kata kunci pencarian (nama / no. pendaftaran / NIM / universitas)
     */
    public function __construct(private ?string $status = null, private ?string $cari = null)
    {
    }

    public function collection(): Collection
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

        // Ratakan: ketua lalu anggotanya, masing-masing satu baris.
        return $this->baris = $query->get()->flatMap(function (Pendaftar $p) {
            $baris = collect([['orang' => $p, 'ketua' => $p, 'peran' => 'Ketua']]);

            foreach ($p->anggota as $i => $a) {
                $baris->push(['orang' => $a, 'ketua' => $p, 'peran' => 'Anggota ' . ($i + 1)]);
            }

            return $baris;
        })->values();
    }

    public function startCell(): string
    {
        return 'A' . self::BARIS_HEADER;
    }

    public function title(): string
    {
        return 'Data Diri Pendaftar';
    }

    public function headings(): array
    {
        return [
            'No', 'Nomor Pendaftaran', 'Peran', 'Nama Lengkap', 'NIM', 'NIK',
            'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Alamat', 'Email', 'No. HP / WhatsApp',
            'Universitas / Kampus', 'Fakultas', 'Program Studi / Jurusan', 'Jenjang', 'Semester',
            'Program Magang', 'Bidang', 'Periode Mulai', 'Periode Selesai', 'Status', 'Tanggal Daftar',
        ];
    }

    public function map($row): array
    {
        $o = $row['orang'];
        $k = $row['ketua'];

        return [
            ++$this->no,
            $k->nomor_pendaftaran,
            $row['peran'],
            $o->nama_lengkap,
            $o->nim,
            $o->nik,
            $o->tempat_lahir,
            $o->tanggal_lahir?->format('d-m-Y'),
            match ($o->jenis_kelamin) {
                'L'     => 'Laki-laki',
                'P'     => 'Perempuan',
                default => $o->jenis_kelamin,
            },
            $o->alamat,
            $o->email,
            $o->no_whatsapp,
            $o->universitas,
            $o->fakultas,
            $o->program_studi,
            $o->jenjang ?? null,
            $o->semester,
            $k->program?->nama_program,
            ($o->bidang ?? $k->bidang)?->nama_bidang,
            $k->periode_mulai?->format('d-m-Y'),
            $k->periode_selesai?->format('d-m-Y'),
            $k->status->label(),
            $k->created_at->format('d-m-Y H:i'),
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
                $s        = $event->sheet->getDelegate();
                $akhir    = self::KOLOM_AKHIR;
                $header   = self::BARIS_HEADER;
                $baris    = $this->baris ?? collect();
                $jumlah   = $baris->count();
                $terakhir = $header + max($jumlah, 1);
                $hitam    = '000000';
                $tengah   = [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical'   => Alignment::VERTICAL_CENTER,
                ];
                $garis = [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $hitam]],
                ];

                // Semua polos putih, garis tabel hitam tipis yang jelas terlihat.
                $s->setShowGridlines(false);
                $s->getStyle("A1:{$akhir}" . ($terakhir + 1))->getFont()->setSize(10)->getColor()->setRGB($hitam);

                // ---------- Judul ----------
                foreach ([1, 2, 3] as $r) {
                    $s->mergeCells("A{$r}:{$akhir}{$r}");
                }

                $label = $this->status
                    ? (\App\Enums\StatusPendaftar::tryFrom($this->status)?->label() ?? $this->status)
                    : 'Semua status';
                $orang = $baris->filter(fn ($b) => $b['peran'] === 'Ketua')->count();

                $s->setCellValue('A1', 'DATA DIRI PENDAFTAR MAGANG');
                $s->setCellValue('A2', 'BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA (BKPSDM) KOTA YOGYAKARTA');
                // Jumlah dihitung otomatis oleh Excel dan ikut berubah saat tabel difilter.
                $dAwal  = $header + 1;
                $dAkhir = $terakhir;
                $fPendaftar = "SUMPRODUCT(SUBTOTAL(103,OFFSET(C{$dAwal},ROW(C{$dAwal}:C{$dAkhir})-ROW(C{$dAwal}),0))*(C{$dAwal}:C{$dAkhir}=\"Ketua\"))";
                $fOrang     = "SUBTOTAL(103,D{$dAwal}:D{$dAkhir})";
                $teksCetak  = sprintf(
                    'Dicetak: %s WIB   |   Filter: %s%s   |   ',
                    now()->translatedFormat('d F Y, H:i'),
                    $label,
                    $this->cari ? ' · cari "' . $this->cari . '"' : '',
                );
                $s->setCellValue('A3', '="' . str_replace('"', '""', $teksCetak) . '"&' . $fPendaftar . '&" pendaftar, "&' . $fOrang . '&" orang"');

                $s->getStyle("A1:{$akhir}3")->applyFromArray(['font' => ['bold' => true, 'size' => 11], 'alignment' => $tengah]);
                $s->getStyle("A3:{$akhir}3")->applyFromArray(['font' => ['bold' => false, 'size' => 9]]);

                // ---------- Header tabel ----------
                $s->getStyle("A{$header}:{$akhir}{$header}")->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0B2A4A']],
                    'alignment' => $tengah + ['wrapText' => true],
                    'borders'   => $garis,
                ]);
                $s->getRowDimension($header)->setRowHeight(32);

                // ---------- Isi tabel: semua sel bergaris hitam tipis ----------
                $s->getStyle("A{$header}:{$akhir}{$terakhir}")->applyFromArray(['borders' => $garis]);

                if ($jumlah > 0) {
                    $awal = $header + 1;

                    $s->getStyle("A{$awal}:{$akhir}{$terakhir}")
                        ->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                    $s->getStyle("J{$awal}:J{$terakhir}")->getAlignment()->setWrapText(true);

                    foreach (['A', 'C', 'H', 'I', 'Q', 'T', 'U', 'V', 'W'] as $kol) {
                        $s->getStyle("{$kol}{$awal}:{$kol}{$terakhir}")
                            ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    }

                    // Per baris: ketua ditebalkan, anggota menjorok sedikit.
                    foreach ($baris->values() as $i => $b) {
                        $r     = $awal + $i;
                        $ketua = $b['peran'] === 'Ketua';

                        $baris_alamat = max(1, (int) ceil(mb_strlen((string) $b['orang']->alamat) / 44));
                        $s->getRowDimension($r)->setRowHeight(max(20, 14 * $baris_alamat + 6));

                        if ($ketua) {
                            $s->getStyle("C{$r}:D{$r}")->getFont()->setBold(true);
                        }

                        foreach (['B', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'O', 'R', 'S'] as $kol) {
                            $s->getStyle("{$kol}{$r}")->getAlignment()
                                ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                                ->setIndent($kol === 'D' && ! $ketua ? 2 : 1);
                        }
                    }
                }

                // ---------- Baris total (putih, bergaris) ----------
                $total = $terakhir + 1;
                $s->mergeCells("A{$total}:D{$total}");
                $s->setCellValue("A{$total}", '="TOTAL  "&' . $fPendaftar . '&" pendaftar, "&' . $fOrang . '&" orang"');
                $s->getStyle("A{$total}:{$akhir}{$total}")->applyFromArray([
                    'font'      => ['bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders'   => $garis,
                ]);
                $s->getRowDimension($total)->setRowHeight(22);

                // ---------- Lebar kolom, filter, freeze, cetak ----------
                foreach (self::LEBAR_KOLOM as $kol => $lebar) {
                    $s->getColumnDimension($kol)->setWidth($lebar);
                }

                $s->setAutoFilter("A{$header}:{$akhir}{$terakhir}");
                $s->freezePane('E' . ($header + 1));

                $s->getPageSetup()
                    ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
                    ->setPaperSize(PageSetup::PAPERSIZE_A3)
                    ->setFitToPage(true)
                    ->setFitToWidth(1)
                    ->setFitToHeight(0)
                    ->setRowsToRepeatAtTopByStartAndEnd($header, $header);
            },
        ];
    }
}