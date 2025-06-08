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
    }

    /**
     * Get study notes for a document
     */
    public function index(Document $document)
    {
        // Check if the authenticated user owns the document
        if ($document->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'study_notes' => $document->studyNotes
        ]);
    }

    /**
     * Generate study notes for a document
     */
    public function generate(Document $document)
    {
        // Check if the authenticated user owns the document
        if ($document->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            // Get all document files
            $files = $document->files()->orderBy('order')->get();
            
            // Generate study notes for each file
            foreach ($files as $file) {
                // Generate study notes using AI
                $noteContent = $this->aiService->generateStudyNote($file->extracted_text);
                
                // Create study note record
                $document->studyNotes()->create([
                    'content' => $noteContent['content'],
                    'summary' => $noteContent['summary']
                ]);
            }

            return response()->json([
                'message' => 'Study notes generated successfully',
                'study_notes' => $document->studyNotes
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to generate study notes: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to generate study notes'
            ], 500);
        }
    }
} 