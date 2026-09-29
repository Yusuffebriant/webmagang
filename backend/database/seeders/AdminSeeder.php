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
            ['email' => 'admin@bksdm.com'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('admin1'),
                'role'     => 'admin',
            ]
        );
    }
}