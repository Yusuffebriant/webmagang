<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePendaftarRequest;
use App\Http\Resources\PendaftarResource;
use App\Models\Pendaftar;
use App\Services\NomorPendaftaranService;
use Illuminate\Support\Facades\DB;

class PendaftaranController extends Controller
{
    public function __construct(protected NomorPendaftaranService $nomorService)
    {
    }

    public function store(StorePendaftarRequest $request)
    {
        $data = $request->validated();
        $dokumen = $data['dokumen'];
        unset($data['dokumen']);

        $pendaftar = DB::transaction(function () use ($data, $dokumen) {
            $pendaftar = Pendaftar::create([
                ...$data,
                'nomor_pendaftaran' => $this->nomorService->generate(),
                'status'            => 'menunggu_verifikasi',
            ]);

            foreach ($dokumen as $item) {
                $path = $item['file']->store('dokumen-pendaftar', 'public');

                $pendaftar->dokumen()->create([
                    'jenis_dokumen' => $item['jenis_dokumen'],
                    'file'          => $path,
                ]);
            }

            return $pendaftar;
        });

        return response()->json([
            'message' => 'Pendaftaran berhasil dikirim.',
            'data'    => new PendaftarResource($pendaftar->load('dokumen', 'program', 'bidang')),
        ], 201);
    }
}