<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('pendaftar', 'loa_file')) {
            return;
        }

        Schema::table('pendaftar', function (Blueprint $t) {
            $t->string('loa_file')->nullable()->after('catatan');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('pendaftar', 'loa_file')) {
            return;
        }

        Schema::table('pendaftar', function (Blueprint $t) {
            $t->dropColumn('loa_file');
        });
    }
};