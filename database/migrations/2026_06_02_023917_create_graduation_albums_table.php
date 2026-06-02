<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graduation_albums', function (Blueprint $table) {
            $table->id();

            // Who created it (admin)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Which batch this album belongs to
            $table->foreignId('batch_id')
                  ->nullable()
                  ->constrained('batches')
                  ->nullOnDelete();

            // Basic info
            $table->string('title');
            $table->text('description')->nullable();

            // Content type
            // photos | videos | songs | mass | speeches | toga |
            // highlights | program | invitations | messages | archive
            $table->string('category');

            // Lifecycle status
            $table->string('status')->default('draft'); // draft | published | archived

            // Primary media (quick preview URL — first file uploaded)
            $table->text('media_url')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('cloudinary_public_id')->nullable();

            // Optional event date for the album
            $table->date('event_date')->nullable();

            // When it was published
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            // Indexes for common queries
            $table->index('category');
            $table->index('status');
            $table->index('batch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('graduation_albums');
    }
};