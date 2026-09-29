<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PendaftarResource;
use App\Models\Pendaftar;

class CekStatusController extends Controller
{
    public function show(string $nomor)
    {
        $pendaftar = Pendaftar::with('program', 'bidang')
            ->where('nomor_pendaftaran', $nomor)
            ->first();

        if (! $pendaftar) {
            return response()->json([
                'message' => 'Nomor pendaftaran tidak ditemukan.',
            ], 404);
        }

        return new PendaftarResource($pendaftar);
    }
}