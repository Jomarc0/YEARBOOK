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
        // Remove unused columns
        $table->dropColumn([
            'is_premium',
            'teaching_start',
            'teaching_end',
        ]);

        // Add missing Google SSO token
        if (! Schema::hasColumn('users', 'google_token')) {
            $table->string('google_token')->nullable()->after('google_id');
        }
    });
}
};
