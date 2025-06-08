<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class AIService
{
    private string $apiKey;
    private string $endpoint;
    private Client $client;
    private const MAX_TOKENS_PER_REQUEST = 30000; // Conservative limit for safety
    private const ESTIMATED_TOKENS_PER_CHAR = 0.33; // Rough estimate of tokens per character

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        $this->client = new Client([
            'timeout' => 60, // Increased timeout for larger requests
            'http_errors' => false
        ]);
    }

    /**
     * Generate a study note from text
     */
    public function generateStudyNote(string $text): array
    {
        // Estimate tokens in the text
        $estimatedTokens = $this->estimateTokenCount($text);
        
        if ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST) {
            // Split text and process in chunks
            return $this->processLargeText($text);
        }

        $prompt = "Generate comprehensive study notes from the following text. Include:\n" .
                 "1. A concise summary (2-3 paragraphs)\n" .
                 "2. Key concepts and definitions\n" .
                 "3. Important points in bullet form\n" .
                 "4. Examples or applications where relevant\n\n" .
                 "Format the response as a JSON object with 'summary' and 'content' fields.\n\n" .
                 "Text to analyze:\n" . $text;

        try {
            $response = $this->makeRequest($prompt);
            return json_decode($response, true);
        } catch (\Exception $e) {
            Log::error('Failed to generate study note: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process large text by splitting it into chunks
     */
    private function processLargeText(string $text): array
    {
        try {
            // Calculate chunk size based on token limit
            $maxCharsPerChunk = (self::MAX_TOKENS_PER_REQUEST / self::ESTIMATED_TOKENS_PER_CHAR);
            $chunks = $this->splitTextIntoChunks($text, (int)$maxCharsPerChunk);
            
            $chunkResults = [];
            foreach ($chunks as $chunk) {
                try {
                    $prompt = "Generate a summary and key points from this text chunk. Format as JSON with 'summary' and 'content' fields:\n\n" . $chunk;
                    $response = $this->makeRequest($prompt);
                    $result = json_decode($response, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($result)) {
                        $chunkResults[] = $result;
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to process text chunk: ' . $e->getMessage());
                    continue;
                }
            }

            // If no chunks were processed successfully, return a default response
            if (empty($chunkResults)) {
                return [
                    'summary' => 'Error processing text',
                    'content' => 'Failed to process any text chunks successfully.'
                ];
            }

            // Create a combined summary prompt
            $combinedSummaries = array_map(function ($result) {
                return $result['summary'] ?? '';
            }, $chunkResults);

            $finalSummaryPrompt = "Create a unified summary from these separate summaries. Format as JSON with 'summary' and 'content' fields:\n\n" . 
                                implode("\n\n", $combinedSummaries);

            try {
                $finalResponse = $this->makeRequest($finalSummaryPrompt);
                $finalResult = json_decode($finalResponse, true);
                
                if (json_last_error() === JSON_ERROR_NONE && is_array($finalResult)) {
                    return $finalResult;
                }
                
                // If final response isn't valid JSON, return a formatted version of the chunks
                return [
                    'summary' => 'Combined Summary',
                    'content' => implode("\n\n", array_map(function ($result) {
                        return $result['content'] ?? '';
                    }, $chunkResults))
                ];
            } catch (\Exception $e) {
                Log::error('Failed to generate final summary: ' . $e->getMessage());
                // Return the first chunk's result if final summary fails
                return $chunkResults[0] ?? [
                    'summary' => 'Error in final processing',
                    'content' => 'Failed to generate final summary.'
                ];
            }
        } catch (\Exception $e) {
            Log::error('Failed in processLargeText: ' . $e->getMessage());
            return [
                'summary' => 'Processing Error',
                'content' => 'An error occurred while processing the text: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Split text into chunks while preserving paragraph integrity
     */
    private function splitTextIntoChunks(string $text, int $maxChunkSize): array
    {
        $chunks = [];
        $paragraphs = explode("\n\n", $text);
        $currentChunk = '';

        foreach ($paragraphs as $paragraph) {
            if (strlen($currentChunk) + strlen($paragraph) > $maxChunkSize && !empty($currentChunk)) {
                $chunks[] = $currentChunk;
                $currentChunk = '';
            }
            $currentChunk .= (empty($currentChunk) ? '' : "\n\n") . $paragraph;
        }

        if (!empty($currentChunk)) {
            $chunks[] = $currentChunk;
        }

        return $chunks;
    }

    /**
     * Estimate token count based on text length
     */
    private function estimateTokenCount(string $text): int
    {
        return (int)(strlen($text) * self::ESTIMATED_TOKENS_PER_CHAR);
    }

    /**
     * Make a request to the Gemini API
     */
    private function makeRequest(string $prompt): string
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
                        'maxOutputTokens' => 2048,
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            if ($response->getStatusCode() !== 200 || empty($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API error: ' . json_encode($body));
                // Return a valid JSON string with error information
                return json_encode([
                    'summary' => 'Error generating content',
                    'content' => 'Failed to process text due to API error: ' . ($body['error']['message'] ?? 'Unknown error')
                ]);
            }

            // Ensure the response is a valid JSON string
            $text = $body['candidates'][0]['content']['parts'][0]['text'];
            $decoded = json_decode($text, true);
            
            // If the API didn't return valid JSON, wrap it in our expected format
            if (json_last_error() !== JSON_ERROR_NONE) {
                return json_encode([
                    'summary' => 'Generated Content',
                    'content' => $text
                ]);
            }

            return $text;
        } catch (\Exception $e) {
            Log::error('Request failed: ' . $e->getMessage());
            // Return a valid JSON string even in case of exception
            return json_encode([
                'summary' => 'Error processing request',
                'content' => 'An error occurred while processing the text: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generate flashcards from text
     */
    public function generateFlashcards(string $text): array
    {
        // Implementation similar to generateStudyNote with chunking if needed
        // ...
    }

    /**
     * Generate quiz questions from text
     */
    public function generateQuizQuestions(string $text): array
    {
        // Implementation similar to generateStudyNote with chunking if needed
        // ...
    }
} 