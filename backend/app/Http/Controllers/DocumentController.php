<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\PDFProcessingService;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DocumentController extends Controller
{
    private PDFProcessingService $pdfService;
    private AIService $aiService;

    public function __construct(PDFProcessingService $pdfService, AIService $aiService)
    {
        $this->pdfService = $pdfService;
        $this->aiService = $aiService;
        // Add middleware to check document ownership for specific methods
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
        })->only(['show', 'destroy', 'update']);
    }

    /**
     * Display a listing of the documents.
     */
    public function index()
    {
        $documents = Auth::user()->documents()
            ->with('files')
            ->latest()
            ->get();
        
        return response()->json([
            'documents' => $documents
        ]);
    }

    /**
     * Store a newly created document in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            // 'title' => 'required|string|max:255', // Removed, will be generated
            // 'description' => 'nullable|string', // Removed, will be generated
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:pdf|max:10240', // max 10MB per file
        ]);

        try {
            DB::beginTransaction();

            // Process the first PDF file to extract text for AI
            $firstFile = $request->file('files')[0];
            $firstFilePath = $this->pdfService->storePDF($firstFile);
            $firstPdfInfo = $this->pdfService->processPDF($firstFilePath);
            $extractedText = $firstPdfInfo['extracted_text'];

            // Generate title and description using AI
            $aiResult = $this->aiService->generateTitleAndDescription($extractedText);
            $title = $aiResult['title'] ?? 'Untitled Document';
            $description = $aiResult['description'] ?? null;

            // Create the document
            $document = Auth::user()->documents()->create([
                'title' => $title,
                'description' => $description,
                'status' => 'processing'
            ]);

            // Process each PDF file
            foreach ($request->file('files') as $index => $file) {
                // Store the PDF file
                $filePath = $this->pdfService->storePDF($file);
                
                // Process the PDF and extract information
                $pdfInfo = $this->pdfService->processPDF($filePath);

                // Create document file record
                $document->files()->create([
                    'original_filename' => $file->getClientOriginalName(),
                    'file_path' => $filePath,
                    'extracted_text' => $pdfInfo['extracted_text'],
                    'page_count' => $pdfInfo['page_count'],
                    'order' => $index
                ]);
            }

            // Update document status
            $document->update(['status' => 'completed']);

            DB::commit();

            return response()->json([
                'message' => 'Document uploaded successfully',
                'document' => $document->load('files')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PDF processing failed: ' . $e->getMessage());
            
            // Clean up any stored files
            if (isset($document)) {
                foreach ($document->files as $file) {
                    $this->pdfService->deletePDF($file->file_path);
                }
            }

            return response()->json([
                'message' => 'Failed to process document'
            ], 500);
        }
    }

    /**
     * Display the specified document.
     */
    public function show(Document $document)
    {
        return response()->json([
            'document' => $document->load(['files', 'studyNotes', 'flashcards', 'quizQuestions'])
        ]);
    }

    /**
     * Remove the specified document from storage.
     */
    public function destroy(Document $document)
    {
        try {
            DB::beginTransaction();

            // Delete all associated PDF files
            foreach ($document->files as $file) {
                $this->pdfService->deletePDF($file->file_path);
            }
            
            // Delete the document record (will cascade delete files)
            $document->delete();

            DB::commit();

            return response()->json([
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Document deletion failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to delete document'
            ], 500);
        }
    }
}
