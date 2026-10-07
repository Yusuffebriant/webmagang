<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ganti email lama (salah ketik "bksdm") ke "bkpsdm" tanpa membuat akun ganda.
        User::where('email', 'admin@bksdm.com')->update(['email' => 'admin@bkpsdm.com']);

        User::updateOrCreate(
            ['email' => 'admin@bkpsdm.com'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('admin1'),
                'role'     => 'admin',
            ]
        );
    }
}