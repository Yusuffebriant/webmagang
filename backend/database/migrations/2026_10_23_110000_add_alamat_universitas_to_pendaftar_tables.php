<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Alamat universitas / sekolah untuk ketua (tabel pendaftar) dan tiap anggota kelompok.
    // Nullable agar pendaftar lama (yang belum punya alamat kampus) tetap aman.
    public function up(): void
    {
        foreach (['pendaftar', 'anggota_pendaftar'] as $tabel) {
            Schema::table($tabel, function (Blueprint $t) use ($tabel) {
                if (! Schema::hasColumn($tabel, 'alamat_universitas')) {
                    $t->text('alamat_universitas')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['pendaftar', 'anggota_pendaftar'] as $tabel) {
            Schema::table($tabel, function (Blueprint $t) use ($tabel) {
                if (Schema::hasColumn($tabel, 'alamat_universitas')) {
                    $t->dropColumn('alamat_universitas');
                }
            });
        }
    }
};