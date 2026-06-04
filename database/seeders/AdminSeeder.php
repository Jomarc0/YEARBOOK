<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ───────────────────────────────────────────────────────
        $super = Admin::updateOrCreate(
            ['username' => 'superadmin'],
            [
                'name'      => 'Super Administrator',
                'password'  => Hash::make('superadmin1234!'),
                'role'      => Admin::ROLE_SUPER_ADMIN,
                'is_active' => true,
            ]
        );

        // ── Regular Admin ─────────────────────────────────────────────────────
        Admin::updateOrCreate(
            ['username' => 'admin'],
            [
                'name'       => 'Default Admin',
                'password'   => Hash::make('admin1234!'),
                'role'       => Admin::ROLE_ADMIN,
                'is_active'  => true,
                'created_by' => $super->id,
            ]
        );

        $this->command->info('Admin accounts seeded:');
        $this->command->line('  superadmin  /  SuperAdmin@2025!');
        $this->command->line('  admin       /  Admin@2025!');
    }
}