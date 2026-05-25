<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voice_notes', function (Blueprint $table) {
            $table->id();

            // Who sent it
            $table->foreignId('sender_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Who it's for
            $table->foreignId('recipient_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('title')->nullable();
            $table->string('audio_url');
            $table->string('cloudinary_public_id')->nullable();
            $table->unsignedSmallInteger('duration_seconds')->nullable();

            // Admin moderation
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending');
            $table->text('reject_reason')->nullable();
            $table->foreignId('reviewed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            // Indexes for common queries
            $table->index(['recipient_id', 'status']);
            $table->index(['sender_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voice_notes');
    }
};