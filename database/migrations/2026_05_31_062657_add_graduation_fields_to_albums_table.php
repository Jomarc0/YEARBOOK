<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->foreignId('batch_id')
                ->nullable()
                ->after('user_id')
                ->constrained('batches')
                ->nullOnDelete();

            $table->string('status')->default('draft')->after('type');
            $table->timestamp('published_at')->nullable()->after('status');

            $table->index('status');
            $table->index(['type', 'status']);
            $table->index(['batch_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['type', 'status']);
            $table->dropIndex(['batch_id', 'type', 'status']);
            $table->dropColumn(['batch_id', 'status', 'published_at']);
        });
    }
};
