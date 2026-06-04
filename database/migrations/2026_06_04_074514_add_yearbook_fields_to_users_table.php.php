<?php
// database/migrations/2024_xx_xx_add_yearbook_fields_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // ── Personal ──────────────────────────────────────────
        if (!Schema::hasColumn('users', 'nickname'))
            $table->string('nickname')->nullable()->after('last_name');
        if (!Schema::hasColumn('users', 'birthday'))
            $table->date('birthday')->nullable()->after('nickname');
        if (!Schema::hasColumn('users', 'hometown'))
            $table->string('hometown')->nullable()->after('birthday');

        // ── Yearbook profile ──────────────────────────────────
        if (!Schema::hasColumn('users', 'honors'))
            $table->string('honors')->nullable()->after('graduation_year');
        if (!Schema::hasColumn('users', 'organizations'))
            $table->text('organizations')->nullable()->after('honors');
        if (!Schema::hasColumn('users', 'achievements'))
            $table->text('achievements')->nullable()->after('organizations');

        // ── Yearbook quotes ───────────────────────────────────
        if (!Schema::hasColumn('users', 'ambition'))
            $table->text('ambition')->nullable()->after('bio');
        if (!Schema::hasColumn('users', 'future_plans'))
            $table->text('future_plans')->nullable()->after('ambition');
        if (!Schema::hasColumn('users', 'fondest_memory'))
            $table->text('fondest_memory')->nullable()->after('future_plans');
        if (!Schema::hasColumn('users', 'most_likely_to'))
            $table->text('most_likely_to')->nullable()->after('fondest_memory');

        // ── Yearbook messages ─────────────────────────────────
        if (!Schema::hasColumn('users', 'message_to_batchmates'))
            $table->text('message_to_batchmates')->nullable()->after('most_likely_to');
        if (!Schema::hasColumn('users', 'message_to_parents'))
            $table->text('message_to_parents')->nullable()->after('message_to_batchmates');

        // ── Social links ──────────────────────────────────────
        if (!Schema::hasColumn('users', 'facebook_url'))
            $table->string('facebook_url')->nullable()->after('avatar');
        if (!Schema::hasColumn('users', 'instagram_url'))
            $table->string('instagram_url')->nullable()->after('facebook_url');
        if (!Schema::hasColumn('users', 'linkedin_url'))
            $table->string('linkedin_url')->nullable()->after('instagram_url');
        if (!Schema::hasColumn('users', 'github_url'))
            $table->string('github_url')->nullable()->after('linkedin_url');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $columns = [
            'nickname', 'birthday', 'hometown',
            'honors', 'organizations', 'achievements',
            'ambition', 'future_plans', 'fondest_memory', 'most_likely_to',
            'message_to_batchmates', 'message_to_parents',
            'facebook_url', 'instagram_url', 'linkedin_url', 'github_url',
        ];

        // Only drop columns that actually exist
        $existing = array_filter($columns, fn($col) => Schema::hasColumn('users', $col));
        if (!empty($existing)) {
            $table->dropColumn($existing);
        }
    });
}
};