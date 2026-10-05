<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('bidang_magang', 'kuota')) {
            return;
        }

        Schema::table('bidang_magang', function (Blueprint $t) {
            // NULL = kuota belum diatur (tidak dibatasi)
            $t->unsignedSmallInteger('kuota')->nullable()->after('deskripsi');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('bidang_magang', 'kuota')) {
            return;
        }

        Schema::table('bidang_magang', function (Blueprint $t) {
            $t->dropColumn('kuota');
        });
    }
};