<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add read_at timestamp to messages (
        Schema::table('messages', function (Blueprint $table) {
            // Only add if column doesn't already exist
            if (! Schema::hasColumn('messages', 'read_at')) {
                $table->timestamp('read_at')->nullable()->after('is_read');
            }
            // Index for fast unread counts and thread queries
            if (! Schema::hasIndex('messages', 'messages_sender_receiver_index')) {
                $table->index(['sender_id', 'receiver_id'], 'messages_sender_receiver_index');
            }
            if (! Schema::hasIndex('messages', 'messages_receiver_read_index')) {
                $table->index(['receiver_id', 'is_read'], 'messages_receiver_read_index');
            }
        });

        // Track online presence per user
        if (! Schema::hasTable('user_presence')) {
            Schema::create('user_presence', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamp('last_seen_at')->nullable();
                $table->boolean('is_online')->default(false);
                $table->timestamps();

                $table->unique('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('read_at');
        });
        Schema::dropIfExists('user_presence');
    }
};