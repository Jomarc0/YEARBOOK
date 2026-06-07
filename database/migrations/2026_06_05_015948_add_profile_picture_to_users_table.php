<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'profile_picture')) {
                $table->string('profile_picture')->nullable()->after('avatar');
            }
            if (! Schema::hasColumn('users', 'profile_picture_public_id')) {
                $table->string('profile_picture_public_id')->nullable()->after('profile_picture');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = array_filter(
                ['profile_picture', 'profile_picture_public_id'],
                fn ($column) => Schema::hasColumn('users', $column)
            );

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
