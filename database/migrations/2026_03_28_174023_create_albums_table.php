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
        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Halimbawa: "Graduation 2025"
            $table->text('description')->nullable(); // Optional na detalye tungkol sa event
            $table->string('cover_image'); // Dito mase-save yung path ng thumbnail
            $table->date('event_date'); // Para sa sorting ng albums sa gallery
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('albums');
    }
};
