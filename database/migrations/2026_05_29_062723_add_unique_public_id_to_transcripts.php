<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a unique index on transcripts.public_id.
 *
 * Why: AutoTranscribeVideo checks for duplicates at the application level,
 * but this index is the database-level safety net that prevents two concurrent
 * jobs from creating two Transcript records for the same Cloudinary asset
 * (race condition on rapid re-uploads or queue retries).
 *
 * public_id is nullable on manually-uploaded transcripts that predate this
 * migration, so we use a partial unique index approach MySQL/MariaDB allow
 * multiple NULLs in a unique column, so nullable is fine here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->unique('public_id');
        });
    }

    public function down(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->dropUnique(['public_id']);
        });
    }
};