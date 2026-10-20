<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pendaftar;
use App\Models\PengaturanSertifikat;
use App\Models\Sertifikat;
use App\Services\SertifikatService;
use Illuminate\Http\Request;

class SertifikatController extends Controller
{
    public function __construct(protected SertifikatService $layanan) {}

    /** GET /admin/sertifikat/pengaturan */
    public function pengaturan()
    {
        return response()->json(['data' => PengaturanSertifikat::untukKlien(), 'bawaan' => PengaturanSertifikat::BAWAAN]);
    }

    /** PUT /admin/sertifikat/pengaturan */
    public function simpanPengaturan(Request $request)
    {
        $data = $request->validate([
            'instansi_nama'      => ['required', 'string', 'max:255'],
            'instansi_alamat'    => ['nullable', 'string', 'max:500'],
            'instansi_kontak'    => ['nullable', 'string', 'max:255'],
            'judul'              => ['required', 'string', 'max:50'],
            'kalimat_pembuka'    => ['required', 'string', 'max:255'],
            'kalimat_isi'        => ['required', 'string', 'max:1000'],
            'kota'               => ['required', 'string', 'max:100'],
            'jabatan_pejabat'    => ['required', 'string', 'max:255'],
            'nama_pejabat'       => ['required', 'string', 'max:150'],
            'nip_pejabat'        => ['nullable', 'string', 'max:50'],
            'format_nomor'       => ['required', 'string', 'max:100', 'regex:/\{urut\}/'],
            'peserta_bisa_unduh' => ['required', 'in:0,1'],
        ], [
            'format_nomor.regex' => 'Format nomor harus memuat {urut}, contoh: {urut}/BKPSDM/SERT/{tahun}.',
        ]);

        PengaturanSertifikat::simpan($data);

        return response()->json(['data' => PengaturanSertifikat::untukKlien()]);
    }

    /** POST /admin/sertifikat/ttd — unggah gambar tanda tangan pejabat (PNG/JPG, maks 512 KB). */
    public function unggahTtd(Request $request)
    {
        $request->validate([
            'ttd' => ['required', 'file', 'mimes:png,jpg,jpeg', 'max:512'],
        ], [
            'ttd.mimes' => 'Gambar tanda tangan harus berformat PNG atau JPG.',
            'ttd.max'   => 'Ukuran gambar tanda tangan maksimal 512 KB.',
        ]);

        PengaturanSertifikat::simpanTtd($request->file('ttd'));

        return response()->json(['data' => PengaturanSertifikat::untukKlien()]);
    }

    /** DELETE /admin/sertifikat/ttd */
    public function hapusTtd()
    {
        PengaturanSertifikat::hapusTtd();

        return response()->json(['data' => PengaturanSertifikat::untukKlien()]);
    }

    /** GET /admin/pendaftar/{pendaftar}/sertifikat */
    public function index(Pendaftar $pendaftar)
    {
        if (! $this->layanan->layak($pendaftar)) {
            return response()->json([
                'message' => 'Sertifikat hanya tersedia untuk pendaftar berstatus Diterima.',
            ], 422);
        }

        return response()->json([
            'data' => [
                'pengaturan' => PengaturanSertifikat::untukKlien(),
                'sertifikat' => $this->layanan->susunSemua($this->layanan->pastikanAda($pendaftar)),
            ],
        ]);
    }

    /** PATCH /admin/sertifikat/{sertifikat}  — kosongkan field = kembali otomatis */
    public function update(Request $request, Sertifikat $sertifikat)
    {
        $data = $request->validate([
            'nomor'           => ['required', 'string', 'max:100'],
            'nama'            => ['nullable', 'string', 'max:255'],
            'instansi'        => ['nullable', 'string', 'max:255'],
            'periode_mulai'   => ['nullable', 'date'],
            'periode_selesai' => ['nullable', 'date'],
            'tanggal_terbit'  => ['nullable', 'date'],
        ]);

        foreach (['nama', 'instansi', 'periode_mulai', 'periode_selesai', 'tanggal_terbit'] as $k) {
            $data[$k] = filled($data[$k] ?? null) ? $data[$k] : null;
        }

        if ($data['periode_mulai'] && $data['periode_selesai'] && $data['periode_selesai'] < $data['periode_mulai']) {
            return response()->json([
                'message' => 'Periode selesai tidak boleh sebelum periode mulai.',
                'errors'  => ['periode_selesai' => ['Periode selesai tidak boleh sebelum periode mulai.']],
            ], 422);
        }

        $sertifikat->update($data);
        $sertifikat->load('pendaftar.bidang', 'pendaftar.program', 'anggota.bidang');

        return response()->json(['data' => $this->layanan->susun($sertifikat)]);
    }
}