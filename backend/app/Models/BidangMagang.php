<?php

namespace App\Models;

use App\Enums\StatusPendaftar;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class BidangMagang extends Model
{
    protected $table = 'bidang_magang';
    protected $guarded = ['id'];

    public function pendaftar() { return $this->hasMany(Pendaftar::class, 'bidang_magang_id'); }
    public function anggota() { return $this->hasMany(AnggotaPendaftar::class, 'bidang_magang_id'); }

    /**
     * Tambahkan hitungan peserta yang sudah diterima di bidang ini.
     * Dihitung per orang: ketua + anggota kelompok yang pendaftarannya berstatus diterima.
     * Hasilnya dibaca lewat atribut $bidang->terisi.
     */
    public function scopeDenganTerisi($query)
    {
        return $query->withCount([
            'pendaftar as terisi_ketua'  => fn ($q) => $q->where('status', StatusPendaftar::Diterima->value),
            'anggota as terisi_anggota'  => fn ($q) => $q->whereHas(
                'pendaftar',
                fn ($p) => $p->where('status', StatusPendaftar::Diterima->value)
            ),
        ]);
    }

    protected function terisi(): Attribute
    {
        return Attribute::get(fn () => (int) ($this->terisi_ketua ?? 0) + (int) ($this->terisi_anggota ?? 0));
    }

    /** Versi sekali-hitung untuk satu bidang (tanpa scope). */
    public function hitungTerisi(): int
    {
        $diterima = StatusPendaftar::Diterima->value;

        return $this->pendaftar()->where('status', $diterima)->count()
            + $this->anggota()->whereHas('pendaftar', fn ($p) => $p->where('status', $diterima))->count();
    }
}