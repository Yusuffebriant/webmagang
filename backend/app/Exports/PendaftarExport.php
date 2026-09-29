<?php

namespace App\Exports;

use App\Models\Pendaftar;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PendaftarExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Pendaftar::with('program', 'bidang')->latest()->get();
    }

    public function headings(): array
    {
        return [
            'Nomor Pendaftaran', 'Nama Lengkap', 'NIM', 'NIK',
            'Universitas', 'Program Studi', 'Semester',
            'Program Magang', 'Bidang', 'No. WhatsApp', 'Email',
            'Status', 'Tanggal Daftar',
        ];
    }

    public function map($pendaftar): array
    {
        return [
            $pendaftar->nomor_pendaftaran,
            $pendaftar->nama_lengkap,
            $pendaftar->nim,
            $pendaftar->nik,
            $pendaftar->universitas,
            $pendaftar->program_studi,
            $pendaftar->semester,
            $pendaftar->program?->nama_program,
            $pendaftar->bidang?->nama_bidang,
            $pendaftar->no_whatsapp,
            $pendaftar->email,
            $pendaftar->status->label(),
            $pendaftar->created_at->format('Y-m-d H:i'),
        ];
    }
}