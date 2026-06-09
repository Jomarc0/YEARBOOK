<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_views', function (Blueprint $table) {
            $table->id();
            $table->string('content_type', 40);
            $table->unsignedBigInteger('content_id');
            $table->unsignedBigInteger('viewer_user_id')->nullable()->index();
            $table->string('viewer_ip', 45)->nullable();
            $table->string('title')->nullable();
            $table->string('category', 60)->nullable();
            $table->string('url')->nullable();
            $table->timestamps();

            $table->index(['content_type', 'content_id']);
            $table->index(['content_type', 'created_at']);
            $table->index(['category', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_views');
    }
};
