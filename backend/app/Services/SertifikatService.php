<?php

namespace App\Services;

use App\Enums\StatusPendaftar;
use App\Models\Pendaftar;
use App\Models\PengaturanSertifikat;
use App\Models\Sertifikat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SertifikatService
{
    /** Sertifikat hanya untuk pendaftar yang sudah diterima magang. */
    public function layak(Pendaftar $p): bool
    {
        return $p->status === StatusPendaftar::Diterima;
    }

    /** Peserta boleh unduh sendiri: fitur dinyalakan admin, status diterima, dan periode magang sudah selesai. */
    public function bolehUnduhPeserta(Pendaftar $p): bool
    {
        return PengaturanSertifikat::pesertaBisaUnduh()
            && $this->layak($p)
            && $p->periode_selesai !== null
            && $p->periode_selesai->lte(today());
    }

    /**
     * Pastikan setiap peserta (ketua + anggota kelompok) punya baris sertifikat.
     * Nomor dibuat sekali saat baris pertama kali dibuat, lalu tidak berubah kecuali diedit admin.
     *
     * @return \Illuminate\Support\Collection<int, Sertifikat>
     */
    public function pastikanAda(Pendaftar $p)
    {
        $p->loadMissing('anggota', 'bidang', 'program');

        $daftar = collect([null])->merge($p->anggota->pluck('id'));

        foreach ($daftar as $anggotaId) {
            $ada = Sertifikat::where('pendaftar_id', $p->id)->where('anggota_id', $anggotaId)->exists();
            if ($ada) {
                continue;
            }

            DB::transaction(function () use ($p, $anggotaId) {
                $tanggal = $this->tanggalOtomatis($p);
                $tahun   = (int) $tanggal->year;
                $urut    = ((int) Sertifikat::where('tahun', $tahun)->lockForUpdate()->max('nomor_urut')) + 1;

                Sertifikat::create([
                    'pendaftar_id' => $p->id,
                    'anggota_id'   => $anggotaId,
                    'tahun'        => $tahun,
                    'nomor_urut'   => $urut,
                    'nomor'        => $this->formatNomor($urut, $tahun),
                ]);
            });
        }

        return Sertifikat::with('anggota.bidang')
            ->where('pendaftar_id', $p->id)
            ->orderByRaw('anggota_id is not null')   // ketua dulu
            ->orderBy('id')
            ->get()
            ->each(fn ($s) => $s->setRelation('pendaftar', $p));
    }

    public function formatNomor(int $urut, int $tahun): string
    {
        $format = PengaturanSertifikat::semua()['format_nomor'] ?: PengaturanSertifikat::BAWAAN['format_nomor'];

        return str_replace(['{urut}', '{tahun}'], [str_pad((string) $urut, 2, '0', STR_PAD_LEFT), (string) $tahun], $format);
    }

    /** Tanggal terbit bawaan = tanggal selesai magang (real-time mengikuti data pendaftar). */
    protected function tanggalOtomatis(Pendaftar $p): Carbon
    {
        return ($p->periode_selesai ?? now())->copy();
    }

    /**
     * Nilai akhir yang dipakai untuk mencetak. Selalu dibaca ulang dari data pendaftar,
     * jadi perubahan nama/periode di data pendaftar langsung ikut ke sertifikat.
     */
    public function susun(Sertifikat $s): array
    {
        $p = $s->pendaftar;
        $a = $s->anggota;

        $otomatis = [
            'nama'            => $a?->nama_lengkap ?? $p->nama_lengkap,
            'instansi'        => $a?->universitas ?? $p->universitas,
            'periode_mulai'   => $p->periode_mulai?->format('Y-m-d'),
            'periode_selesai' => $p->periode_selesai?->format('Y-m-d'),
            'tanggal_terbit'  => $this->tanggalOtomatis($p)->format('Y-m-d'),
        ];

        $final = [];
        $diubah = [];
        foreach ($otomatis as $k => $nilaiOto) {
            $nilaiAdmin = $s->{$k};
            $nilaiAdmin = $nilaiAdmin instanceof Carbon ? $nilaiAdmin->format('Y-m-d') : $nilaiAdmin;
            $diubah[$k] = filled($nilaiAdmin);
            $final[$k]  = $diubah[$k] ? $nilaiAdmin : $nilaiOto;
        }

        return [
            'id'          => $s->id,
            'anggota_id'  => $s->anggota_id,
            'nomor'       => $s->nomor,
            'bidang'      => ($a?->bidang ?? $p->bidang)?->nama_bidang,
            'program'     => $p->program?->nama_program,
            ...$final,
            'otomatis'    => $otomatis,
            'diubah'      => $diubah,
        ];
    }

    public function susunSemua($koleksi): array
    {
        return $koleksi->map(fn ($s) => $this->susun($s))->values()->all();
    }
}