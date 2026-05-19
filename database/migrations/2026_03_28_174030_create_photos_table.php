<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            // Iniuugnay nito ang photo sa isang specific album
            $table->foreignId('album_id')->constrained()->onDelete('cascade');

            $table->string('file_path'); // Dito nakasave yung location ng image file
            $table->string('caption')->nullable(); // Optional na description para sa photo

            // Dito natin ise-save yung coordinates ng mga mukha mula sa CNN
            $table->json('ai_metadata')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
