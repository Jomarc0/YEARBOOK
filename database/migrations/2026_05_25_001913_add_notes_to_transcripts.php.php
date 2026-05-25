<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transcripts', function (Blueprint $table) {
            if (! Schema::hasColumn('transcripts', 'notes')) {
                $table->longText('notes')->nullable()->after('language');
            }
        });

        // FULLTEXT index for searchable speeches (MySQL only)
        // Allows: WHERE MATCH(title, transcript_text, notes) AGAINST (?)
        if (config('database.default') === 'mysql') {
            DB::statement(
                'ALTER TABLE transcripts ADD FULLTEXT INDEX ft_transcripts_search (title, transcript_text, notes)'
            );
        }
    }

    public function down(): void
    {
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE transcripts DROP INDEX ft_transcripts_search');
        }

        Schema::table('transcripts', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};