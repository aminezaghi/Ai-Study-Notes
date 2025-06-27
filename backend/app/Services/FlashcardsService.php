<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class FlashcardsService
{
    private string $apiKey;
    private string $endpoint;
    private Client $client;
    private const MAX_TOKENS_PER_REQUEST = 30000; // Conservative limit for safety
    private const ESTIMATED_TOKENS_PER_CHAR = 0.25; // More conservative estimate (4 chars per token)

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        
        // Set PHP execution time limit to 5 minutes
        set_time_limit(300);
        
        // Increase timeout for larger requests
        $this->client = new Client([
            'timeout' => 180, // 3 minutes timeout
            'connect_timeout' => 30, // 30 seconds for initial connection
            'http_errors' => false
        ]);
    }


    /**
     * Generate flashcards from text
     */
    public function generateFlashcards(string $text, int $numCards): array
    {
        try {
            // Estimate tokens in the text
            $estimatedTokens = $this->estimateTokenCount($text);
            
            if ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST) {
                // Split text and process in chunks
                return $this->processLargeTextForFlashcards($text, $numCards);
            }

            $prompt = "You are a specialized flashcard creation AI. Your task is to create educational flashcards from the provided text.\n\n" .
                     "RESPONSE FORMAT:\n" .
                     "You must respond with ONLY a JSON array of flashcard objects. Each object must have exactly two fields:\n" .
                     "1. \"question\": A clear, focused question\n" .
                     "2. \"answer\": A concise but complete answer\n\n" .
                     "Example of EXACT format required:\n" .
                     "[\n" .
                     "  {\n" .
                     "    \"question\": \"What is photosynthesis?\",\n" .
                     "    \"answer\": \"The process by which plants convert sunlight into energy, producing oxygen as a byproduct\"\n" .
                     "  }\n" .
                     "]\n\n" .
                     "IMPORTANT RULES:\n" .
                     "1. Create exactly {$numCards} high-quality flashcards\n" .
                     "2. Keep the same language as the input text\n" .
                     "3. Focus on key concepts, definitions, and relationships\n" .
                     "4. Make questions specific and unambiguous\n" .
                     "5. Keep answers clear and comprehensive\n" .
                     "6. DO NOT include any extra fields (no 'type', 'category', etc.)\n" .
                     "7. DO NOT include any explanatory text outside the JSON array\n" .
                     "8. Ensure the response is valid JSON that can be parsed\n\n" .
                     "TEXT TO PROCESS:\n\n" . $text;

            try {
                $response = $this->makeFlashcardsRequest($prompt);
                $flashcards = json_decode($response, true);
                
                if (json_last_error() !== JSON_ERROR_NONE || !is_array($flashcards)) {
                    Log::error('Invalid JSON response from AI service for flashcards: ' . $response);
                    throw new \Exception('Failed to decode flashcards response as JSON');
                }
                
                // Validate and clean each flashcard
                $validFlashcards = array_filter(array_map(function($card) {
                    if (!isset($card['question'], $card['answer'])) {
                        return null;
                    }
                    return [
                        'question' => trim($card['question']),
                        'answer' => trim($card['answer'])
                    ];
                }, $flashcards));
                
                if (empty($validFlashcards)) {
                    throw new \Exception('No valid flashcards found in response');
                }
                
                // Limit to requested number of flashcards
                $validFlashcards = array_slice(array_values($validFlashcards), 0, $numCards);
                
                return [
                    'success' => true,
                    'flashcards' => $validFlashcards
                ];
                
            } catch (\Exception $e) {
                Log::error('Failed to generate flashcards: ' . $e->getMessage());
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Failed in generateFlashcards: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'flashcards' => []
            ];
        }
    }

    /**
     * Clean and parse JSON response from Gemini API
     */
    private function cleanAndParseGeminiResponse(string $text): array
    {
        // Log the original text
        Log::debug('Cleaning Gemini response:', ['original' => $text]);
        
        // 1. Remove markdown code blocks
        $text = preg_replace('/```json\s*/', '', $text);
        $text = preg_replace('/```\s*$/', '', $text);
        
        // 2. If the text is wrapped in a JSON object with a "text" field, extract just the array
        $possibleWrapper = json_decode($text, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($possibleWrapper) && isset($possibleWrapper['text'])) {
            $text = $possibleWrapper['text'];
            // Clean up again in case the inner content has markdown
            $text = preg_replace('/```json\s*/', '', $text);
            $text = preg_replace('/```\s*$/', '', $text);
        }
        
        // 3. Trim any whitespace
        $text = trim($text);
        
        // Log the cleaned text
        Log::debug('Cleaned text before parsing:', ['text' => $text]);
        
        // Try to parse the cleaned text as JSON
        $decodedText = json_decode($text, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Failed to decode cleaned API response as JSON: ' . json_last_error_msg());
            Log::error('Cleaned text that failed to decode:', ['text' => $text]);
            throw new \Exception('Invalid JSON response from Gemini API after cleaning');
        }
        
        // Validate that we got an array
        if (!is_array($decodedText)) {
            throw new \Exception('Expected JSON array but got ' . gettype($decodedText));
        }
        
        return $decodedText;
    }

    private function makeFlashcardsRequest(string $prompt): string
    {
        try {
            $response = $this->client->post($this->endpoint . '?key=' . $this->apiKey, [
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'text' => $prompt
                                ]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 4096,
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $body = json_decode($response->getBody()->getContents(), true);
            
            // Log the raw response for debugging
            Log::debug('Gemini API raw response:', ['response' => $body]);

            if ($response->getStatusCode() !== 200 || empty($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API error for flashcards: ' . json_encode($body));
                throw new \Exception('Failed to get valid response from Gemini API: ' . json_encode($body));
            }

            $text = $body['candidates'][0]['content']['parts'][0]['text'];
            
            // Clean and parse the response
            $cleanedArray = $this->cleanAndParseGeminiResponse($text);
            
            // Re-encode to ensure valid JSON
            return json_encode($cleanedArray);
            
        } catch (\Exception $e) {
            Log::error('Flashcards request failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process large text for flashcard generation by splitting it into chunks
     */
    private function processLargeTextForFlashcards(string $text, int $numCards): array
    {
        try {
            // Calculate chunk size based on token limit
            $maxCharsPerChunk = (self::MAX_TOKENS_PER_REQUEST / self::ESTIMATED_TOKENS_PER_CHAR);
            $chunks = $this->splitTextIntoChunks($text, (int)$maxCharsPerChunk);
            
            $allFlashcards = [];
            // Calculate how many cards to generate per chunk
            $cardsPerChunk = ceil($numCards / count($chunks));
            
            foreach ($chunks as $index => $chunk) {
                try {
                    $prompt = "You are a specialized flashcard creation AI. Your task is to create educational flashcards from this section of text (part " . ($index + 1) . ").\n\n" .
                             "RESPONSE FORMAT:\n" .
                             "You must respond with ONLY a JSON array of flashcards. Each flashcard must have exactly two fields:\n" .
                             "1. \"question\": A clear, focused question\n" .
                             "2. \"answer\": A concise but complete answer\n\n" .
                             "Example of EXACT format required:\n" .
                             "[\n" .
                             "  {\n" .
                             "    \"question\": \"What is photosynthesis?\",\n" .
                             "    \"answer\": \"The process by which plants convert sunlight into energy, producing oxygen as a byproduct\"\n" .
                             "  }\n" .
                             "]\n\n" .
                             "IMPORTANT RULES:\n" .
                             "1. Create exactly {$cardsPerChunk} high-quality flashcards from this section\n" .
                             "2. Keep the same language as the input text\n" .
                             "3. Focus on key concepts from this specific section\n" .
                             "4. Make questions specific and unambiguous\n" .
                             "5. Keep answers clear and comprehensive\n" .
                             "6. DO NOT include any extra fields (no 'type', 'category', etc.)\n" .
                             "7. DO NOT include any explanatory text outside the JSON array\n" .
                             "8. DO NOT use markdown code blocks (no ```json)\n" .
                             "9. Ensure the response is valid JSON that can be parsed\n\n" .
                             "TEXT SECTION TO PROCESS:\n\n" . $chunk;
                    
                    $response = $this->makeFlashcardsRequest($prompt);
                    
                    // Parse the response using our helper method
                    try {
                        $chunkFlashcards = $this->cleanAndParseGeminiResponse($response);
                        
                        // Validate and clean each flashcard
                        $validChunkFlashcards = array_filter(array_map(function($card) {
                            if (!isset($card['question'], $card['answer'])) {
                                return null;
                            }
                            return [
                                'question' => trim($card['question']),
                                'answer' => trim($card['answer'])
                            ];
                        }, $chunkFlashcards));
                        
                        $allFlashcards = array_merge($allFlashcards, array_values($validChunkFlashcards));
                    } catch (\Exception $e) {
                        Log::warning('Failed to process chunk ' . ($index + 1) . ': ' . $e->getMessage());
                        continue;
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to process text chunk ' . ($index + 1) . ' for flashcards: ' . $e->getMessage());
                    continue;
                }
            }

            if (empty($allFlashcards)) {
                throw new \Exception('Failed to generate any valid flashcards from the text chunks');
            }

            // Remove duplicates and similar flashcards
            $uniqueFlashcards = $this->removeDuplicateFlashcards($allFlashcards);
            
            if (empty($uniqueFlashcards)) {
                throw new \Exception('No unique flashcards remained after deduplication');
            }
            
            // Limit to requested number of flashcards
            $uniqueFlashcards = array_slice($uniqueFlashcards, 0, $numCards);
            
            return [
                'success' => true,
                'flashcards' => $uniqueFlashcards
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed in processLargeTextForFlashcards: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'flashcards' => []
            ];
        }
    }

    /**
     * Remove duplicate and similar flashcards
     */
    private function removeDuplicateFlashcards(array $flashcards): array
    {
        $seen = [];
        $unique = [];
        
        foreach ($flashcards as $card) {
            // Skip invalid cards
            if (!isset($card['question'], $card['answer'])) {
                continue;
            }
            
            // Create a simple hash of the question to detect duplicates
            $questionHash = md5(strtolower(trim($card['question'])));
            
            // If we haven't seen this question before, add it to the unique list
            if (!isset($seen[$questionHash])) {
                $seen[$questionHash] = true;
                $unique[] = [
                    'question' => trim($card['question']),
                    'answer' => trim($card['answer'])
                ];
            }
        }
        
        return $unique;
    }


    /**
     * Split text into chunks while preserving paragraph integrity and document structure
     */
    private function splitTextIntoChunks(string $text, int $maxChunkSize): array
    {
        $chunks = [];
        
        // Split into sections based on headers or major breaks
        $sections = preg_split('/(?=\n[A-Z][^\n]+\n={2,}|\n#{1,6}\s|(?:\r?\n){3,})/', $text);
        
        $currentChunk = '';
        $currentSize = 0;
        
        foreach ($sections as $section) {
            $sectionSize = strlen($section);
            
            // If section alone exceeds max size, split it further
            if ($sectionSize > $maxChunkSize) {
                // If we have accumulated content, save it as a chunk
                if (!empty($currentChunk)) {
                    $chunks[] = trim($currentChunk);
                    $currentChunk = '';
                    $currentSize = 0;
                }
                
                // Split large section into paragraphs
                $paragraphs = preg_split('/\n\n+/', $section);
                
                foreach ($paragraphs as $paragraph) {
                    $paragraphSize = strlen($paragraph);
                    
                    // If single paragraph is too large, split by sentences
                    if ($paragraphSize > $maxChunkSize) {
                        $sentences = preg_split('/(?<=[.!?])\s+/', $paragraph);
                        
                        foreach ($sentences as $sentence) {
                            if (strlen($currentChunk) + strlen($sentence) > $maxChunkSize && !empty($currentChunk)) {
                                $chunks[] = trim($currentChunk);
                                $currentChunk = '';
                                $currentSize = 0;
                            }
                            $currentChunk .= $sentence . ' ';
                            $currentSize += strlen($sentence) + 1;
                        }
                    } else {
                        // Handle normal paragraphs
                        if ($currentSize + $paragraphSize > $maxChunkSize && !empty($currentChunk)) {
                            $chunks[] = trim($currentChunk);
                            $currentChunk = '';
                            $currentSize = 0;
                        }
                        $currentChunk .= $paragraph . "\n\n";
                        $currentSize += $paragraphSize + 2;
                    }
                }
            } else {
                // Handle normal sections
                if ($currentSize + $sectionSize > $maxChunkSize && !empty($currentChunk)) {
                    $chunks[] = trim($currentChunk);
                    $currentChunk = '';
                    $currentSize = 0;
                }
                $currentChunk .= $section;
                $currentSize += $sectionSize;
            }
        }
        
        // Add any remaining content
        if (!empty($currentChunk)) {
            $chunks[] = trim($currentChunk);
        }
        
        // Ensure no empty chunks
        return array_filter($chunks, function($chunk) {
            return !empty(trim($chunk));
        });
    }

    /**
     * Estimate token count based on text length
     */
    private function estimateTokenCount(string $text): int
    {
        // Count words (more accurate than character count)
        $wordCount = str_word_count($text);
        
        // Average of 1.3 tokens per word (conservative estimate)
        $estimatedTokens = (int)($wordCount * 1.3);
        
        // Also consider character-based estimate as a fallback
        $charBasedEstimate = (int)(strlen($text) * self::ESTIMATED_TOKENS_PER_CHAR);
        
        // Use the larger estimate to be safe
        return max($estimatedTokens, $charBasedEstimate);
    }
} 