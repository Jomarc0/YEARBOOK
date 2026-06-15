<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Migration: add_note_and_reason_to_audit_logs
|--------------------------------------------------------------------------
| Run with:
|   php artisan make:migration add_note_and_reason_to_audit_logs --table=audit_logs
| Then replace the generated file content with this file, or paste the
| up() / down() methods into the generated stub.
|
| After placing the file in database/migrations/, run:
|   php artisan migrate
|--------------------------------------------------------------------------
*/

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_logs', 'note')) {
                $table->text('note')->nullable()->after('details');  // was 'description'
            }

            if (! Schema::hasColumn('audit_logs', 'reason')) {
                $table->string('reason', 255)->nullable()->after('note');
            }

            if (! Schema::hasColumn('audit_logs', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('reason');
                $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('audit_logs', 'subject_id')) {
                $table->unsignedBigInteger('subject_id')->nullable()->after('created_by');
                $table->index('subject_id');
            }

            if (! Schema::hasColumn('audit_logs', 'subject_name')) {
                $table->string('subject_name', 100)->nullable()->after('subject_id');
                $table->index('subject_name');
            }

            if (! Schema::hasColumn('audit_logs', 'severity')) {
                $table->string('severity', 20)->nullable()->default('info')->after('subject_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop foreign key before dropping column (MySQL requires this)
            if (Schema::hasColumn('audit_logs', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }

            // Drop indexes before dropping columns
            if (Schema::hasColumn('audit_logs', 'subject_id')) {
                $table->dropIndex(['subject_id']);
                $table->dropColumn('subject_id');
            }

            if (Schema::hasColumn('audit_logs', 'subject_name')) {
                $table->dropIndex(['subject_name']);
                $table->dropColumn('subject_name');
            }

            // Plain columns
            foreach (['note', 'reason', 'severity'] as $col) {
                if (Schema::hasColumn('audit_logs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};