<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── galleries ────────────────────────────────────────────────────────
        // Central model: one row per uploaded item (replaces photos + post_media).
        // All gallery uploads land here; status gate controls public visibility.
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('album_id')
                  ->constrained('albums')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->string('caption')->nullable();

            // Approval gate — only 'approved' rows are publicly visible
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending');

            $table->enum('visibility', ['public', 'private'])
                  ->default('public');

            $table->json('ai_metadata')->nullable();   // face-recognition results

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['album_id', 'status']);     // main query path
            $table->index(['user_id',  'status']);
        });

        // ── gallery_media ────────────────────────────────────────────────────
        // Each Gallery row can have one or more physical files (multi-size,
        // video + poster thumbnail, etc.).
        Schema::create('gallery_media', function (Blueprint $table) {
            $table->id();

            $table->foreignId('gallery_id')
                  ->constrained('galleries')
                  ->cascadeOnDelete();

            $table->string('file_path');
            $table->string('public_id')->nullable();       // Cloudinary / S3 key
            $table->string('resource_type')->default('image'); // image | video | raw
            $table->unsignedBigInteger('bytes')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['gallery_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_media');
        Schema::dropIfExists('galleries');
    }
};