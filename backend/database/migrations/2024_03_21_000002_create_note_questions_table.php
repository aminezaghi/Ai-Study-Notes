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
        Schema::create('note_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enhanced_note_id')->constrained('enhanced_study_notes')->onDelete('cascade');
            $table->enum('type', ['mcq', 'fill_blank', 'short_answer']);
            $table->text('question');
            $table->json('choices')->nullable();
            $table->string('correct_answer');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('note_questions');
    }
}; 