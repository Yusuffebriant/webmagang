<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sertifikat extends Model
{
    protected $table = 'sertifikat';
    protected $guarded = ['id'];
    protected $casts = [
        'periode_mulai'   => 'date',
        'periode_selesai' => 'date',
        'tanggal_terbit'  => 'date',
    ];

    public function pendaftar() { return $this->belongsTo(Pendaftar::class, 'pendaftar_id'); }
    public function anggota()   { return $this->belongsTo(AnggotaPendaftar::class, 'anggota_id'); }
}