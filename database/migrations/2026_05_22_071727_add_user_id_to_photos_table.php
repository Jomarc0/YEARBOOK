<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            // Who uploaded this photo (nullable so existing album-only photos are unaffected)
            $table->foreignId('user_id')
                  ->nullable()
                  ->after('album_id')
                  ->constrained('users')
                  ->nullOnDelete();

            // public | friends | private
            $table->enum('visibility', ['public', 'friends', 'private'])
                  ->default('public')
                  ->after('caption');

            // true = uploaded from Profile page, false = uploaded from Gallery
            $table->boolean('is_profile_post')
                  ->default(false)
                  ->after('visibility');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'visibility', 'is_profile_post']);
        });
    }
};