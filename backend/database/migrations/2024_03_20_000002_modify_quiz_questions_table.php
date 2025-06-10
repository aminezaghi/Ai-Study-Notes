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
        Schema::table('quiz_questions', function (Blueprint $table) {
            // Drop existing columns
            $table->dropColumn(['options', 'correct_answer']);
            
            // Add new columns
            $table->foreignId('quiz_id')->after('document_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['multiple_choice', 'true_false', 'fill_in_blanks'])->after('question');
            $table->json('options')->nullable()->after('type'); // For multiple choice questions
            $table->text('correct_answer')->after('options');
            $table->text('explanation')->nullable()->after('correct_answer'); // Optional explanation for the answer
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropForeign(['quiz_id']);
            $table->dropColumn(['quiz_id', 'type', 'explanation']);
            
            // Restore original columns
            $table->json('options')->after('question');
            $table->text('correct_answer')->after('options');
        });
    }
}; 