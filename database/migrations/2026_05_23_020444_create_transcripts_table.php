<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcripts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('uploaded_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('title');
            $table->string('audio_path');

            // Whisper output
            $table->longText('transcript_text')->nullable();
            $table->json('segments')->nullable();          // timestamped segments
            $table->string('language', 20)->nullable();    // 'en', 'tl', etc.

            $table->enum('status', ['pending', 'processing', 'done', 'failed'])
                  ->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcripts');
    }
};