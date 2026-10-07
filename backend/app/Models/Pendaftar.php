<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Enums\StatusPendaftar;

class Pendaftar extends Model
{
    protected $table = 'pendaftar';
    protected $guarded = ['id'];
    protected $casts = [
        'status'          => StatusPendaftar::class,
        'tanggal_lahir'   => 'date',
        'periode_mulai'   => 'date',
        'periode_selesai' => 'date',
    ];

    public function program() { return $this->belongsTo(ProgramMagang::class, 'program_magang_id'); }
    public function bidang()  { return $this->belongsTo(BidangMagang::class, 'bidang_magang_id'); }
    public function dokumen() { return $this->hasMany(DokumenPendaftar::class, 'pendaftar_id'); }
    public function anggota() { return $this->hasMany(AnggotaPendaftar::class, 'pendaftar_id'); }
}