<?php

namespace App\Models;

use App\Enums\StatusPendaftar;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class BidangMagang extends Model
{
    protected $table = 'bidang_magang';
    protected $guarded = ['id'];
    protected $casts = ['kuota' => 'integer'];

    public function pendaftar() { return $this->hasMany(Pendaftar::class, 'bidang_magang_id'); }
    public function anggota() { return $this->hasMany(AnggotaPendaftar::class, 'bidang_magang_id'); }

    /**
     * Tambahkan hitungan peserta yang sudah diterima di bidang ini.
     * Dihitung per orang: ketua + anggota kelompok yang pendaftarannya berstatus diterima.
     * Hasilnya dibaca lewat atribut $bidang->terisi.
     */
    /**
     * Fitur pendaftaran kelompok (tabel anggota_pendaftar) bersifat opsional:
     * bila belum ada di branch/DB ini, hitungan hanya memakai pendaftar (ketua).
     */
    public static function punyaAnggota(): bool
    {
        static $ada = null;

        return $ada ??= class_exists(AnggotaPendaftar::class) && Schema::hasTable('anggota_pendaftar');
    }

    /**
     * Tambahkan hitungan peserta yang sudah diterima di bidang ini.
     * Dibaca lewat atribut $bidang->terisi.
     */
    public function scopeDenganTerisi($query)
    {
        $diterima = StatusPendaftar::Diterima->value;

        $hitung = ['pendaftar as terisi_ketua' => fn ($q) => $q->where('status', $diterima)];

        if (static::punyaAnggota()) {
            $hitung['anggota as terisi_anggota'] = fn ($q) => $q->whereHas(
                'pendaftar',
                fn ($p) => $p->where('status', $diterima)
            );
        }

        return $query->withCount($hitung);
    }

    protected function terisi(): Attribute
    {
        return Attribute::get(fn () => (int) ($this->terisi_ketua ?? 0) + (int) ($this->terisi_anggota ?? 0));
    }

    /** Versi sekali-hitung untuk satu bidang (tanpa scope). */
    public function hitungTerisi(): int
    {
        $diterima = StatusPendaftar::Diterima->value;

        $total = $this->pendaftar()->where('status', $diterima)->count();

        if (static::punyaAnggota()) {
            $total += $this->anggota()->whereHas('pendaftar', fn ($p) => $p->where('status', $diterima))->count();
        }

        return $total;
    }
}