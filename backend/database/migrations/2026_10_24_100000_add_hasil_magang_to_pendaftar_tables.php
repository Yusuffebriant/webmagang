<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Hasil magang per peserta (ketua = tabel pendaftar, tiap anggota = tabel anggota_pendaftar):
    // nilai akhir dan ringkasan kegiatan/hasil magang. Nullable karena diisi admin setelah magang berjalan.
    public function up(): void
    {
        foreach (['pendaftar', 'anggota_pendaftar'] as $tabel) {
            Schema::table($tabel, function (Blueprint $t) use ($tabel) {
                if (! Schema::hasColumn($tabel, 'nilai_akhir')) {
                    $t->unsignedTinyInteger('nilai_akhir')->nullable();
                }
                if (! Schema::hasColumn($tabel, 'hasil_magang')) {
                    $t->text('hasil_magang')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['pendaftar', 'anggota_pendaftar'] as $tabel) {
            Schema::table($tabel, function (Blueprint $t) use ($tabel) {
                foreach (['nilai_akhir', 'hasil_magang'] as $kolom) {
                    if (Schema::hasColumn($tabel, $kolom)) {
                        $t->dropColumn($kolom);
                    }
                }
            });
        }
    }
};