<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Foto diri + keterangan keahlian untuk ketua (tabel pendaftar) dan tiap anggota kelompok.
    // Dibuat nullable agar pendaftar lama (yang belum punya foto/keahlian) tetap aman.
    public function up(): void
    {
        foreach (['pendaftar', 'anggota_pendaftar'] as $tabel) {
            Schema::table($tabel, function (Blueprint $t) use ($tabel) {
                if (! Schema::hasColumn($tabel, 'foto')) {
                    $t->string('foto')->nullable();
                }
                if (! Schema::hasColumn($tabel, 'keahlian')) {
                    $t->text('keahlian')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['pendaftar', 'anggota_pendaftar'] as $tabel) {
            Schema::table($tabel, function (Blueprint $t) use ($tabel) {
                foreach (['foto', 'keahlian'] as $kolom) {
                    if (Schema::hasColumn($tabel, $kolom)) {
                        $t->dropColumn($kolom);
                    }
                }
            });
        }
    }
};