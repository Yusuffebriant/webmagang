<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\BidangMagang;
use App\Models\ProgramMagang;

class ProgramController extends Controller
{
    public function index()
    {
        return ProgramMagang::where('status', 'aktif')
            ->orderByDesc('id')
            ->get(['id', 'nama_program', 'deskripsi', 'periode_mulai', 'periode_selesai', 'durasi']);
    }

    public function bidang()
    {
        return BidangMagang::where('status', 'aktif')
            ->denganTerisi()
            ->orderBy('nama_bidang')
            ->get()
            ->map(function ($b) {
                $kuota = $b->kuota === null ? null : (int) $b->kuota;

                return [
                    'id'          => $b->id,
                    'nama_bidang' => $b->nama_bidang,
                    'deskripsi'   => $b->deskripsi,
                    'kuota'       => $kuota,                                        // null = belum diatur
                    'terisi'      => (int) $b->terisi,
                    'sisa_kuota'  => $kuota === null ? null : max($kuota - (int) $b->terisi, 0),
                ];
            })
            ->values();
    }
}