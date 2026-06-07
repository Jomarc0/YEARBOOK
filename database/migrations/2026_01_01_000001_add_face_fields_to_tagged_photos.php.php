<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('albums')) {
            return;
        }

        Schema::table('albums', function (Blueprint $table) {
            // 'gallery' = regular photo album, 'graduation' = graduation content
            if (! Schema::hasColumn('albums', 'type')) {
                $table->string('type')->default('gallery')->after('event_date');
            }

            // For graduation: photos | videos | program | archive
            if (! Schema::hasColumn('albums', 'category')) {
                $table->string('category')->nullable()->after('type');
            }

            // Direct URL for videos and PDFs (not stored as Photo records)
            if (! Schema::hasColumn('albums', 'media_url')) {
                $table->text('media_url')->nullable()->after('category');
            }

            // Cloudinary public_id for deletion
            if (! Schema::hasColumn('albums', 'cloudinary_public_id')) {
                $table->string('cloudinary_public_id')->nullable()->after('media_url');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('albums')) {
            return;
        }

        Schema::table('albums', function (Blueprint $table) {
            $columns = array_filter(
                ['type', 'category', 'media_url', 'cloudinary_public_id'],
                fn ($column) => Schema::hasColumn('albums', $column)
            );

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
