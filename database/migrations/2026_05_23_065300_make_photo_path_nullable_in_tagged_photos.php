<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tagged_photos') || ! Schema::hasColumn('tagged_photos', 'photo_path')) {
            return;
        }

        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tagged_photos') || ! Schema::hasColumn('tagged_photos', 'photo_path')) {
            return;
        }

        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->string('photo_path')->nullable(false)->change();
        });
    }
};
