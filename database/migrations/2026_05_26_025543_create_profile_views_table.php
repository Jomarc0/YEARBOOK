<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_views', function (Blueprint $table) {
            $table->id();

            // The profile being viewed
            $table->foreignId('viewed_user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // The visitor nullable for unauthenticated guests
            $table->foreignId('viewer_user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // IP fallback for guest deduplication
            $table->string('viewer_ip', 45)->nullable();

            $table->timestamps();

            // Indexes for the most common queries
            $table->index('viewed_user_id');                    // topViewed(), weeklyTrend()
            $table->index(['viewed_user_id', 'created_at']);    // trending(), weeklyTrend()
            $table->index(['viewer_user_id', 'viewed_user_id', 'created_at']); // dedup check
        });

        // Add denormalized counter to users if it doesn't exist yet
        if (!Schema::hasColumn('users', 'profile_views')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('profile_views')->default(0)->after('profile_picture');
                $table->index('profile_views'); // for ORDER BY in topViewed()
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_views');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_views');
        });
    }
};