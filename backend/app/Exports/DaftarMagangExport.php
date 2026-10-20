<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * File unduhan admin:
 *  - Sheet 1 "Daftar Magang"  : tampilan seperti kertas rekap penempatan (per bidang, per gelombang).
 *  - Sheet 2 "Data Pendaftar" : data lengkap seluruh pendaftar (export lama).
 * Hapus baris PendaftarExport di bawah bila sheet kedua tidak diperlukan.
 */
class DaftarMagangExport implements Export, WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            new DaftarMagangSheet,
            new PendaftarExport,
        ];
    }
}