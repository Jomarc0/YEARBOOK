<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds missing columns to the albums table:
 *  - user_id            → owner of the album
 *  - type               → 'general' | 'graduation' | 'profile'
 *  - category           → 'photos' | 'videos' | 'program' | 'archive'
 *  - media_url          → for single-media albums (video/PDF)
 *  - cloudinary_public_id
 *  - cover_image made nullable (was NOT NULL in original migration)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            if (! Schema::hasColumn('albums', 'user_id')) {
                $table->foreignId('user_id')
                      ->nullable()
                      ->after('id')
                      ->constrained('users')
                      ->nullOnDelete();
            }
            if (! Schema::hasColumn('albums', 'type')) {
                $table->string('type')->default('general')->after('description');
            }
            if (! Schema::hasColumn('albums', 'category')) {
                $table->string('category')->nullable()->after('type');
            }
            if (! Schema::hasColumn('albums', 'media_url')) {
                $table->text('media_url')->nullable()->after('category');
            }
            if (! Schema::hasColumn('albums', 'cloudinary_public_id')) {
                $table->string('cloudinary_public_id')->nullable()->after('media_url');
            }
            // Make cover_image nullable so albums can exist before a cover is set
            $table->string('cover_image')->nullable()->change();
            // Make event_date nullable
            $table->date('event_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'user_id', 'type', 'category',
                'media_url', 'cloudinary_public_id',
            ]);
        });
    }
};