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
        if (! Schema::hasTable('photos')) {
            return;
        }

        Schema::table('photos', function (Blueprint $table) {
            if (! Schema::hasColumn('photos', 'public_id')) {
                $table->string('public_id')
                      ->nullable()
                      ->after('file_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('photos')) {
            return;
        }

        Schema::table('photos', function (Blueprint $table) {
            if (Schema::hasColumn('photos', 'public_id')) {
                $table->dropColumn('public_id');
            }
        });
    }
};
