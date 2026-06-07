<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tagged_photos') || ! Schema::hasColumn('tagged_photos', 'uploaded_by')) {
            return;
        }

        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->foreignId('uploaded_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tagged_photos') || ! Schema::hasColumn('tagged_photos', 'uploaded_by')) {
            return;
        }

        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->foreignId('uploaded_by')->nullable(false)->change();
        });
    }
};
