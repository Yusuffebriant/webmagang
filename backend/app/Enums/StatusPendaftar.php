<?php

namespace App\Enums;

enum StatusPendaftar: string
{
    case Menunggu     = 'menunggu_verifikasi';
    case Diverifikasi = 'diverifikasi';
    case Diterima     = 'diterima';
    case Ditolak      = 'ditolak';

    public function label(): string
    {
        return match ($this) {
            self::Menunggu     => 'Menunggu Verifikasi',
            self::Diverifikasi => 'Diverifikasi',
            self::Diterima     => 'Diterima',
            self::Ditolak      => 'Ditolak',
        };
    }
}