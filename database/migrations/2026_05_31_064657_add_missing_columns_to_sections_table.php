<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    /**
     * Your sections table currently has:
     *   id, name, course, created_at, updated_at, batch_id
     *
     * This migration adds the missing columns needed for the full hierarchy:
     * department links section to a college/department
     * batch_year the school/graduation year for this section
     * adviser_id optional FK to faculty table
     * description optional notes
     */
    public function up(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            if (! Schema::hasColumn('sections', 'department')) {
                $table->string('department')->nullable()->after('course');
            }
            if (! Schema::hasColumn('sections', 'batch_year')) {
                $table->unsignedSmallInteger('batch_year')->nullable()->after('department');
            }
            if (! Schema::hasColumn('sections', 'adviser_id')) {
                // Remove the ->constrained() if you don't have a faculty table yet
                $table->unsignedBigInteger('adviser_id')->nullable()->after('batch_year');
            }
            if (! Schema::hasColumn('sections', 'description')) {
                $table->string('description', 500)->nullable()->after('adviser_id');
            }
        });
    }
 
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropColumn(['department', 'batch_year', 'adviser_id', 'description']);
        });
    }
};
 