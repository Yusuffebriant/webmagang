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
            ->orderBy('nama_bidang')
            ->get(['id', 'nama_bidang', 'deskripsi']);
    }
}