<?php

namespace App\Services;

use App\Models\Pendaftar;
use Illuminate\Support\Facades\DB;

class NomorPendaftaranService
{
    /**
     * Format: MGG-YYYYMM-0001
     */
    public function generate(): string
    {
        return DB::transaction(function () {
            $prefix = 'MGG-' . now()->format('Ym') . '-';

            $last = Pendaftar::where('nomor_pendaftaran', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderByDesc('nomor_pendaftaran')
                ->first();

            $urutan = $last
                ? ((int) substr($last->nomor_pendaftaran, -4)) + 1
                : 1;

            return $prefix . str_pad($urutan, 4, '0', STR_PAD_LEFT);
        });
    }
}