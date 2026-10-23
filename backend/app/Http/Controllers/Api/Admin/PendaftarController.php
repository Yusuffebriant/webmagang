<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusPendaftar;
use App\Exports\DaftarMagangExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\PendaftarResource;
use App\Models\BidangMagang;
use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    /** PATCH /admin/pendaftar/{id}: koreksi data diri & pendidikan ketua + anggota (tanpa ubah status/bidang/foto). */
    public function update(Request $request, Pendaftar $pendaftar)
    {
        $orang = [
            'nama_lengkap'       => ['required', 'string', 'max:150'],
            'nim'                => ['required', 'string', 'max:30', 'regex:/^[0-9]+$/'],
            'nik'                => ['required', 'digits:16'],
            'tempat_lahir'       => ['required', 'string', 'max:100'],
            'tanggal_lahir'      => ['required', 'date', 'before:today'],
            'jenis_kelamin'      => ['required', 'in:L,P'],
            'alamat'             => ['required', 'string'],
            'no_whatsapp'        => ['required', 'string', 'max:20'],
            'email'              => ['required', 'email', 'max:150'],
            'keahlian'           => ['nullable', 'string', 'max:500'],
            'universitas'        => ['required', 'string', 'max:150'],
            'alamat_universitas' => ['nullable', 'string', 'max:500'],
            'fakultas'           => ['nullable', 'string', 'max:150'],
            'program_studi'      => ['required', 'string', 'max:150'],
            'semester'           => ['required', 'integer', 'min:1', 'max:14'],
        ];

        $aturan = $orang + [
            'periode_mulai'   => ['required', 'date'],
            'periode_selesai' => ['required', 'date', 'after:periode_mulai'],
            'anggota'         => ['nullable', 'array'],
            'anggota.*.id'    => ['required', 'integer'],
        ];
        foreach ($orang as $kolom => $rule) {
            $aturan["anggota.*.{$kolom}"] = $rule;
        }

        $data = $request->validate($aturan, [
            'nim.regex'                  => 'NIM hanya boleh berisi angka.',
            'anggota.*.nim.regex'        => 'NIM anggota hanya boleh berisi angka.',
            'nik.digits'                 => 'NIK harus terdiri dari 16 digit angka.',
            'anggota.*.nik.digits'       => 'NIK anggota harus terdiri dari 16 digit angka.',
            'periode_selesai.after'      => 'Periode selesai harus setelah periode mulai.',
        ]);

        $anggota = $data['anggota'] ?? [];
        unset($data['anggota']);

        $pendaftar->load('anggota');
        $idAnggota = $pendaftar->anggota->pluck('id')->all();
        foreach ($anggota as $a) {
            if (! in_array((int) $a['id'], $idAnggota, true)) {
                return response()->json([
                    'message' => 'Anggota tidak termasuk dalam pendaftaran ini.',
                    'errors'  => ['anggota' => ['Anggota tidak termasuk dalam pendaftaran ini.']],
                ], 422);
            }
        }

        DB::transaction(function () use ($pendaftar, $data, $anggota) {
            $pendaftar->update($data);

            foreach ($anggota as $a) {
                $id = $a['id'];
                unset($a['id']);
                $pendaftar->anggota->firstWhere('id', $id)?->update($a);
            }
        });

        return new PendaftarResource($pendaftar->fresh()->load('dokumen', 'program', 'bidang', 'anggota.bidang'));
    }

    /** PUT /admin/pendaftar/{id}/hasil: nilai akhir dan ringkasan kegiatan/hasil magang (ketua + anggota). */
    public function updateHasil(Request $request, Pendaftar $pendaftar)
    {
        if ($pendaftar->status !== StatusPendaftar::Diterima) {
            $pesan = 'Hasil magang hanya dapat diisi untuk peserta berstatus Diterima.';

            return response()->json(['message' => $pesan, 'errors' => ['hasil' => [$pesan]]], 422);
        }

        $data = $request->validate([
            'nilai_akhir'          => ['nullable', 'integer', 'min:0', 'max:100'],
            'hasil_magang'         => ['nullable', 'string', 'max:5000'],
            'anggota'              => ['nullable', 'array'],
            'anggota.*.id'         => ['required', 'integer'],
            'anggota.*.nilai_akhir'  => ['nullable', 'integer', 'min:0', 'max:100'],
            'anggota.*.hasil_magang' => ['nullable', 'string', 'max:5000'],
        ], [
            'nilai_akhir.max'          => 'Nilai maksimal 100.',
            'nilai_akhir.min'          => 'Nilai minimal 0.',
            'nilai_akhir.integer'      => 'Nilai harus berupa angka bulat.',
            'anggota.*.nilai_akhir.max' => 'Nilai anggota maksimal 100.',
            'anggota.*.nilai_akhir.min' => 'Nilai anggota minimal 0.',
            'anggota.*.nilai_akhir.integer' => 'Nilai anggota harus berupa angka bulat.',
        ]);

        $anggota = $data['anggota'] ?? [];
        unset($data['anggota']);

        $pendaftar->load('anggota');

        DB::transaction(function () use ($pendaftar, $data, $anggota) {
            $pendaftar->update($data);

            foreach ($anggota as $a) {
                $id = $a['id'];
                unset($a['id']);
                $pendaftar->anggota->firstWhere('id', (int) $id)?->update($a);
            }
        });

        return new PendaftarResource($pendaftar->fresh()->load('dokumen', 'program', 'bidang', 'anggota.bidang'));
    }

    /** POST /admin/pendaftar/{id}/foto: tambah/ganti foto diri ketua, atau anggota bila anggota_id diisi. */
    public function unggahFoto(Request $request, Pendaftar $pendaftar)
    {
        $request->validate([
            'foto'       => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'anggota_id' => ['nullable', 'integer'],
        ], [
            'foto.required' => 'File foto wajib dipilih.',
            'foto.mimes'    => 'Foto harus berformat JPG atau PNG.',
            'foto.max'      => 'Ukuran foto maksimal 2MB.',
            'foto.uploaded' => 'Foto gagal diunggah. Pastikan ukurannya maksimal 2MB.',
        ]);

        $target = $pendaftar;
        if ($request->filled('anggota_id')) {
            $target = $pendaftar->anggota()->whereKey($request->integer('anggota_id'))->first();

            if (! $target) {
                return response()->json([
                    'message' => 'Anggota tidak termasuk dalam pendaftaran ini.',
                    'errors'  => ['anggota_id' => ['Anggota tidak termasuk dalam pendaftaran ini.']],
                ], 422);
            }
        }

        $lama = $target->foto;
        $path = $request->file('foto')->store('foto-pendaftar', 'public');
        $target->update(['foto' => $path]);

        if ($lama) {
            Storage::disk('public')->delete($lama);
        }

        return new PendaftarResource($pendaftar->fresh()->load('dokumen', 'program', 'bidang', 'anggota.bidang'));
    }

    public function export()
    {
        return Excel::download(new DaftarMagangExport, 'daftar-magang-' . now()->format('Ymd-His') . '.xlsx');
    }
}