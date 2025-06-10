<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Quiz;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
        // Add middleware to check document ownership for all methods
        $this->middleware(function ($request, $next) {
            if ($request->route('document')) {
                $document = $request->route('document');
                if ($document->user_id !== Auth::id()) {
                    return response()->json([
                        'message' => 'Unauthorized access'
                    ], 403);
                }
            }
            return $next($request);
        });
    }

    /**
     * Get all quizzes for a document
     */
    public function index(Document $document)
    {
        try {
            // Check if document has any quizzes
            $quizzes = $document->quizzes()->with('questions')->get();

            if ($quizzes->isEmpty()) {
                return response()->json([
                    'message' => 'No quizzes found for this document',
                    'quizzes' => []
                ], 200); // Using 200 since empty result is not an error
            }

            // Log successful retrieval
            Log::info('Successfully retrieved quizzes', [
                'document_id' => $document->id,
                'quiz_count' => $quizzes->count(),
                'total_questions' => $quizzes->sum(function($quiz) {
                    return $quiz->questions->count();
                })
            ]);

            return response()->json([
                'quizzes' => $quizzes
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve quizzes: ' . $e->getMessage(), [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to retrieve quizzes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a new quiz for a document
     */
    public function generate(Request $request, Document $document)
    {
        // Set PHP execution time limit to 5 minutes for this request
        set_time_limit(300);

        $request->validate([
            'type' => 'required|in:multiple_choice,true_false,fill_in_blanks',
            'title' => 'required|string|max:255',
            'num_questions' => 'required|integer|min:1|max:50'
        ]);

        try {
            // Get study notes for this document
            $studyNotes = $document->studyNotes;
            
            if ($studyNotes->isEmpty()) {
                return response()->json([
                    'message' => 'No study notes found for this document. Please generate study notes first.'
                ], 404);
            }

            // Combine all study note content
            $combinedContent = $studyNotes->pluck('content')->join("\n\n");
            
            // Log the length of text being sent to AI
            Log::info('Generating quiz from text length: ' . strlen($combinedContent));

            DB::beginTransaction();

            // Create the quiz
            $quiz = $document->quizzes()->create([
                'title' => $request->title,
                'type' => $request->type,
                'total_questions' => $request->num_questions
            ]);

            // Generate questions using AI
            $response = $this->aiService->generateQuizQuestions(
                $combinedContent,
                $request->type,
                $request->num_questions
            );

            // Check if we got a successful response
            if (!isset($response['success']) || !$response['success']) {
                DB::rollBack();
                Log::error('Failed to generate quiz:', [
                    'error' => $response['error'] ?? 'Unknown error',
                    'success' => $response['success'] ?? false
                ]);
                
                return response()->json([
                    'message' => 'Failed to generate quiz: ' . ($response['error'] ?? 'Unknown error')
                ], 500);
            }
            
            if (empty($response['questions'])) {
                DB::rollBack();
                Log::error('No questions returned from AI service');
                return response()->json([
                    'message' => 'No questions were generated. Please try again.'
                ], 500);
            }

            // Save the generated questions
            foreach ($response['questions'] as $question) {
                $quiz->questions()->create([
                    'document_id' => $document->id,
                    'question' => $question['question'],
                    'type' => $request->type,
                    'options' => $question['options'] ?? null,
                    'correct_answer' => $question['correct_answer'],
                    'explanation' => $question['explanation'] ?? null
                ]);
            }

            DB::commit();

            // Load the quiz with its questions
            $quiz->load('questions');

            // Log success
            Log::info('Successfully created quiz:', [
                'quiz_id' => $quiz->id,
                'question_count' => $quiz->questions->count()
            ]);

            return response()->json([
                'message' => 'Quiz generated successfully',
                'quiz' => $quiz
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Quiz generation failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to generate quiz: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific quiz with its questions
     */
    public function show(Document $document, Quiz $quiz)
    {
        try {
            // Check if quiz belongs to the document
            if ($quiz->document_id !== $document->id) {
                Log::warning('Quiz does not belong to document', [
                    'document_id' => $document->id,
                    'quiz_id' => $quiz->id,
                    'quiz_document_id' => $quiz->document_id
                ]);

                return response()->json([
                    'message' => 'Quiz not found for this document'
                ], 404);
            }

            // Load the quiz with its questions
            $quiz->load('questions');

            // Check if quiz has any questions
            if ($quiz->questions->isEmpty()) {
                Log::warning('Quiz has no questions', [
                    'quiz_id' => $quiz->id,
                    'document_id' => $document->id
                ]);

                return response()->json([
                    'message' => 'Quiz exists but has no questions',
                    'quiz' => $quiz
                ], 200); // Using 200 since quiz exists but just has no questions
            }

            // Log successful retrieval
            Log::info('Successfully retrieved quiz', [
                'quiz_id' => $quiz->id,
                'document_id' => $document->id,
                'question_count' => $quiz->questions->count()
            ]);

            return response()->json([
                'quiz' => $quiz
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve quiz: ' . $e->getMessage(), [
                'document_id' => $document->id,
                'quiz_id' => $quiz->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to retrieve quiz: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a quiz and its questions
     */
    public function destroy(Document $document, Quiz $quiz)
    {
        if ($quiz->document_id !== $document->id) {
            return response()->json([
                'message' => 'Quiz not found for this document'
            ], 404);
        }

        try {
            DB::beginTransaction();
            
            // Delete the quiz (will cascade delete questions)
            $quiz->delete();
            
            DB::commit();

            return response()->json([
                'message' => 'Quiz deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Quiz deletion failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to delete quiz'
            ], 500);
        }
    }
} 