<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            foreach ([
                'phone',
                'office_location',
                'date_joined',
                'education',
                'specializations',
                'linkedin_url',
                'status',
                'college',
            ] as $column) {
                if (Schema::hasColumn('faculties', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            if (! Schema::hasColumn('faculties', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (! Schema::hasColumn('faculties', 'office_location')) {
                $table->string('office_location')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('faculties', 'date_joined')) {
                $table->date('date_joined')->nullable()->after('office_location');
            }
            if (! Schema::hasColumn('faculties', 'education')) {
                $table->text('education')->nullable()->after('date_joined');
            }
            if (! Schema::hasColumn('faculties', 'specializations')) {
                $table->text('specializations')->nullable()->after('education');
            }
            if (! Schema::hasColumn('faculties', 'linkedin_url')) {
                $table->string('linkedin_url')->nullable()->after('specializations');
            }
            if (! Schema::hasColumn('faculties', 'status')) {
                $table->enum('status', ['active', 'inactive', 'on_leave'])->default('active')->after('linkedin_url');
            }
            if (! Schema::hasColumn('faculties', 'college')) {
                $table->string('college')->nullable()->after('status');
            }
        });
    }
};
