<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PendaftarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'nomor_pendaftaran' => $this->nomor_pendaftaran,
            'nama_lengkap'      => $this->nama_lengkap,
            'nim'               => $this->nim,
            'nik'               => $this->nik,
            'tempat_lahir'      => $this->tempat_lahir,
            'tanggal_lahir'     => $this->tanggal_lahir?->format('Y-m-d'),
            'jenis_kelamin'     => $this->jenis_kelamin,
            'alamat'            => $this->alamat,
            'no_whatsapp'       => $this->no_whatsapp,
            'email'             => $this->email,
            'universitas'       => $this->universitas,
            'fakultas'          => $this->fakultas,
            'program_studi'     => $this->program_studi,
            'semester'          => $this->semester,
            'program'           => $this->whenLoaded('program', fn () => $this->program->nama_program),
            'bidang'            => $this->whenLoaded('bidang', fn () => $this->bidang->nama_bidang),
            'bidang_magang_id'  => $this->bidang_magang_id,
            'periode_mulai'     => $this->periode_mulai?->format('Y-m-d'),
            'periode_selesai'   => $this->periode_selesai?->format('Y-m-d'),
            'status'            => $this->status->value,
            'status_label'      => $this->status->label(),
            'catatan'           => $this->catatan,
            'loa_tersedia'      => filled($this->loa_file),
            'loa_url'           => $this->when(
                $request->user('sanctum') && filled($this->loa_file),
                fn () => asset('storage/' . $this->loa_file)
            ),
            'dokumen'           => DokumenPendaftarResource::collection($this->whenLoaded('dokumen')),
            'jumlah_anggota'    => $this->whenCounted('anggota'),
            'anggota'           => $this->whenLoaded('anggota', fn () => $this->anggota->map(fn ($a) => [
                'id'               => $a->id,
                'nama_lengkap'     => $a->nama_lengkap,
                'nim'              => $a->nim,
                'nik'              => $a->nik,
                'tempat_lahir'     => $a->tempat_lahir,
                'tanggal_lahir'    => $a->tanggal_lahir?->format('Y-m-d'),
                'jenis_kelamin'    => $a->jenis_kelamin,
                'alamat'           => $a->alamat,
                'no_whatsapp'      => $a->no_whatsapp,
                'email'            => $a->email,
                'universitas'      => $a->universitas,
                'fakultas'         => $a->fakultas,
                'program_studi'    => $a->program_studi,
                'semester'         => $a->semester,
                'jenjang'          => $a->jenjang,
                'bidang_magang_id' => $a->bidang_magang_id,
                'bidang'           => $a->bidang?->nama_bidang,
            ])->values()),
            'created_at'        => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}