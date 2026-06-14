<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            if (! Schema::hasColumn('admins', 'totp_secret')) {
                $table->text('totp_secret')->nullable()->after('password');
            }
            if (! Schema::hasColumn('admins', 'totp_enabled_at')) {
                $table->timestamp('totp_enabled_at')->nullable()->after('totp_secret');
            }
            if (! Schema::hasColumn('admins', 'totp_pending_secret')) {
                $table->text('totp_pending_secret')->nullable()->after('totp_enabled_at');
            }
            if (! Schema::hasColumn('admins', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('last_login_at');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('suspended_at');
            }
        });

        if (! Schema::hasTable('password_histories')) {
            Schema::create('password_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('password');
                $table->timestamps();
                $table->index(['user_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('download_logs')) {
            Schema::create('download_logs', function (Blueprint $table) {
                $table->id();
                $table->nullableMorphs('actor');
                $table->string('event_type', 64);
                $table->string('resource_type', 100)->nullable();
                $table->unsignedBigInteger('resource_id')->nullable();
                $table->string('filename')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->index(['event_type', 'resource_type', 'resource_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('download_logs');
        Schema::dropIfExists('password_histories');

        Schema::table('admins', function (Blueprint $table) {
            foreach (['totp_secret', 'totp_enabled_at', 'totp_pending_secret', 'last_seen_at'] as $column) {
                if (Schema::hasColumn('admins', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'last_seen_at')) {
                $table->dropColumn('last_seen_at');
            }
        });
    }
};
