<?php
// ─── Migration ─────────────────────────────────────────────────────────────
// database/migrations/2025_xx_xx_create_yearbook_bookmarks_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yearbook_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('batch_id');
            $table->unsignedInteger('page_index');
            $table->string('label', 120);
            $table->timestamps();

            // One bookmark per user per page per batch
            $table->unique(['user_id', 'batch_id', 'page_index']);
            $table->index(['user_id', 'batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yearbook_bookmarks');
    }
};