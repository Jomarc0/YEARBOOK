<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graduation_photos', function (Blueprint $table) {
            $table->id();

            // Parent album
            $table->foreignId('graduation_album_id')
                  ->constrained('graduation_albums')
                  ->cascadeOnDelete();

            // File info
            $table->string('file_path');                    // Cloudinary secure URL
            $table->string('cloudinary_public_id')->nullable();

            // Resource type for Cloudinary deletion
            // image | video | audio | raw
            $table->string('resource_type')->default('image');

            // MIME type stored for frontend rendering decisions
            $table->string('mime_type')->nullable();

            // AI analysis results (face recognition, transcription status, etc.)
            $table->json('ai_metadata')->nullable();

            // Display order within album
            $table->smallInteger('sort_order')->default(0);

            $table->timestamps();

            // Indexes
            $table->index('graduation_album_id');
            $table->index('resource_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('graduation_photos');
    }
};