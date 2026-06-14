<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('graduation_photos', function (Blueprint $table) {
            $table->string('title')->nullable()->after('graduation_album_id');
        });
    }

    public function down(): void
    {
        Schema::table('graduation_photos', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};
