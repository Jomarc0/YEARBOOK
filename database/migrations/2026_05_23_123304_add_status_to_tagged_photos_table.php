<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('tagged_photos', function (Blueprint $table) {
            if (! Schema::hasColumn('tagged_photos', 'status')) {
                $table->string('status')->nullable()->after('source');
            }
            if (! Schema::hasColumn('tagged_photos', 'source')) {
                $table->string('source')->default('rekognition');
            }
            if (! Schema::hasColumn('tagged_photos', 'confidence')) {
                $table->float('confidence')->default(0);
            }
            if (! Schema::hasColumn('tagged_photos', 'tagged_by')) {
                $table->foreignId('tagged_by')->nullable()->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tagged_photos', function (Blueprint $table) {
            $table->dropColumn(['status', 'source', 'confidence', 'tagged_by']);
        });
    }
};
