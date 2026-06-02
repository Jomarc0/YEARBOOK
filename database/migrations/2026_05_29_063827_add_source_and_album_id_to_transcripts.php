<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;  
use Illuminate\Support\Facades\Schema;

/**
 * Adds two columns to the transcripts table:
 *
 *  source   — 'manual' (uploaded via TranscriptController) or
 *             'auto'   (generated from a graduation video upload).
 *             Used to show auto-transcripts to all premium users,
 *             not just the uploader.
 *
 *  album_id — nullable FK back to the graduation Album the transcript
 *             came from. Lets video cards link directly to their transcript
 *             without going through the speeches page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->string('source')->default('manual')->after('status');

            $table->foreignId('album_id')
                ->nullable()
                ->after('source')
                ->constrained('albums')
                ->nullOnDelete();   // if the album is deleted, keep the transcript but unlink it
        });

        // Back-fill existing rows — everything before this migration is manual
        DB::table('transcripts')->update(['source' => 'manual']);
    }

    public function down(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            $table->dropForeign(['album_id']);
            $table->dropColumn(['source', 'album_id']);
        });
    }
};