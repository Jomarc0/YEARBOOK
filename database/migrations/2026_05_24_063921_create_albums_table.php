<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    if (Schema::hasTable('albums')) {
        return; 
    }

    Schema::create('albums', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')
              ->nullable()
              ->constrained('users')
              ->nullOnDelete();
        $table->string('title');
        $table->text('description')->nullable();
        $table->string('cover_image')->nullable();
        $table->date('event_date')->nullable();
        $table->string('type')->default('general');
        $table->string('category')->nullable();
        $table->string('media_url')->nullable();
        $table->string('cloudinary_public_id')->nullable();
        $table->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('albums');
    }
};