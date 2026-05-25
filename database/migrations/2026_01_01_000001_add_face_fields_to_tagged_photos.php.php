<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // 'gallery' = regular photo album, 'graduation' = graduation content
            $table->string('type')->default('gallery')->after('event_date');

            // For graduation: photos | videos | program | archive
            $table->string('category')->nullable()->after('type');

            // Direct URL for videos and PDFs (not stored as Photo records)
            $table->text('media_url')->nullable()->after('category');

            // Cloudinary public_id for deletion
            $table->string('cloudinary_public_id')->nullable()->after('media_url');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn(['type', 'category', 'media_url', 'cloudinary_public_id']);
        });
    }
};