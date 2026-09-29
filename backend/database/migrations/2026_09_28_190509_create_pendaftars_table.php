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
        Schema::create('pendaftar', function (Blueprint $t) {
    $t->id();
    $t->string('nomor_pendaftaran')->unique();
    $t->string('nama_lengkap');
    $t->string('nim');
    $t->string('nik', 16);
    $t->string('tempat_lahir');
    $t->date('tanggal_lahir');
    $t->enum('jenis_kelamin', ['L', 'P']);
    $t->text('alamat');
    $t->string('no_whatsapp');
    $t->string('email');
    $t->string('universitas');
    $t->string('fakultas')->nullable();
    $t->string('program_studi');
    $t->unsignedTinyInteger('semester');
    $t->foreignId('program_magang_id')->constrained('program_magang');
    $t->foreignId('bidang_magang_id')->constrained('bidang_magang');
    $t->date('periode_mulai');
    $t->date('periode_selesai');
    $t->string('status')->default('menunggu_verifikasi');
    $t->text('catatan')->nullable();
    $t->timestamps();

    $t->index('status');
    $t->index('nim');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pendaftars');
    }
};
