<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePendaftarRequest;
use App\Http\Resources\PendaftarResource;
use App\Models\Pendaftar;
use App\Services\NomorPendaftaranService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PendaftaranController extends Controller
{
    public function __construct(protected NomorPendaftaranService $nomorService)
    {
    }

    public function store(StorePendaftarRequest $request)
    {
        $data = $request->validated();
        $dokumen = $data['dokumen'];
        $anggota = $data['anggota'] ?? [];
        unset($data['dokumen'], $data['anggota']);

        // Anggota tanpa pilihan bidang ikut bidang ketua
        $anggota = array_map(
            fn ($a) => array_merge($a, ['bidang_magang_id' => $a['bidang_magang_id'] ?? $data['bidang_magang_id']]),
            $anggota
        );

        // Path file yang sudah ditulis ke disk. Bila penyimpanan database gagal, semuanya dihapus lagi
        // supaya tidak ada file yatim.
        $tersimpan = [];

        try {
            $pendaftar = DB::transaction(function () use ($data, $dokumen, $anggota, &$tersimpan) {
                $simpan = function ($file, string $folder) use (&$tersimpan) {
                    return $tersimpan[] = $file->store($folder, 'public');
                };

                // Foto diri ketua & anggota: simpan file, lalu ganti isinya dengan path-nya.
                $data['foto'] = $simpan($data['foto'], 'foto-pendaftar');
                $anggota = array_map(function ($a) use ($simpan) {
                    $a['foto'] = $simpan($a['foto'], 'foto-pendaftar');

                    return $a;
                }, $anggota);

                $pendaftar = Pendaftar::create([
                    ...$data,
                    'nomor_pendaftaran' => $this->nomorService->generate(),
                    'status'            => 'menunggu_verifikasi',
                ]);

                if ($anggota) {
                    $pendaftar->anggota()->createMany($anggota);
                }

                foreach ($dokumen as $item) {
                    $path = $simpan($item['file'], 'dokumen-pendaftar');

                    $pendaftar->dokumen()->create([
                        'jenis_dokumen' => $item['jenis_dokumen'],
                        'file'          => $path,
                    ]);
                }

                return $pendaftar;
            });
        } catch (\Throwable $e) {
            if ($tersimpan) {
                Storage::disk('public')->delete($tersimpan);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Pendaftaran berhasil dikirim.',
            'data'    => new PendaftarResource($pendaftar->load('dokumen', 'program', 'bidang', 'anggota.bidang')),
        ], 201);
    }
}