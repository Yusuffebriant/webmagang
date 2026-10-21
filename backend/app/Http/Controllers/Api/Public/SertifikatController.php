<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Pendaftar;
use App\Models\PengaturanSertifikat;
use App\Services\SertifikatService;

class SertifikatController extends Controller
{
    public function __construct(protected SertifikatService $layanan) {}

    /** GET /public/sertifikat/{nomor} — data sertifikat untuk dicetak di browser peserta. */
    public function show(string $nomor)
    {
        $pendaftar = Pendaftar::with('bidang', 'program')->where('nomor_pendaftaran', $nomor)->first();

        if (! $pendaftar) {
            return response()->json(['message' => 'Nomor pendaftaran tidak ditemukan.'], 404);
        }

        if (! $this->layanan->bolehUnduhPeserta($pendaftar)) {
            return response()->json(['message' => 'Sertifikat belum tersedia. Sertifikat dapat diunduh setelah periode magang selesai.'], 403);
        }

        return response()->json([
            'data' => [
                'pengaturan' => PengaturanSertifikat::untukKlien(),
                'sertifikat' => $this->layanan->susunSemua($this->layanan->pastikanAda($pendaftar)),
            ],
        ]);
    }
}