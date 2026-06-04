<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            // role column — default 'admin' so existing rows are unaffected
            if (! Schema::hasColumn('admins', 'role')) {
                $table->enum('role', ['admin', 'super_admin'])
                      ->default('admin')
                      ->after('username');
            }

            // who created this admin account
            if (! Schema::hasColumn('admins', 'created_by')) {
                $table->unsignedBigInteger('created_by')
                      ->nullable()
                      ->after('role');

                $table->foreign('created_by')
                      ->references('id')
                      ->on('admins')
                      ->nullOnDelete();
            }

            // track last successful login
            if (! Schema::hasColumn('admins', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('created_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['role', 'created_by', 'last_login_at']);
        });
    }
};