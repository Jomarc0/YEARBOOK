<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
            $table->string('title')->nullable()->after('name');
            $table->string('department')->nullable()->after('title');
            $table->text('bio')->nullable()->after('department');
            $table->string('image')->nullable()->after('bio');
        });
    }

    public function down(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            $table->dropColumn(['name', 'title', 'department', 'bio', 'image']);
        });
    }
};
