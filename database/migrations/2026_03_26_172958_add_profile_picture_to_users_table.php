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
        Schema::table('users', function (Blueprint $table) {
            // Idadagdag natin ang profile_picture column.
            // Nullable ito para hindi mag-error ang mga lumang users na wala pang photo.
            $table->string('profile_picture')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Tatanggalin ang column kapag nag-rollback (php artisan migrate:rollback)
            $table->dropColumn('profile_picture');
        });
    }
};
