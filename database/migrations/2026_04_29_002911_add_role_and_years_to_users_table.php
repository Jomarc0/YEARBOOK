<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('users', function (Blueprint $table) {
        // I-check muna natin kung wala pa ang role bago idagdag
        if (!Schema::hasColumn('users', 'role')) {
            $table->string('role')->default('student')->after('email');
        }
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        if (Schema::hasColumn('users', 'role')) {
            $table->dropColumn(['role']);
        }
    });
}
};
