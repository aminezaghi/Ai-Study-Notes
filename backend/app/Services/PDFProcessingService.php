<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class PDFProcessingService
{
    private Parser $parser;
    
    public function __construct()
    {
        $this->parser = new Parser();
    }
    
    /**
     * Store the uploaded PDF file and return its path
     */
    public function storePDF(UploadedFile $file): string
    {
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('pdfs', $filename, 'public');
        
        return $path;
    }
    
    /**
     * Process a PDF file and return its details
     */
    public function processPDF(string $filePath): array
    {
        $fullPath = Storage::disk('public')->path($filePath);
        $pdf = $this->parser->parseFile($fullPath);
        $rawText = $pdf->getText();
        
        return [
            'extracted_text' => $this->cleanExtractedText($rawText),
            'page_count' => count($pdf->getPages()),
        ];
    }
    
    /**
     * Clean and preprocess extracted text
     */
    private function cleanExtractedText(string $text): string
    {
        // Replace multiple spaces with a single space
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Fix common OCR issues with spaces between words
        $text = preg_replace('/([a-z])([A-Z])/', '$1 $2', $text);
        
        // Fix spaces around punctuation
        $text = preg_replace('/\s*([\.,;:!\?])\s*/', '$1 ', $text);
        
        // Fix spaces around parentheses and brackets
        $text = preg_replace('/\s*([()])\s*/', ' $1 ', $text);
        $text = preg_replace('/\s*([\[\]])\s*/', ' $1 ', $text);
        
        // Fix French specific issues
        $text = preg_replace('/([a-zA-Z])del([a-zA-Z])/', '$1 de l\'$2', $text);
        $text = preg_replace('/([a-zA-Z])del\'([a-zA-Z])/', '$1 de l\'$2', $text);
        
        // Fix common academic content issues
        $text = preg_replace('/([0-9])\s*\.\s*([0-9])/', '$1.$2', $text); // Fix decimal numbers
        $text = preg_replace('/([A-Z])\s*\.\s*([A-Z])/', '$1.$2', $text); // Fix abbreviations
        
        // Fix specific issues in your text
        $text = str_replace('lasituation', 'la situation', $text);
        $text = str_replace('financièrede', 'financière de', $text);
        $text = str_replace('l\'entreprise', 'l\'entreprise', $text);
        $text = str_replace('VERSIONPROVISOIRE', 'VERSION PROVISOIRE', $text);
        $text = str_replace('ASSISTANCETECHNIQUE', 'ASSISTANCE TECHNIQUE', $text);
        $text = str_replace('POURLEDÉVELOPPEMENT', 'POUR LE DÉVELOPPEMENT', $text);
        $text = str_replace('DEFORMATION', 'DE FORMATION', $text);
        $text = str_replace('DANSLESECTEUR', 'DANS LE SECTEUR', $text);
        $text = str_replace('GESTION-COMMERCE', 'GESTION - COMMERCE', $text);
        
        // Fix multiple consecutive newlines
        $text = preg_replace('/\n\s*\n/', "\n\n", $text);
        
        // Basic text normalization without Intl extension
        $text = preg_replace('/[\x00-\x1F\x7F]/u', '', $text); // Remove control characters
        $text = preg_replace('/\xC2\xA0/', ' ', $text); // Replace non-breaking spaces
        $text = preg_replace('/[^\P{C}\n]+/u', '', $text); // Remove invisible characters except newlines
        
        // Trim extra whitespace
        $text = trim($text);
        
        return $text;
    }
    
    /**
     * Delete a PDF file
     */
    public function deletePDF(string $filePath): bool
    {
        return Storage::disk('public')->delete($filePath);
    }
} 