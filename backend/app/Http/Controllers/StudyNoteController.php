<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
        return response()->json([
            'study_notes' => $document->studyNotes
        ]);
    }

    /**
     * Generate study notes for a document
     */
    public function generate(Document $document)
    {
        // Set PHP execution time limit to 5 minutes for this request
        set_time_limit(300);

        try {
            // Get all document files
            $files = $document->files()->orderBy('order')->get();
            
            // Delete existing study notes for this document
            $document->studyNotes()->delete();
            
            // Generate study notes for each file
            foreach ($files as $file) {
                try {
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
                } catch (\Exception $e) {
                    Log::error('Failed to process file ' . $file->id . ': ' . $e->getMessage());
                    // Continue with next file instead of failing completely
                    continue;
                }
            }

            // Check if any notes were generated
            if ($document->studyNotes()->count() === 0) {
                return response()->json([
                    'message' => 'Failed to generate any study notes. Please try again.'
                ], 500);
            }

            return response()->json([
                'message' => 'Study notes generated successfully',
                'study_notes' => $document->studyNotes
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to generate study notes: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to generate study notes: ' . $e->getMessage()
            ], 500);
        }
    }
} 