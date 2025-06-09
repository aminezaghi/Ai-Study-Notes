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
     * Generate flashcards from text
     */
    public function generateFlashcards(string $text): array
    {
        try {
            // Estimate tokens in the text
            $estimatedTokens = $this->estimateTokenCount($text);
            
            if ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST) {
                // Split text and process in chunks
                return $this->processLargeTextForFlashcards($text);
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
                     "1. Create 10-15 high-quality flashcards\n" .
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
                
                return [
                    'success' => true,
                    'flashcards' => array_values($validFlashcards)
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
    private function processLargeTextForFlashcards(string $text): array
    {
        try {
            // Calculate chunk size based on token limit
            $maxCharsPerChunk = (self::MAX_TOKENS_PER_REQUEST / self::ESTIMATED_TOKENS_PER_CHAR);
            $chunks = $this->splitTextIntoChunks($text, (int)$maxCharsPerChunk);
            
            $allFlashcards = [];
            
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
                             "1. Create 5-7 high-quality flashcards from this section\n" .
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
     * Process large text by splitting it into chunks
     */
    private function processLargeText(string $text): array
    {
        try {
            // Calculate chunk size based on token limit
            $maxCharsPerChunk = (self::MAX_TOKENS_PER_REQUEST / self::ESTIMATED_TOKENS_PER_CHAR);
            $chunks = $this->splitTextIntoChunks($text, (int)$maxCharsPerChunk);
            
            $summaries = [];
            $contents = [];
            
            foreach ($chunks as $chunk) {
                try {
                    $prompt = "You are an expert study notes generator. " .
                             "First, detect the language of the provided text. " .
                             "Analyze this section of text thoroughly and provide detailed key points and summary IN THE SAME LANGUAGE as the input text. " .
                             "Focus on extracting:\n" .
                             "- Specific facts, figures, and data\n" .
                             "- Technical terms and their definitions\n" .
                             "- Detailed examples and case studies\n" .
                             "- Complex relationships between concepts\n" .
                             "Do not use markdown or code blocks in your response. " .
                             "Make sure your entire response is in the SAME LANGUAGE as the input text. " .
                             "Don't oversimplify - maintain the level of detail needed for effective flashcards and quizzes.\n\n" . $chunk;
                    
                    $response = $this->makeRequest($prompt);
                    $result = json_decode($response, true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && is_array($result)) {
                        $summaries[] = $result['summary'] ?? '';
                        $contents[] = $result['content'] ?? '';
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to process text chunk: ' . $e->getMessage());
                    continue;
                }
            }

            // If no chunks were processed successfully
            if (empty($summaries) && empty($contents)) {
                return [
                    'summary' => 'Error processing text',
                    'content' => 'Failed to process the document. Please try again.'
                ];
            }

            // Combine the chunks into a final summary
            $finalPrompt = "Create a unified, detailed set of study notes from these sections. " .
                          "Make sure to maintain the SAME LANGUAGE as the original text throughout. " .
                          "Combine them logically and remove any redundancy, but preserve ALL important details. " .
                          "Focus on maintaining the depth and specificity of the information. " .
                          "The notes should be detailed enough to generate accurate flashcards and quiz questions. " .
                          "Do not use markdown or code blocks in your response. " .
                          "Ensure your entire response is in the SAME LANGUAGE as the original text.\n\n" .
                          "Summaries:\n" . implode("\n\n", $summaries) . "\n\n" .
                          "Contents:\n" . implode("\n\n", $contents);

            $finalResponse = $this->makeRequest($finalPrompt);
            $finalResult = json_decode($finalResponse, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($finalResult)) {
                return [
                    'summary' => trim($finalResult['summary']),
                    'content' => trim($finalResult['content'])
                ];
            }
            
            // Fallback if final combination fails
            return [
                'summary' => implode("\n\n", $summaries),
                'content' => implode("\n\n", $contents)
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed in processLargeText: ' . $e->getMessage());
            throw $e;
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

    /**
     * Generate quiz questions from text
     */
    public function generateQuizQuestions(string $text): array
    {
        // Implementation similar to generateStudyNote with chunking if needed
        // ...
    }
} 