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

            'dokumen'                    => ['required', 'array', 'min:1'],
            'dokumen.*.jenis_dokumen'    => ['required', 'string', 'max:100'],
            'dokumen.*.file'             => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nik.digits'                => 'NIK harus terdiri dari 16 digit angka.',
            'periode_selesai.after'     => 'Periode selesai harus setelah periode mulai.',
            'dokumen.*.file.max'        => 'Ukuran setiap file maksimal 2MB.',
            'dokumen.*.file.mimes'      => 'File harus berformat PDF, JPG, atau PNG.',
        ];
    }
}