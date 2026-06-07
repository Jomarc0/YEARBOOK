<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'profile_visibility')) {
                $table->string('profile_visibility')->default('public')->after('email_verified');
            }
            if (! Schema::hasColumn('users', 'motto')) {
                $table->string('motto')->nullable()->after('profile_visibility');
            }
            if (! Schema::hasColumn('users', 'graduation_year')) {
                $table->integer('graduation_year')->nullable()->after('motto');
            }
            if (! Schema::hasColumn('users', 'batch')) {
                $table->string('batch')->nullable()->after('graduation_year');
            }
            if (! Schema::hasColumn('users', 'consent_accepted')) {
                $table->boolean('consent_accepted')->default(false)->after('batch');
            }
            if (! Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->after('consent_accepted');
            }
            if (! Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('google_id');
            }
            if (! Schema::hasColumn('users', 'profile_views')) {
                $table->integer('profile_views')->default(0)->after('avatar');
            }
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $columns = array_filter([
                'profile_visibility','motto','graduation_year',
                'batch','consent_accepted','google_id','avatar','profile_views'
            ], fn ($column) => Schema::hasColumn('users', $column));

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
