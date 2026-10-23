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
            'nim'                => ['required', 'string', 'max:30', 'regex:/^[0-9]+$/'],
            'nik'                => ['required', 'digits:16'],
            'tempat_lahir'       => ['required', 'string', 'max:100'],
            'tanggal_lahir'      => ['required', 'date', 'before:today'],
            'jenis_kelamin'      => ['required', 'in:L,P'],
            'alamat'             => ['required', 'string'],
            'no_whatsapp'        => ['required', 'string', 'max:20'],
            'email'              => ['required', 'email', 'max:150'],
            'foto'               => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'keahlian'           => ['required', 'string', 'max:500'],
            'universitas'        => ['required', 'string', 'max:150'],
            'alamat_universitas' => ['required', 'string', 'max:500'],
            'fakultas'           => ['nullable', 'string', 'max:150'],
            'jenjang'            => ['nullable', 'string', 'max:30'],
            'program_studi'      => ['required', 'string', 'max:150'],
            'semester'           => ['required', 'integer', 'min:1', 'max:14'],
            'program_magang_id'  => ['required', 'exists:program_magang,id'],
            'bidang_magang_id'   => ['required', 'exists:bidang_magang,id'],
            'periode_mulai'      => ['required', 'date'],
            'periode_selesai'    => ['required', 'date', 'after:periode_mulai'],

            // Anggota kelompok (opsional; kosong = mendaftar sendiri). Maks. 9 orang di luar ketua.
            'anggota'                  => ['nullable', 'array', 'max:9'],
            'anggota.*.nama_lengkap'   => ['required', 'string', 'max:150'],
            'anggota.*.nim'            => ['required', 'string', 'max:30', 'regex:/^[0-9]+$/'],
            'anggota.*.nik'            => ['required', 'digits:16'],
            'anggota.*.tempat_lahir'   => ['required', 'string', 'max:100'],
            'anggota.*.tanggal_lahir'  => ['required', 'date', 'before:today'],
            'anggota.*.jenis_kelamin'  => ['required', 'in:L,P'],
            'anggota.*.alamat'         => ['required', 'string'],
            'anggota.*.no_whatsapp'    => ['required', 'string', 'max:20'],
            'anggota.*.email'          => ['required', 'email', 'max:150'],
            'anggota.*.foto'           => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'anggota.*.keahlian'       => ['required', 'string', 'max:500'],
            'anggota.*.universitas'    => ['required', 'string', 'max:150'],
            'anggota.*.alamat_universitas' => ['required', 'string', 'max:500'],
            'anggota.*.fakultas'       => ['nullable', 'string', 'max:150'],
            'anggota.*.program_studi'  => ['required', 'string', 'max:150'],
            'anggota.*.semester'       => ['required', 'integer', 'min:1', 'max:14'],
            'anggota.*.jenjang'        => ['nullable', 'string', 'max:30'],
            // Kosong = ikut bidang ketua
            'anggota.*.bidang_magang_id' => ['nullable', 'integer', 'exists:bidang_magang,id'],

            'dokumen'                    => ['required', 'array', 'min:1'],
            'dokumen.*.jenis_dokumen'    => ['required', 'string', 'max:100'],
            'dokumen.*.file'             => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nim.regex'                 => 'NIM hanya boleh berisi angka.',
            'anggota.*.bidang_magang_id.exists' => 'Bidang magang anggota tidak valid.',
            'anggota.*.nim.regex'       => 'NIM anggota hanya boleh berisi angka.',
            'nik.digits'                => 'NIK harus terdiri dari 16 digit angka.',
            'anggota.*.nik.digits'      => 'NIK anggota harus terdiri dari 16 digit angka.',
            'anggota.max'               => 'Anggota kelompok maksimal 9 orang di luar ketua.',
            'periode_selesai.after'     => 'Periode selesai harus setelah periode mulai.',
            'dokumen.*.file.max'        => 'Ukuran setiap file maksimal 2MB.',
            'dokumen.*.file.mimes'      => 'File harus berformat PDF, JPG, atau PNG.',
            'foto.required'             => 'Foto diri wajib diunggah.',
            'foto.mimes'                => 'Foto harus berformat JPG atau PNG.',
            'foto.max'                  => 'Ukuran foto maksimal 2MB.',
            'foto.uploaded'             => 'Foto gagal diunggah. Pastikan ukurannya maksimal 2MB.',
            'alamat_universitas.required' => 'Alamat universitas wajib diisi.',
            'alamat_universitas.max'    => 'Alamat universitas maksimal 500 karakter.',
            'anggota.*.alamat_universitas.required' => 'Alamat universitas anggota wajib diisi.',
            'anggota.*.alamat_universitas.max' => 'Alamat universitas anggota maksimal 500 karakter.',
            'keahlian.required'         => 'Keahlian wajib diisi.',
            'keahlian.max'              => 'Keahlian maksimal 500 karakter.',
            'anggota.*.foto.required'   => 'Foto diri anggota wajib diunggah.',
            'anggota.*.foto.mimes'      => 'Foto anggota harus berformat JPG atau PNG.',
            'anggota.*.foto.max'        => 'Ukuran foto anggota maksimal 2MB.',
            'anggota.*.foto.uploaded'   => 'Foto anggota gagal diunggah. Pastikan ukurannya maksimal 2MB.',
            'anggota.*.keahlian.required' => 'Keahlian anggota wajib diisi.',
            'anggota.*.keahlian.max'    => 'Keahlian anggota maksimal 500 karakter.',
        ];
    }
}