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
        Schema::create('program_magang', function (Blueprint $t) {
    $t->id();
    $t->string('nama_program');
    $t->text('deskripsi')->nullable();
    $t->date('periode_mulai');
    $t->date('periode_selesai');
    $t->unsignedTinyInteger('durasi')->default(1)->comment('minimal bulan');
    $t->string('status')->default('aktif'); // aktif | nonaktif
    $t->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_magangs');
    }
};
