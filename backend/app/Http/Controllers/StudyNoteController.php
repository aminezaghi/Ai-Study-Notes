<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudyNoteController extends Controller
{
    private AIService $aiService;

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
     * Get study notes for a document
     */
    public function index(Document $document)
    {
        try {
            // Check if document has any study notes
            $studyNotes = $document->studyNotes;

            if ($studyNotes->isEmpty()) {
                return response()->json([
                    'message' => 'No study notes found for this document',
                    'study_notes' => []
                ], 200); // Using 200 since empty result is not an error
            }

            // Log successful retrieval
            Log::info('Successfully retrieved study notes', [
                'document_id' => $document->id,
                'notes_count' => $studyNotes->count(),
                'total_content_length' => $studyNotes->sum(function($note) {
                    return strlen($note->content);
                })
            ]);

            return response()->json([
                'study_notes' => $studyNotes
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve study notes: ' . $e->getMessage(), [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to retrieve study notes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate study notes for a document
     */
    public function generate(Document $document)
    {
        // Set PHP execution time limit to 5 minutes for this request
        set_time_limit(300);

        try {
            // Check if document has any files
            $files = $document->files()->orderBy('order')->get();
            
            if ($files->isEmpty()) {
                Log::warning('No files found for document', [
                    'document_id' => $document->id
                ]);
                return response()->json([
                    'message' => 'No files found in this document. Please upload files first.'
                ], 404);
            }

            // Start database transaction
            DB::beginTransaction();
            
            // Delete existing study notes for this document
            $document->studyNotes()->delete();
            
            $processedFiles = 0;
            $failedFiles = 0;
            
            // Generate study notes for each file
            foreach ($files as $file) {
                try {
                    // Check if file has extracted text
                    if (empty($file->extracted_text)) {
                        Log::warning('File has no extracted text', [
                            'document_id' => $document->id,
                            'file_id' => $file->id
                        ]);
                        $failedFiles++;
                        continue;
                    }

                    // Log the length of text being sent to AI
                    Log::info('Generating study notes from text', [
                        'file_id' => $file->id,
                        'text_length' => strlen($file->extracted_text)
                    ]);

                    // Generate study notes using AI
                    $noteContent = $this->aiService->generateStudyNote($file->extracted_text);
                    
                    // Clean up the response
                    $content = is_array($noteContent) ? $noteContent['content'] : $noteContent;
                    $summary = is_array($noteContent) ? $noteContent['summary'] : substr($content, 0, 200) . '...';
                    
                    // Remove any JSON or markdown formatting
                    $content = str_replace(['```json', '```', '\n'], ['', '', "\n"], $content);
                    $summary = str_replace(['```json', '```', '\n'], ['', '', "\n"], $summary);
                    
                    // Decode any JSON strings that might be in the content
                    $decodedContent = json_decode($content, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedContent)) {
                        $content = $decodedContent['content'] ?? $content;
                        $summary = $decodedContent['summary'] ?? $summary;
                    }
                    
                    // Create study note record
                    $document->studyNotes()->create([
                        'content' => trim($content),
                        'summary' => trim($summary)
                    ]);

                    $processedFiles++;
                    
                } catch (\Exception $e) {
                    Log::error('Failed to process file: ' . $e->getMessage(), [
                        'document_id' => $document->id,
                        'file_id' => $file->id,
                        'error' => $e->getMessage()
                    ]);
                    $failedFiles++;
                    continue;
                }
            }

            // Check if any notes were generated
            if ($processedFiles === 0) {
                DB::rollBack();
                Log::error('Failed to generate any study notes', [
                    'document_id' => $document->id,
                    'total_files' => $files->count(),
                    'failed_files' => $failedFiles
                ]);
                
                return response()->json([
                    'message' => 'Failed to generate any study notes. Please try again.'
                ], 500);
            }

            // If some files failed but at least one succeeded
            if ($failedFiles > 0) {
                Log::warning('Some files failed during study note generation', [
                    'document_id' => $document->id,
                    'processed_files' => $processedFiles,
                    'failed_files' => $failedFiles
                ]);
            }

            DB::commit();

            // Log success
            Log::info('Successfully generated study notes', [
                'document_id' => $document->id,
                'processed_files' => $processedFiles,
                'failed_files' => $failedFiles,
                'total_notes' => $document->studyNotes()->count()
            ]);

            return response()->json([
                'message' => $failedFiles > 0 
                    ? 'Study notes generated with some failures. Some files could not be processed.'
                    : 'Study notes generated successfully',
                'study_notes' => $document->studyNotes,
                'stats' => [
                    'total_files' => $files->count(),
                    'processed_files' => $processedFiles,
                    'failed_files' => $failedFiles
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Study note generation failed: ' . $e->getMessage(), [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to generate study notes: ' . $e->getMessage()
            ], 500);
        }
    }
} 