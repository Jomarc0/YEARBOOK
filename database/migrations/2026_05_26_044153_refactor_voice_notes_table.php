<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voice_notes', function (Blueprint $table) {
            // Rename user_id sender_id
            $table->renameColumn('user_id', 'sender_id');

            // Add recipient
            $table->foreignId('recipient_id')
                  ->after('sender_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Moderation fields
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending')
                  ->after('duration_seconds');

            $table->text('reject_reason')->nullable()->after('status');

            $table->foreignId('reviewed_by')
                  ->nullable()
                  ->after('reject_reason')
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');

            // Composite index for the two most common queries
            $table->index(['recipient_id', 'status']);
            $table->index(['sender_id']);
        });
    }

    public function down(): void
    {
        Schema::table('voice_notes', function (Blueprint $table) {
            $table->dropIndex(['recipient_id', 'status']);
            $table->dropIndex(['sender_id']);
            $table->dropConstrainedForeignId('recipient_id');
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['status', 'reject_reason', 'reviewed_at']);
            $table->renameColumn('sender_id', 'user_id');
        });
    }
};