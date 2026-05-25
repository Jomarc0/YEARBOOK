<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('name');                     
            $table->string('course');                
            $table->string('course_code', 20);        
            $table->integer('graduation_year');
            $table->string('department');               
            $table->text('description')->nullable();
            $table->unique(['course', 'graduation_year']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};