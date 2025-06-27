<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\StudyNote;
use App\Models\EnhancedStudyNote;
use App\Services\EnhancedStudyNoteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EnhancedStudyNoteController extends Controller
{
    private EnhancedStudyNoteService $enhancedNoteService;

    public function __construct(EnhancedStudyNoteService $enhancedNoteService)
    {
        $this->enhancedNoteService = $enhancedNoteService;
        
        // Add middleware to check document ownership
        $this->middleware(function ($request, $next) {
            try {
                if ($request->route('document')) {
                    $document = $request->route('document');
                    if ($document->user_id !== Auth::id()) {
                        Log::warning('Unauthorized access attempt', [
                            'user_id' => Auth::id(),
                            'document_id' => $document->id,
                            'ip' => $request->ip()
                        ]);
                        return response()->json([
                            'message' => 'You do not have permission to access this document',
                            'error' => 'unauthorized_access'
                        ], 403);
                    }
                }
                return $next($request);
            } catch (\Exception $e) {
                Log::error('Error in document ownership middleware', [
                    'error' => $e->getMessage(),
                    'user_id' => Auth::id(),
                    'ip' => $request->ip()
                ]);
                return response()->json([
                    'message' => 'An error occurred while verifying document access',
                    'error' => 'authorization_error'
                ], 500);
            }
        });
    }

    /**
     * Get enhanced study notes for a document
     */
    public function index(Document $document)
    {
        try {
            $enhancedNotes = $document->enhancedStudyNotes()
                ->with('questions')
                ->orderBy('order')
                ->get();

            return response()->json([
                'enhanced_notes' => $enhancedNotes
            ]);
        } catch (ModelNotFoundException $e) {
            Log::error('Document not found', [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Document not found',
                'error' => 'document_not_found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching enhanced notes', [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to retrieve enhanced study notes',
                'error' => 'fetch_error'
            ], 500);
        }
    }

    /**
     * Generate enhanced study notes from the document's study note
     */
    public function generate(Request $request, Document $document)
    {
        try {
            // Set PHP execution time limit to 5 minutes for this request
            set_time_limit(300);

            // Validate request
            $validated = $request->validate([
                'section_title' => 'required|string|max:255'
            ]);

            // Get the document's study note
            $studyNote = $document->studyNotes()->first();

            if (!$studyNote) {
                Log::warning('No study note found for document', [
                    'document_id' => $document->id
                ]);
                return response()->json([
                    'message' => 'No study note found for this document. Please generate study notes first.',
                    'error' => 'study_note_not_found'
                ], 404);
            }

            // Check if study note has content
            if (empty($studyNote->content)) {
                Log::warning('Empty study note content', [
                    'study_note_id' => $studyNote->id
                ]);
                return response()->json([
                    'message' => 'Cannot generate enhanced notes from empty study note',
                    'error' => 'empty_content'
                ], 422);
            }

            try {
                // Delete existing enhanced notes for this section if any
                $document->enhancedStudyNotes()
                    ->where('section_title', $request->section_title)
                    ->delete();

                // Generate enhanced study notes using AI
                $response = $this->enhancedNoteService->generateEnhancedNotes(
                    $studyNote,
                    $request->section_title
                );

                Log::info('Enhanced study notes generated successfully', [
                    'document_id' => $document->id,
                    'study_note_id' => $studyNote->id,
                    'enhanced_note_id' => $response['enhanced_note']->id
                ]);

                return response()->json([
                    'message' => 'Enhanced study notes generated successfully',
                    'enhanced_note' => $response['enhanced_note'],
                    'questions' => $response['questions']
                ]);

            } catch (ValidationException $e) {
                Log::error('AI service validation error', [
                    'study_note_id' => $studyNote->id,
                    'error' => $e->getMessage()
                ]);
                return response()->json([
                    'message' => 'Invalid AI service response format',
                    'error' => 'validation_error',
                    'details' => $e->errors()
                ], 422);
            } catch (HttpException $e) {
                Log::error('AI service HTTP error', [
                    'study_note_id' => $studyNote->id,
                    'status' => $e->getStatusCode(),
                    'error' => $e->getMessage()
                ]);
                return response()->json([
                    'message' => 'AI service error: ' . $e->getMessage(),
                    'error' => 'ai_service_error'
                ], $e->getStatusCode());
            } catch (\Exception $e) {
                Log::error('Failed to generate enhanced study notes', [
                    'study_note_id' => $studyNote->id,
                    'error' => $e->getMessage()
                ]);
                return response()->json([
                    'message' => 'Failed to generate enhanced study notes',
                    'error' => 'generation_error',
                    'details' => $e->getMessage()
                ], 500);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Invalid input data',
                'error' => 'validation_error',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Unexpected error in generate method', [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'An unexpected error occurred',
                'error' => 'unexpected_error'
            ], 500);
        }
    }

    /**
     * Get a specific enhanced study note with its questions
     */
    public function show(Document $document, EnhancedStudyNote $enhancedNote)
    {
        try {
            // Check if the enhanced note belongs to this document
            if ($enhancedNote->document_id !== $document->id) {
                Log::warning('Enhanced note does not belong to document', [
                    'document_id' => $document->id,
                    'enhanced_note_id' => $enhancedNote->id
                ]);
                return response()->json([
                    'message' => 'Enhanced study note not found in this document',
                    'error' => 'invalid_relationship'
                ], 404);
            }

            return response()->json([
                'enhanced_note' => $enhancedNote->load('questions')
            ]);

        } catch (ModelNotFoundException $e) {
            Log::error('Enhanced note not found', [
                'document_id' => $document->id,
                'enhanced_note_id' => $enhancedNote->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Enhanced study note not found',
                'error' => 'note_not_found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching enhanced note', [
                'document_id' => $document->id,
                'enhanced_note_id' => $enhancedNote->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to retrieve enhanced study note',
                'error' => 'fetch_error'
            ], 500);
        }
    }

    /**
     * Delete an enhanced study note
     */
    public function destroy(Document $document, EnhancedStudyNote $enhancedNote)
    {
        try {
            // Check if the enhanced note belongs to this document
            if ($enhancedNote->document_id !== $document->id) {
                Log::warning('Enhanced note does not belong to document', [
                    'document_id' => $document->id,
                    'enhanced_note_id' => $enhancedNote->id
                ]);
                return response()->json([
                    'message' => 'Enhanced study note not found in this document',
                    'error' => 'invalid_relationship'
                ], 404);
            }

            $enhancedNote->delete();

            Log::info('Enhanced study note deleted successfully', [
                'document_id' => $document->id,
                'enhanced_note_id' => $enhancedNote->id
            ]);

            return response()->json([
                'message' => 'Enhanced study note deleted successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            Log::error('Enhanced note not found for deletion', [
                'document_id' => $document->id,
                'enhanced_note_id' => $enhancedNote->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Enhanced study note not found',
                'error' => 'note_not_found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting enhanced note', [
                'document_id' => $document->id,
                'enhanced_note_id' => $enhancedNote->id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'message' => 'Failed to delete enhanced study note',
                'error' => 'deletion_error'
            ], 500);
        }
    }
} 