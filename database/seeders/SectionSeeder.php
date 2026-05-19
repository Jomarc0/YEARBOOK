<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Gawa tayo ng Sections
        $bscs = Section::create(['name' => 'BSCS 401', 'course' => 'Computer Science']);
        $bsit = Section::create(['name' => 'BSIT 401', 'course' => 'Information Technology']);

        // 2. Gawa tayo ng Sample Students sa BSCS 401
        User::create([
            'name' => 'Alex De La Cruz',
            'email' => 'alex@nualumni.com',
            'password' => Hash::make('password123'),
            'section_id' => $bscs->id,
        ]);

        User::create([
            'name' => 'John Doe',
            'email' => 'john@nualumni.com',
            'password' => Hash::make('password123'),
            'section_id' => $bscs->id,
        ]);

        // 3. Gawa tayo ng Sample Student sa BSIT 401
        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@nualumni.com',
            'password' => Hash::make('password123'),
            'section_id' => $bsit->id,
        ]);
    }
}
