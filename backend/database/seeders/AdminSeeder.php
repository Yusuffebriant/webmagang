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
        User::updateOrCreate(
            ['email' => 'admin@bksdm.test'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('ganti-password-ini'),
                'role'     => 'admin',
            ]
        );
    }
}