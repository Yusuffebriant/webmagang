<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusPendaftar;
use App\Http\Controllers\Controller;
use App\Models\BidangMagang;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class KuotaController extends Controller
{
    public function index()
    {
        $data = $this->query()->orderBy('nama_bidang')->get();

        return ['data' => $data->map(fn ($b) => $this->format($b))->values()];
    }

    public function store(Request $request)
    {
        // Rapikan spasi berlebih pada nama sebelum divalidasi
        $request->merge([
            'nama_bidang' => preg_replace('/\s+/', ' ', trim((string) $request->input('nama_bidang'))),
        ]);

        $data = $request->validate([
            'nama_bidang' => ['required', 'string', 'max:100', 'unique:bidang_magang,nama_bidang'],
            'deskripsi'   => ['nullable', 'string', 'max:500'],
            'kuota'       => ['nullable', 'integer', 'min:0', 'max:1000'],
        ], [
            'nama_bidang.required' => 'Nama bidang wajib diisi.',
            'nama_bidang.max'      => 'Nama bidang maksimal 100 karakter.',
            'nama_bidang.unique'   => 'Nama bidang sudah terdaftar.',
            'deskripsi.max'        => 'Deskripsi maksimal 500 karakter.',
            'kuota.integer'        => 'Kuota harus berupa angka bulat.',
            'kuota.min'            => 'Kuota tidak boleh kurang dari 0.',
            'kuota.max'            => 'Kuota maksimal 1000.',
        ]);

        $bidang = BidangMagang::create([
            'nama_bidang' => $data['nama_bidang'],
            'deskripsi'   => $data['deskripsi'] ?? null,
            'kuota'       => isset($data['kuota']) ? (int) $data['kuota'] : null,
            'status'      => 'aktif',
        ]);

        return response()->json(['data' => $this->format($this->query()->findOrFail($bidang->id))], 201);
    }

    public function update(Request $request, BidangMagang $bidang)
    {
        $request->validate([
            'kuota' => ['present', 'nullable', 'integer', 'min:0', 'max:1000'],
        ], [
            'kuota.present' => 'Kuota wajib dikirim.',
            'kuota.integer' => 'Kuota harus berupa angka bulat.',
            'kuota.min'     => 'Kuota tidak boleh kurang dari 0.',
            'kuota.max'     => 'Kuota maksimal 1000.',
        ]);

        $kuota = $request->input('kuota');
        $kuota = ($kuota === null || $kuota === '') ? null : (int) $kuota;

        $terisi = $bidang->hitungTerisi();

        if ($kuota !== null && $kuota < $terisi) {
            $pesan = "Kuota tidak boleh lebih kecil dari jumlah peserta yang sudah diterima ({$terisi}).";

            return response()->json(['message' => $pesan, 'errors' => ['kuota' => [$pesan]]], 422);
        }

        $bidang->update(['kuota' => $kuota]);

        return ['data' => $this->format($this->query()->findOrFail($bidang->id))];
    }

    public function destroy(BidangMagang $bidang)
    {
        $pesan = 'Bidang tidak dapat dihapus karena sudah memiliki pendaftar.';
        $tolak = fn () => response()->json(['message' => $pesan, 'errors' => ['bidang' => [$pesan]]], 422);

        if ($bidang->pendaftar()->exists() || $bidang->anggota()->exists()) {
            return $tolak();
        }

        try {
            $bidang->delete();
        } catch (QueryException) {
            // Cadangan: foreign key menolak jika ada pendaftar yang masuk bersamaan
            return $tolak();
        }

        return response()->json(['message' => 'Bidang berhasil dihapus.']);
    }

    private function query()
    {
        return BidangMagang::denganTerisi()->withCount('pendaftar as total_pendaftar');
    }

    private function format(BidangMagang $b): array
    {
        $kuota  = $b->kuota === null ? null : (int) $b->kuota;
        $terisi = (int) $b->terisi;

        return [
            'id'               => $b->id,
            'nama_bidang'      => $b->nama_bidang,
            'status'           => $b->status,
            'kuota'            => $kuota,
            'terisi'           => $terisi,
            'sisa'             => $kuota === null ? null : max($kuota - $terisi, 0),
            'total_pendaftar'  => (int) $b->total_pendaftar,
        ];
    }
}