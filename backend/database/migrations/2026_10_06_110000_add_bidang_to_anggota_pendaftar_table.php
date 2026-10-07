<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anggota_pendaftar', function (Blueprint $t) {
            $t->foreignId('bidang_magang_id')->nullable()->after('jenjang')
                ->constrained('bidang_magang')->restrictOnDelete();
        });

        // Anggota yang sudah tersimpan sebelumnya ikut bidang ketuanya.
        DB::statement(
            'UPDATE anggota_pendaftar SET bidang_magang_id = '
            . '(SELECT p.bidang_magang_id FROM pendaftar p WHERE p.id = anggota_pendaftar.pendaftar_id)'
        );
    }

    public function down(): void
    {
        Schema::table('anggota_pendaftar', function (Blueprint $t) {
            $t->dropConstrainedForeignId('bidang_magang_id');
        });
    }
};