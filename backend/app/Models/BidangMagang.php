<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BidangMagang extends Model
{
    protected $table = 'bidang_magang';
    protected $guarded = ['id'];
    protected $casts = ['kuota' => 'integer'];

    public function pendaftar() { return $this->hasMany(Pendaftar::class, 'bidang_magang_id'); }
}