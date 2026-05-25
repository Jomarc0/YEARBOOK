<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            if (! Schema::hasColumn('transcripts', 'public_id')) {
                $table->string('public_id')->nullable()->after('audio_path');
            }
            if (! Schema::hasColumn('transcripts', 'notes')) {
                $table->longText('notes')->nullable()->after('language');
            }
        });

        // Only add FULLTEXT if it doesn't already exist
        if (config('database.default') === 'mysql') {
            $indexExists = collect(DB::select("SHOW INDEX FROM transcripts WHERE Key_name = 'ft_transcripts_search'"))->isNotEmpty();

            if (! $indexExists) {
                DB::statement(
                    'ALTER TABLE transcripts ADD FULLTEXT INDEX ft_transcripts_search (title, transcript_text, notes)'
                );
            }
        }
    }

    public function down(): void
    {
        if (config('database.default') === 'mysql') {
            $indexExists = collect(DB::select("SHOW INDEX FROM transcripts WHERE Key_name = 'ft_transcripts_search'"))->isNotEmpty();

            if ($indexExists) {
                DB::statement('ALTER TABLE transcripts DROP INDEX ft_transcripts_search');
            }
        }

        Schema::table('transcripts', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('transcripts', 'public_id')) $cols[] = 'public_id';
            if (Schema::hasColumn('transcripts', 'notes'))     $cols[] = 'notes';
            if (! empty($cols)) $table->dropColumn($cols);
        });
    }
};