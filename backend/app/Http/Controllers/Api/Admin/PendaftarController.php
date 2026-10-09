<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusPendaftar;
use App\Exports\PendaftarExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\PendaftarResource;
use App\Models\BidangMagang;
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
        return new PendaftarResource($pendaftar->load('dokumen', 'program', 'bidang', 'anggota.bidang'));
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

        // Kuota bidang dihitung per orang (ketua + tiap anggota di bidangnya masing-masing).
        // Satu kelompok diterima sekaligus: semua bidang yang dipilih harus punya sisa kuota yang cukup.
        // Kuota NULL = tidak dibatasi.
        if ($data['status'] === StatusPendaftar::Diterima->value && $pendaftar->status !== StatusPendaftar::Diterima) {
            $pendaftar->loadMissing('anggota');
            $butuh = collect([$pendaftar->bidang_magang_id])
                ->merge($pendaftar->anggota->pluck('bidang_magang_id'))
                ->filter()
                ->countBy();

            $daftarBidang = BidangMagang::whereIn('id', $butuh->keys())->get()->keyBy('id');
            $kurang = [];

            foreach ($butuh as $idBidang => $jumlah) {
                $bidang = $daftarBidang[$idBidang] ?? null;

                if (! $bidang || $bidang->kuota === null) {
                    continue;
                }

                $terisi = $bidang->hitungTerisi();

                if ($terisi + $jumlah > (int) $bidang->kuota) {
                    $sisa = max((int) $bidang->kuota - $terisi, 0);
                    $kurang[] = ['bidang' => $bidang, 'butuh' => $jumlah, 'sisa' => $sisa, 'terisi' => $terisi];
                }
            }

            if ($kurang) {
                if ($butuh->sum() === 1) {
                    $k = $kurang[0];
                    $pesan = "Kuota bidang {$k['bidang']->nama_bidang} sudah penuh ({$k['terisi']}/{$k['bidang']->kuota}).";
                } else {
                    $rincian = collect($kurang)->map(fn ($k) => "{$k['bidang']->nama_bidang} (butuh {$k['butuh']}, sisa {$k['sisa']} dari kuota {$k['bidang']->kuota})")->implode('; ');
                    $pesan = "Kuota bidang belum cukup untuk menerima seluruh kelompok ini: {$rincian}. Tambah kuota bidang tersebut atau ubah bidang anggota terlebih dahulu.";
                }

                return response()->json(['message' => $pesan, 'errors' => ['status' => [$pesan]]], 422);
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