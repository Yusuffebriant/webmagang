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
        Schema::create('bidang_magang', function (Blueprint $t) {
            $t->id();
            $t->string('nama_bidang');
            $t->text('deskripsi')->nullable();
            $t->string('status')->default('aktif');
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bidang_magangs');
    }
};
