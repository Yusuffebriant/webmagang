<?php

namespace Database\Seeders;

use App\Models\BidangMagang;
use Illuminate\Database\Seeder;

class BidangMagangSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bidang = [
            'Teknologi Informasi',
            'Administrasi',
            'Kepegawaian',
            'Keuangan',
            'Pelayanan',
        ];

        foreach ($bidang as $nama) {
            BidangMagang::firstOrCreate(
                ['nama_bidang' => $nama],
                ['status' => 'aktif']
            );
        }
    }
}