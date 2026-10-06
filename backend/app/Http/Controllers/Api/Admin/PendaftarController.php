<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusPendaftar;
use App\Exports\PendaftarExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\PendaftarResource;
use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class PendaftarController extends Controller
{
    public function index(Request $request)
    {
        $query = Pendaftar::with('program', 'bidang')->withCount('anggota')->latest();

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
        return new PendaftarResource($pendaftar->load('dokumen', 'program', 'bidang', 'anggota'));
    }

    public function updateStatus(Request $request, Pendaftar $pendaftar)
    {
        $data = $request->validate([
            'status'  => ['required', 'in:menunggu_verifikasi,diverifikasi,diterima,ditolak'],
            'catatan' => ['nullable', 'string'],
        ]);

        // Pendaftar baru boleh diterima jika LOA sudah diunggah
        if ($data['status'] === StatusPendaftar::Diterima->value && blank($pendaftar->loa_file)) {
            return response()->json([
                'message' => 'LOA belum diunggah.',
                'errors'  => ['status' => ['LOA wajib diunggah sebelum pendaftar diterima magang.']],
            ], 422);
        }

        // Kuota bidang: tolak jika sudah penuh (kuota NULL = tidak dibatasi)
        if ($data['status'] === StatusPendaftar::Diterima->value && $pendaftar->status !== StatusPendaftar::Diterima) {
            $bidang = $pendaftar->bidang;

            if ($bidang && $bidang->kuota !== null) {
                $terisi = $bidang->pendaftar()->where('status', StatusPendaftar::Diterima->value)->count();

                if ($terisi >= (int) $bidang->kuota) {
                    $pesan = "Kuota bidang {$bidang->nama_bidang} sudah penuh ({$terisi}/{$bidang->kuota}).";

                    return response()->json(['message' => $pesan, 'errors' => ['status' => [$pesan]]], 422);
                }
            }
        }

        $pendaftar->update($data);

        return new PendaftarResource($pendaftar->load('program', 'bidang'));
    }

    public function unggahLoa(Request $request, Pendaftar $pendaftar)
    {
        if ($pendaftar->status !== StatusPendaftar::Diverifikasi) {
            return response()->json([
                'message' => 'LOA hanya dapat diunggah untuk pendaftar berstatus Diverifikasi.',
                'errors'  => ['loa' => ['LOA hanya dapat diunggah untuk pendaftar berstatus Diverifikasi.']],
            ], 422);
        }

        $request->validate([
            'loa' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ], [
            'loa.required' => 'File LOA wajib dipilih.',
            'loa.mimes'    => 'File LOA harus berformat PDF, JPG, atau PNG.',
            'loa.max'      => 'Ukuran file LOA maksimal 2MB.',
        ]);

        $lama = $pendaftar->loa_file;
        $path = $request->file('loa')->store('loa-pendaftar', 'public');
        $pendaftar->update(['loa_file' => $path]);

        if ($lama) {
            Storage::disk('public')->delete($lama);
        }

        return new PendaftarResource($pendaftar->load('program', 'bidang'));
    }

    public function export()
    {
        return Excel::download(new PendaftarExport, 'data-pendaftar-' . now()->format('Ymd-His') . '.xlsx');
    }
}