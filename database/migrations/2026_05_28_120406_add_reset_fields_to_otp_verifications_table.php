<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Run: php artisan make:migration add_reset_fields_to_otp_verifications_table
// Then replace the generated file content with this.

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_verifications', function (Blueprint $table) {
            // Distinguishes login OTPs from password-reset OTPs
            $table->string('type')->default('verification')->after('email');

            // Short-lived token exchanged after OTP is verified, used to authorize the actual password change
            $table->string('reset_token')->nullable()->after('used');
        });
    }

    public function down(): void
    {
        Schema::table('otp_verifications', function (Blueprint $table) {
            $table->dropColumn(['type', 'reset_token']);
        });
    }
};