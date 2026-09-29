<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pendaftar;

class DashboardController extends Controller
{
    public function index()
    {
        return [
            'total'        => Pendaftar::count(),
            'menunggu'     => Pendaftar::where('status', 'menunggu_verifikasi')->count(),
            'diverifikasi' => Pendaftar::where('status', 'diverifikasi')->count(),
            'diterima'     => Pendaftar::where('status', 'diterima')->count(),
            'ditolak'      => Pendaftar::where('status', 'ditolak')->count(),
            'terbaru'      => Pendaftar::latest()->limit(5)->get(['id', 'nomor_pendaftaran', 'nama_lengkap', 'status', 'created_at']),
        ];
    }
}