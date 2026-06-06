<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tagged_photos', function (Blueprint $table) {
            if (! Schema::hasColumn('tagged_photos', 'graduation_photo_id')) {
                $table->foreignId('graduation_photo_id')
                    ->nullable()
                    ->after('photo_id')
                    ->constrained('graduation_photos')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tagged_photos', function (Blueprint $table) {
            if (Schema::hasColumn('tagged_photos', 'graduation_photo_id')) {
                $table->dropConstrainedForeignId('graduation_photo_id');
            }
        });
    }
};
