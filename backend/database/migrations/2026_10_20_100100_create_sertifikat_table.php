<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sertifikat')) {
            return;
        }

        // Satu baris = satu sertifikat untuk satu orang (ketua atau anggota kelompok).
        // Kolom nama/instansi/periode/tanggal NULL = otomatis mengikuti data pendaftaran;
        // bila diisi admin, nilai itu yang dipakai (override).
        Schema::create('sertifikat', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pendaftar_id')->constrained('pendaftar')->cascadeOnDelete();
            $t->unsignedBigInteger('anggota_id')->nullable()->index(); // NULL = ketua / pendaftar individu
            $t->unsignedSmallInteger('tahun');
            $t->unsignedInteger('nomor_urut');
            $t->string('nomor');
            $t->string('nama')->nullable();
            $t->string('instansi')->nullable();
            $t->date('periode_mulai')->nullable();
            $t->date('periode_selesai')->nullable();
            $t->date('tanggal_terbit')->nullable();
            $t->timestamps();

            $t->unique(['tahun', 'nomor_urut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sertifikat');
    }
};