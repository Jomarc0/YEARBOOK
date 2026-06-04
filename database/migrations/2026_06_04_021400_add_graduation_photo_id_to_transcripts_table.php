<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            // Add after album_id column
            $table->unsignedBigInteger('graduation_photo_id')
                  ->nullable()
                  ->after('album_id');

            $table->foreign('graduation_photo_id')
                  ->references('id')
                  ->on('graduation_photos')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->dropForeign(['graduation_photo_id']);
            $table->dropColumn('graduation_photo_id');
        });
    }
};