<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('photos')) {
            return;
        }

        Schema::table('photos', function (Blueprint $table) {
            // Who uploaded this photo (nullable so existing album-only photos are unaffected)
            if (! Schema::hasColumn('photos', 'user_id')) {
                $table->foreignId('user_id')
                      ->nullable()
                      ->after('album_id')
                      ->constrained('users')
                      ->nullOnDelete();
            }

            // public | friends | private
            if (! Schema::hasColumn('photos', 'visibility')) {
                $table->enum('visibility', ['public', 'friends', 'private'])
                      ->default('public')
                      ->after('caption');
            }

            // true = uploaded from Profile page, false = uploaded from Gallery
            if (! Schema::hasColumn('photos', 'is_profile_post')) {
                $table->boolean('is_profile_post')
                      ->default(false)
                      ->after('visibility');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('photos')) {
            return;
        }

        Schema::table('photos', function (Blueprint $table) {
            if (Schema::hasColumn('photos', 'user_id')) {
                $table->dropForeign(['user_id']);
            }

            $columns = array_filter(
                ['user_id', 'visibility', 'is_profile_post'],
                fn ($column) => Schema::hasColumn('photos', $column)
            );

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
