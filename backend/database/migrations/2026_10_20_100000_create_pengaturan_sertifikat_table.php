<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pengaturan_sertifikat')) {
            return;
        }

        // Pengaturan template sertifikat (satu baris per kunci). Nilai bawaan ada di model.
        Schema::create('pengaturan_sertifikat', function (Blueprint $t) {
            $t->id();
            $t->string('kunci')->unique();
            $t->text('nilai')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturan_sertifikat');
    }
};