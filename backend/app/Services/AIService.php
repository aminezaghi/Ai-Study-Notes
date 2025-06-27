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

        $prompt = "You are an expert study notes generator with deep analytical capabilities. " .
                 "First, detect the language of the provided text and ensure all your responses are in that SAME language. " .
                 "Your task is to perform a thorough, detailed analysis of the following text and create comprehensive study notes. " .
                 "Be as specific and detailed as possible, including:\n" .
                 "- Technical terms and their precise definitions\n" .
                 "- Numerical data and statistics when present\n" .
                 "- Specific examples and case studies mentioned\n" .
                 "- Relationships between different concepts\n" .
                 "- Underlying principles and theories\n" .
                 "- Practical applications and real-world implications\n\n" .
                 "Focus on extracting and organizing ALL key information in a clear, structured way. " .
                 "Don't summarize too broadly - maintain the specific details that would be important for flashcards and quizzes. " .
                 "Your response must follow this exact format (do not include any markdown or code blocks):\n\n" .
                 "{\n" .
                 "  \"summary\": \"Write 3-4 detailed paragraphs summarizing the main concepts and key takeaways IN THE SAME LANGUAGE as the input text. " .
                 "Include specific details, numbers, and examples from the text. Don't oversimplify.\",\n" .
                 "  \"content\": \"Structure your notes as follows (IN THE SAME LANGUAGE as the input text):\n" .
                 "Key Concepts and Terminology:\n" .
                 "- List and explain each important concept in detail\n" .
                 "- Provide precise definitions for all technical terms\n" .
                 "- Explain the significance of each concept\n\n" .
                 "Detailed Main Points:\n" .
                 "- Use bullet points for important information\n" .
                 "- Include ALL relevant details, data, and statistics\n" .
                 "- Explain relationships between different points\n" .
                 "- Note any cause-and-effect relationships\n\n" .
                 "Specific Examples & Case Studies:\n" .
                 "- List all examples mentioned in the text\n" .
                 "- Provide detailed context for each example\n" .
                 "- Explain how each example illustrates the concepts\n\n" .
                 "Practical Applications:\n" .
                 "- Detail how concepts are applied in practice\n" .
                 "- Include real-world scenarios and implementations\n" .
                 "- Note any limitations or considerations\n\n" .
                 "Additional Analysis:\n" .
                 "- Identify patterns and themes\n" .
                 "- Note any controversies or debates\n" .
                 "- Include relevant formulas or methodologies\n" .
                 "- Add study tips or connections to other topics\n\n" .
                 "Potential Quiz/Test Topics:\n" .
                 "- Identify key areas that would make good test questions\n" .
                 "- Note important facts that should be memorized\n" .
                 "- Highlight complex relationships that require understanding\"\n" .
                 "}\n\n" .
                 "IMPORTANT:\n" .
                 "1. Make sure both the summary and content are in the SAME LANGUAGE as the input text\n" .
                 "2. Be as detailed and specific as possible - don't oversimplify\n" .
                 "3. Include ALL relevant information that could be used for flashcards and quizzes\n" .
                 "4. Maintain technical accuracy and precision\n\n" .
                 "Here is the text to analyze:\n\n" . $text;

        try {
            $response = $this->makeRequest($prompt);
            $result = json_decode($response, true);
            
            // Validate and clean up the response
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($result) || !isset($result['summary'], $result['content'])) {
                Log::warning('Invalid JSON response from AI service: ' . $response);
                return [
                    'summary' => 'Error: Could not generate proper summary',
                    'content' => 'Error: Could not generate proper study notes. Please try again.'
                ];
            }
            
            return [
                'summary' => trim($result['summary']),
                'content' => trim($result['content'])
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate study note: ' . $e->getMessage());
            throw $e;
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


    /**
     * Process large text by splitting into chunks and combining results
     */
    private function processLargeText(string $text): array
    {
        try {
            // Split text into manageable chunks
            $chunks = $this->splitTextIntoChunks($text, floor(self::MAX_TOKENS_PER_REQUEST / self::ESTIMATED_TOKENS_PER_CHAR));
            
            $combinedSummary = '';
            $combinedContent = '';
            $chunkResults = [];
            
            // Process each chunk
            foreach ($chunks as $index => $chunk) {
                try {
                    Log::info("Processing chunk " . ($index + 1) . " of " . count($chunks));
                    
                    // Add context about this being part of a larger document
                    $contextPrefix = "This is part " . ($index + 1) . " of " . count($chunks) . " of a larger document. ";
                    $response = $this->makeRequest($contextPrefix . $chunk);
                    
                    // Parse response
                    $result = json_decode($response, true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && is_array($result)) {
                        $chunkResults[] = $result;
                    } else {
                        // Try to extract content using string manipulation if JSON parsing fails
                        $result = $this->cleanAndParseGeminiResponse($response);
                        if (!empty($result)) {
                            $chunkResults[] = $result;
                        }
                    }
                    
                    // Add delay between chunks to avoid rate limiting
                    if ($index < count($chunks) - 1) {
                        sleep(1);
                    }
                    
                } catch (\Exception $e) {
                    Log::error("Error processing chunk " . ($index + 1) . ": " . $e->getMessage());
                    continue;
                }
            }
            
            if (empty($chunkResults)) {
                throw new \Exception("Failed to process any chunks successfully");
            }
            
            // Combine results
            foreach ($chunkResults as $result) {
                if (isset($result['summary'])) {
                    $combinedSummary .= $result['summary'] . "\n\n";
                }
                if (isset($result['content'])) {
                    $combinedContent .= $result['content'] . "\n\n";
                }
            }
            
            // Generate a final summary of all chunks
            $finalSummaryPrompt = "Please create a cohesive summary of these combined notes:\n\n" . $combinedSummary;
            $finalSummaryResponse = $this->makeRequest($finalSummaryPrompt);
            $finalSummary = json_decode($finalSummaryResponse, true);
            
            return [
                'summary' => $finalSummary['summary'] ?? trim($combinedSummary),
                'content' => trim($combinedContent)
            ];
            
        } catch (\Exception $e) {
            Log::error("Failed to process large text: " . $e->getMessage());
            throw $e;
        }
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
                        'temperature' => 0.2, // Lower temperature for more focused and precise output
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 8192, // Increased to allow for more detailed responses
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            if ($response->getStatusCode() !== 200 || empty($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API error: ' . json_encode($body));
                return json_encode([
                    'summary' => 'Error generating content',
                    'content' => 'Failed to process text due to API error: ' . ($body['error']['message'] ?? 'Unknown error')
                ]);
            }

            // Get the raw text from the API response
            $text = $body['candidates'][0]['content']['parts'][0]['text'];
            
            // Try to decode it as JSON first
            $decoded = json_decode($text, true);
            
            // If it's already valid JSON with our expected structure, return it
            if (json_last_error() === JSON_ERROR_NONE && 
                is_array($decoded) && 
                isset($decoded['summary']) && 
                isset($decoded['content'])) {
                return $text;
            }
            
            // If it's not valid JSON or doesn't have our structure, format it properly
            return json_encode([
                'summary' => substr($text, 0, 200) . '...', // First 200 chars as summary
                'content' => $text
            ]);
        } catch (\Exception $e) {
            Log::error('API request failed: ' . $e->getMessage());
            return json_encode([
                'summary' => 'Error processing request',
                'content' => 'An error occurred while processing the text: ' . $e->getMessage()
            ]);
        }
    }

} 