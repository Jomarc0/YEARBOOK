<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('transcripts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('audio_path');
            $table->longText('transcript_text')->nullable();
            $table->json('segments')->nullable();
            $table->string('language', 10)->nullable();
            $table->string('status')->default('pending');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('transcripts'); }
};