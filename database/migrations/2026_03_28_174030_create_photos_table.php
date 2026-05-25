<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds missing columns to the photos table:
 *  - user_id         → uploader / profile owner
 *  - public_id       → Cloudinary public_id (replaces URL-parsing regex)
 *  - visibility      → public | friends | private
 *  - is_profile_post → true = uploaded from Profile page
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            if (! Schema::hasColumn('photos', 'user_id')) {
                $table->foreignId('user_id')
                      ->nullable()
                      ->after('album_id')
                      ->constrained('users')
                      ->nullOnDelete();
            }
            if (! Schema::hasColumn('photos', 'public_id')) {
                $table->string('public_id')->nullable()->after('file_path');
            }
            if (! Schema::hasColumn('photos', 'visibility')) {
                $table->string('visibility')->default('public')->after('caption');
            }
            if (! Schema::hasColumn('photos', 'is_profile_post')) {
                $table->boolean('is_profile_post')->default(false)->after('visibility');
            }
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'public_id', 'visibility', 'is_profile_post']);
        });
    }
};