<?php

namespace Database\Seeders;

use App\Models\ProgramMagang;
use Illuminate\Database\Seeder;

class ProgramMagangSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Perbaikan penulisan: BKSDM -> BKPSDM (ubah data lama agar tidak terbentuk program ganda)
        ProgramMagang::where('nama_program', 'Program Magang BKSDM 2027')
            ->update(['nama_program' => 'Program Magang BKPSDM 2027']);

        ProgramMagang::updateOrCreate(
            ['nama_program' => 'Program Magang BKPSDM 2027'],
            [
                'deskripsi'       => 'Program magang bagi mahasiswa aktif di lingkungan BKPSDM Kota Yogyakarta.',
                'periode_mulai'   => '2027-01-01',
                'periode_selesai' => '2027-06-30',
                'durasi'          => 1,
                'status'          => 'aktif',
            ]
        );
    }
}