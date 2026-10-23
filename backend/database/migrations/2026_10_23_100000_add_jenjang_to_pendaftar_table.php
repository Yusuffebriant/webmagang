<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Jenjang pendidikan ketua (SMA/SMK, D1-D4, S1). Sebelumnya hanya jenjang anggota yang tersimpan.
    // Pendaftar lama dibiarkan kosong (tidak ditebak).
    public function up(): void
    {
        Schema::table('pendaftar', function (Blueprint $t) {
            $t->string('jenjang', 30)->nullable()->after('fakultas');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftar', function (Blueprint $t) {
            $t->dropColumn('jenjang');
        });
    }
};