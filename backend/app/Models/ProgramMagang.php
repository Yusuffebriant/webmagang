<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramMagang extends Model
{
    protected $table = 'program_magang';
    protected $guarded = ['id'];
    protected $casts = ['periode_mulai' => 'date', 'periode_selesai' => 'date'];

    public function pendaftar() { return $this->hasMany(Pendaftar::class, 'program_magang_id'); }
}
