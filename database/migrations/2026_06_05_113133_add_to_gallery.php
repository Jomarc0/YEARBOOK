<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add moderation audit columns to existing galleries table
        Schema::table('galleries', function (Blueprint $table) {
            if (!Schema::hasColumn('galleries', 'rejection_reason')) {
                $table->string('rejection_reason')->nullable()->after('sort_order');
            }

            if (!Schema::hasColumn('galleries', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('rejection_reason');
            }

            if (!Schema::hasColumn('galleries', 'approved_by')) {
                $table->foreignId('approved_by')
                      ->nullable()
                      ->after('approved_at')
                      ->constrained('users')
                      ->nullOnDelete();
            }

            if (!Schema::hasColumn('galleries', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('approved_by');
            }

            if (!Schema::hasColumn('galleries', 'rejected_by')) {
                $table->foreignId('rejected_by')
                      ->nullable()
                      ->after('rejected_at')
                      ->constrained('users')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('galleries', function (Blueprint $table) {
            // Drop foreign keys first, then columns
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);

            $table->dropColumn([
                'rejection_reason',
                'approved_at',
                'approved_by',
                'rejected_at',
                'rejected_by',
            ]);
        });
    }
};