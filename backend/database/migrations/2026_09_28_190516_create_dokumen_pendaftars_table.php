<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dokumen_pendaftar', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pendaftar_id')->constrained('pendaftar')->cascadeOnDelete();
            $t->string('jenis_dokumen'); // surat_pengantar, cv, transkrip, ktm, dll
            $t->string('file');
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokumen_pendaftars');
    }
};
