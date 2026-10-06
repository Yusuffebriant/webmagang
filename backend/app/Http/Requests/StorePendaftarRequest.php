<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePendaftarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_lengkap'       => ['required', 'string', 'max:150'],
            'nim'                => ['required', 'string', 'max:30'],
            'nik'                => ['required', 'digits:16'],
            'tempat_lahir'       => ['required', 'string', 'max:100'],
            'tanggal_lahir'      => ['required', 'date', 'before:today'],
            'jenis_kelamin'      => ['required', 'in:L,P'],
            'alamat'             => ['required', 'string'],
            'no_whatsapp'        => ['required', 'string', 'max:20'],
            'email'              => ['required', 'email', 'max:150'],
            'universitas'        => ['required', 'string', 'max:150'],
            'fakultas'           => ['nullable', 'string', 'max:150'],
            'program_studi'      => ['required', 'string', 'max:150'],
            'semester'           => ['required', 'integer', 'min:1', 'max:14'],
            'program_magang_id'  => ['required', 'exists:program_magang,id'],
            'bidang_magang_id'   => ['required', 'exists:bidang_magang,id'],
            'periode_mulai'      => ['required', 'date'],
            'periode_selesai'    => ['required', 'date', 'after:periode_mulai'],

            // Anggota kelompok (opsional; kosong = mendaftar sendiri). Maks. 9 orang di luar ketua.
            'anggota'                  => ['nullable', 'array', 'max:9'],
            'anggota.*.nama_lengkap'   => ['required', 'string', 'max:150'],
            'anggota.*.nim'            => ['required', 'string', 'max:30'],
            'anggota.*.nik'            => ['required', 'digits:16'],
            'anggota.*.tempat_lahir'   => ['required', 'string', 'max:100'],
            'anggota.*.tanggal_lahir'  => ['required', 'date', 'before:today'],
            'anggota.*.jenis_kelamin'  => ['required', 'in:L,P'],
            'anggota.*.alamat'         => ['required', 'string'],
            'anggota.*.no_whatsapp'    => ['required', 'string', 'max:20'],
            'anggota.*.email'          => ['required', 'email', 'max:150'],
            'anggota.*.universitas'    => ['required', 'string', 'max:150'],
            'anggota.*.fakultas'       => ['nullable', 'string', 'max:150'],
            'anggota.*.program_studi'  => ['required', 'string', 'max:150'],
            'anggota.*.semester'       => ['required', 'integer', 'min:1', 'max:14'],
            'anggota.*.jenjang'        => ['nullable', 'string', 'max:30'],

            'dokumen'                    => ['required', 'array', 'min:1'],
            'dokumen.*.jenis_dokumen'    => ['required', 'string', 'max:100'],
            'dokumen.*.file'             => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nik.digits'                => 'NIK harus terdiri dari 16 digit angka.',
            'anggota.*.nik.digits'      => 'NIK anggota harus terdiri dari 16 digit angka.',
            'anggota.max'               => 'Anggota kelompok maksimal 9 orang di luar ketua.',
            'periode_selesai.after'     => 'Periode selesai harus setelah periode mulai.',
            'dokumen.*.file.max'        => 'Ukuran setiap file maksimal 2MB.',
            'dokumen.*.file.mimes'      => 'File harus berformat PDF, JPG, atau PNG.',
        ];
    }
}