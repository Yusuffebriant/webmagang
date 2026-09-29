<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exports\PendaftarExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\PendaftarResource;
use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PendaftarController extends Controller
{
    public function index(Request $request)
    {
        $query = Pendaftar::with('program', 'bidang')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nomor_pendaftaran', 'like', "%{$search}%")
                  ->orWhere('nim', 'like', "%{$search}%");
            });
        }

        return PendaftarResource::collection($query->paginate(15));
    }

    public function show(Pendaftar $pendaftar)
    {
        return new PendaftarResource($pendaftar->load('dokumen', 'program', 'bidang'));
    }

    public function updateStatus(Request $request, Pendaftar $pendaftar)
    {
        $data = $request->validate([
            'status'  => ['required', 'in:menunggu_verifikasi,diverifikasi,diterima,ditolak'],
            'catatan' => ['nullable', 'string'],
        ]);

        $pendaftar->update($data);

        return new PendaftarResource($pendaftar->load('program', 'bidang'));
    }

    public function export()
    {
        return Excel::download(new PendaftarExport, 'data-pendaftar-' . now()->format('Ymd-His') . '.xlsx');
    }
}