<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'fcm_token')) {
                $table->string('fcm_token')->nullable()->after('bio');
            }
            if (! Schema::hasColumn('users', 'is_premium')) {
                $table->boolean('is_premium')->default(false)->after('fcm_token');
            }
            if (! Schema::hasColumn('users', 'email_verified')) {
                $table->boolean('email_verified')->default(false)->after('is_premium');
            }
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $columns = array_filter(
                ['fcm_token', 'is_premium', 'email_verified'],
                fn ($column) => Schema::hasColumn('users', $column)
            );

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
