<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('enhanced_study_notes', function (Blueprint $table) {
            $table->text('lesson_intro')->nullable();
            $table->text('section_summary')->nullable();
            $table->string('next_topic')->nullable();
            $table->text('task')->nullable();
            $table->text('explanation')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enhanced_study_notes', function (Blueprint $table) {
            $table->dropColumn([
                'lesson_intro',
                'section_summary',
                'next_topic',
                'task',
                'explanation'
            ]);
        });
    }
}; 