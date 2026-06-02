<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->string('course')->nullable()->change();
            $table->string('course_code', 20)->nullable()->change();
            $table->string('department')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->string('course')->nullable(false)->change();
            $table->string('course_code', 20)->nullable(false)->change();
            $table->string('department')->nullable(false)->change();
        });
    }
};
