<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_visibility')->default('public')->after('email_verified');
            $table->string('motto')->nullable()->after('profile_visibility');
            $table->integer('graduation_year')->nullable()->after('motto');
            $table->string('batch')->nullable()->after('graduation_year');
            $table->boolean('consent_accepted')->default(false)->after('batch');
            $table->string('google_id')->nullable()->after('consent_accepted');
            $table->string('avatar')->nullable()->after('google_id');
            $table->integer('profile_views')->default(0)->after('avatar');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_visibility','motto','graduation_year',
                'batch','consent_accepted','google_id','avatar','profile_views'
            ]);
        });
    }
};