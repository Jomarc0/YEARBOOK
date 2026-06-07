<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tagged_photos')) {
            Schema::create('tagged_photos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('photo_id')
                    ->nullable()
                    ->constrained('photos')
                    ->cascadeOnDelete();
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();
                $table->foreignId('uploaded_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->string('photo_path')->nullable();
                $table->text('caption')->nullable();
                $table->float('similarity')->nullable();
                $table->float('confidence')->default(0);
                $table->foreignId('tagged_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('source')->default('manual');
                $table->string('status')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('tagged_photos', function (Blueprint $table) {
            if (! Schema::hasColumn('tagged_photos', 'photo_id')) {
                $table->foreignId('photo_id')
                      ->nullable()
                      ->after('id')
                      ->constrained('photos')
                      ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tagged_photos')) {
            return;
        }

        Schema::table('tagged_photos', function (Blueprint $table) {
            if (Schema::hasColumn('tagged_photos', 'photo_id')) {
                $table->dropConstrainedForeignId('photo_id');
            }
        });
    }
};
