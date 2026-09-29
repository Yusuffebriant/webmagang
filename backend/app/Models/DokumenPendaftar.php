<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Enums\StatusPendaftar;

class DokumenPendaftar extends Model
{
    protected $table = 'dokumen_pendaftar';
    protected $guarded = ['id'];

    public function pendaftar() { return $this->belongsTo(Pendaftar::class, 'pendaftar_id'); }
}