<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yearbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')
                  ->constrained('batches')
                  ->cascadeOnDelete();

            $table->string('title')->default('Senior Yearbook');
            $table->string('academic_year', 9)->nullable();  // e.g. "2024-2025"

            $table->enum('status', ['draft', 'generating', 'published', 'failed'])
                  ->default('draft');

            $table->string('pdf_path')->nullable();          // Storage-relative path
            $table->timestamp('pdf_generated_at')->nullable();

            $table->string('cover_image')->nullable();       // Cloudinary URL or Storage path
            $table->string('cover_url')->nullable();         // Public URL alias

            $table->string('theme')->default('classic');     // classic | modern | minimal
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // One yearbook per batch
            $table->unique('batch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yearbooks');
    }
};