<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tagged_photos', function (Blueprint $table) {
            $table->id();
            // Both columns reference users table — your project uses users directly
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('The student being tagged');
            $table->foreignId('uploaded_by')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->comment('Who uploaded the photo');
            $table->string('photo_path');
            $table->string('caption')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->timestamps();

            $table->index('user_id');
            $table->index('uploaded_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tagged_photos');
    }
};