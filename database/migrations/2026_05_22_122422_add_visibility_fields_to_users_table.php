<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only add if columns don't exist yet
            if (!Schema::hasColumn('users', 'profile_visibility')) {
                $table->enum('profile_visibility', ['public', 'alumni_only', 'private'])
                      ->default('public')
                      ->after('motto');
            }
            if (!Schema::hasColumn('users', 'profile_views')) {
                $table->unsignedInteger('profile_views')->default(0)->after('profile_visibility');
            }
            if (!Schema::hasColumn('users', 'motto')) {
                $table->string('motto', 255)->nullable()->after('bio');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_visibility', 'profile_views', 'motto']);
        });
    }
};