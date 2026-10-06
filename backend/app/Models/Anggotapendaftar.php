<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnggotaPendaftar extends Model
{
    protected $table = 'anggota_pendaftar';
    protected $guarded = ['id'];
    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    public function pendaftar() { return $this->belongsTo(Pendaftar::class, 'pendaftar_id'); }
}