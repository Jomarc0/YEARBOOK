<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->foreignId('photo_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('photos')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('photo_id');
        });
    }
};