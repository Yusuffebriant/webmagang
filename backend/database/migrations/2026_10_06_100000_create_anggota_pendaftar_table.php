<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anggota_pendaftar', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pendaftar_id')->constrained('pendaftar')->cascadeOnDelete();
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
            $t->string('jenjang')->nullable();
            $t->timestamps();

            $t->index('pendaftar_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggota_pendaftar');
    }
};