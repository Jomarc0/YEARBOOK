<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add batch_id to sections
        // NOTE: ->after() removed 'adviser_id' does not exist in sections table yet
        Schema::table('sections', function (Blueprint $table) {
            $table->foreignId('batch_id')
                  ->nullable()
                  ->constrained('batches')
                  ->nullOnDelete();
        });

        // Add batch_id to users (users already have string 'batch' + 'graduation_year')
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('batch_id')
                  ->nullable()
                  ->after('section_id')
                  ->constrained('batches')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropColumn('batch_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropColumn('batch_id');
        });
    }
};