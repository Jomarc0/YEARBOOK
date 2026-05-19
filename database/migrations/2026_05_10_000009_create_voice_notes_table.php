<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('voice_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable();
            $table->string('audio_url');
            $table->string('cloudinary_public_id')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('voice_notes'); }
};