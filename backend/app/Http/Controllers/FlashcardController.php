<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Flashcard;
use App\Services\FlashcardsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FlashcardController extends Controller
{
    private FlashcardsService $aiService;

    public function __construct(FlashcardsService $aiService)
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
     * Get flashcards for a document
     */
    public function index(Document $document)
    {
        return response()->json([
            'flashcards' => $document->flashcards
        ]);
    }

    /**
     * Generate flashcards for a document
     */
    public function generate(Request $request, Document $document)
    {
        // Set PHP execution time limit to 5 minutes for this request
        set_time_limit(300);

        $request->validate([
            'num_cards' => 'required|integer|min:1|max:50'
        ]);

        try {
            // Get study notes for this document
            $studyNotes = $document->studyNotes;
            
            if ($studyNotes->isEmpty()) {
                return response()->json([
                    'message' => 'No study notes found for this document. Please generate study notes first.'
                ], 404);
            }

            // Delete existing flashcards for this document
            $document->flashcards()->delete();
            
            // Combine all study note summaries
            $combinedSummary = $studyNotes->pluck('summary')->join("\n\n");
            
            // Log the length of text being sent to AI
            Log::info('Generating flashcards from text length: ' . strlen($combinedSummary));
            
            try {
                // Generate flashcards using AI
                $response = $this->aiService->generateFlashcards($combinedSummary, $request->num_cards);
                
                // Log the response for debugging
                Log::debug('AI Service response:', ['response' => $response]);
                
                // Check if we got a successful response
                if (!isset($response['success']) || !$response['success']) {
                    Log::error('Failed to generate flashcards:', [
                        'error' => $response['error'] ?? 'Unknown error',
                        'success' => $response['success'] ?? false
                    ]);
                    
                    return response()->json([
                        'message' => 'Failed to generate flashcards: ' . ($response['error'] ?? 'Unknown error')
                    ], 500);
                }
                
                if (empty($response['flashcards'])) {
                    Log::error('No flashcards returned from AI service');
                    return response()->json([
                        'message' => 'No flashcards were generated. Please try again.'
                    ], 500);
                }
                
                // Store each flashcard
                foreach ($response['flashcards'] as $card) {
                    $document->flashcards()->create([
                        'question' => $card['question'],
                        'answer' => $card['answer']
                    ]);
                }

                $createdFlashcards = $document->flashcards;
                Log::info('Successfully created flashcards:', ['count' => $createdFlashcards->count()]);

                return response()->json([
                    'message' => 'Flashcards generated successfully',
                    'flashcards' => $createdFlashcards
                ]);

            } catch (\Exception $e) {
                Log::error('Failed to generate flashcards: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Failed to generate flashcards: ' . $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process document for flashcards: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to process document for flashcards: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a flashcard
     */
    public function destroy(Document $document, Flashcard $flashcard)
    {
        // Ensure the flashcard belongs to this document
        if ($flashcard->document_id !== $document->id) {
            return response()->json([
                'message' => 'Flashcard not found'
            ], 404);
        }

        $flashcard->delete();
        return response()->json([
            'message' => 'Flashcard deleted successfully'
        ]);
    }
} 