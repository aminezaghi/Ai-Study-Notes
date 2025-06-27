<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class QuizService
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
     * Generate quiz questions from text
     */
    public function generateQuizQuestions(string $text, string $type, int $numQuestions): array
    {
        try {
            // Estimate tokens in the text
            $estimatedTokens = $this->estimateTokenCount($text);
            
            if ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST) {
                // Split text and process in chunks
                return $this->processLargeTextForQuiz($text, $type, $numQuestions);
            }

            $prompt = $this->getQuizPrompt($text, $type, $numQuestions);
            
            $response = $this->makeQuizRequest($prompt);
            $questions = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($questions)) {
                Log::error('Invalid JSON response from AI service for quiz: ' . $response);
                throw new \Exception('Failed to decode quiz response as JSON');
            }
            
            // Validate and clean each question
            $validQuestions = array_filter(array_map(function($q) use ($type) {
                if (!isset($q['question'], $q['correct_answer'])) {
                    return null;
                }
                
                $question = [
                    'question' => trim($q['question']),
                    'type' => $type,
                    'correct_answer' => trim($q['correct_answer']),
                    'explanation' => trim($q['explanation'] ?? ''),
                ];

                // Validate true/false answers
                if ($type === 'true_false') {
                    $answer = strtolower(trim($question['correct_answer']));
                    if ($answer !== 'true' && $answer !== 'false') {
                        Log::warning('Invalid true/false answer format: ' . $answer);
                        return null;
                    }
                    $question['correct_answer'] = $answer;
                }
                
                // Validate fill-in-the-blanks questions
                if ($type === 'fill_in_blanks') {
                    // Check if question contains exactly one blank
                    if (substr_count($question['question'], '_____') !== 1) {
                        Log::warning('Fill-in-the-blanks question does not contain exactly one blank: ' . $question['question']);
                        return null;
                    }
                    
                    // Check if blank is not at the start or end
                    if (str_starts_with($question['question'], '_____') || str_ends_with($question['question'], '_____')) {
                        Log::warning('Fill-in-the-blanks question has blank at start or end: ' . $question['question']);
                        return null;
                    }
                    
                    // Check if answer is not too long
                    if (str_word_count($question['correct_answer']) > 5) {
                        Log::warning('Fill-in-the-blanks answer is too long: ' . $question['correct_answer']);
                        return null;
                    }
                }
                
                // Add options for multiple choice questions
                if ($type === 'multiple_choice') {
                    if (!isset($q['options']) || !is_array($q['options'])) {
                        return null;
                    }
                    $question['options'] = array_map('trim', $q['options']);
                }
                
                return $question;
            }, $questions));
            
            if (empty($validQuestions)) {
                throw new \Exception('No valid quiz questions found in response');
            }
            
            return [
                'success' => true,
                'questions' => array_values($validQuestions)
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed in generateQuizQuestions: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'questions' => []
            ];
        }
    }

    /**
     * Process large text for quiz generation by splitting it into chunks
     */
    private function processLargeTextForQuiz(string $text, string $type, int $numQuestions): array
    {
        try {
            // Calculate chunk size based on token limit
            $maxCharsPerChunk = (self::MAX_TOKENS_PER_REQUEST / self::ESTIMATED_TOKENS_PER_CHAR);
            $chunks = $this->splitTextIntoChunks($text, (int)$maxCharsPerChunk);
            
            $allQuestions = [];
            $questionsPerChunk = ceil($numQuestions / count($chunks));
            
            foreach ($chunks as $index => $chunk) {
                try {
                    $prompt = $this->getQuizPrompt($chunk, $type, $questionsPerChunk);
                    $response = $this->makeQuizRequest($prompt);
                    
                    try {
                        $chunkQuestions = $this->cleanAndParseGeminiResponse($response);
                        
                        // Validate and clean each question
                        $validChunkQuestions = array_filter(array_map(function($q) use ($type) {
                            if (!isset($q['question'], $q['correct_answer'])) {
                                return null;
                            }
                            
                            $question = [
                                'question' => trim($q['question']),
                                'type' => $type,
                                'correct_answer' => trim($q['correct_answer']),
                                'explanation' => trim($q['explanation'] ?? ''),
                            ];
                            
                            if ($type === 'multiple_choice') {
                                if (!isset($q['options']) || !is_array($q['options'])) {
                                    return null;
                                }
                                $question['options'] = array_map('trim', $q['options']);
                            }
                            
                            return $question;
                        }, $chunkQuestions));
                        
                        $allQuestions = array_merge($allQuestions, array_values($validChunkQuestions));
                    } catch (\Exception $e) {
                        Log::warning('Failed to process chunk ' . ($index + 1) . ': ' . $e->getMessage());
                        continue;
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to process text chunk ' . ($index + 1) . ' for quiz: ' . $e->getMessage());
                    continue;
                }
            }

            if (empty($allQuestions)) {
                throw new \Exception('Failed to generate any valid quiz questions from the text chunks');
            }

            // Remove duplicates and similar questions
            $uniqueQuestions = $this->removeDuplicateQuestions($allQuestions);
            
            // Limit to requested number of questions
            $uniqueQuestions = array_slice($uniqueQuestions, 0, $numQuestions);
            
            if (empty($uniqueQuestions)) {
                throw new \Exception('No unique quiz questions remained after deduplication');
            }
            
            return [
                'success' => true,
                'questions' => $uniqueQuestions
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed in processLargeTextForQuiz: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'questions' => []
            ];
        }
    }

    /**
     * Get the appropriate prompt for quiz generation based on question type
     */
    private function getQuizPrompt(string $text, string $type, int $numQuestions): string
    {
        $basePrompt = "You are a specialized quiz generator AI. Your task is to create educational quiz questions from the provided text.\n\n" .
                     "RESPONSE FORMAT:\n" .
                     "You must respond with ONLY a JSON array of question objects. Each object must have these fields:\n" .
                     "1. \"question\": A clear, focused question\n" .
                     "2. \"correct_answer\": The correct answer\n" .
                     "3. \"explanation\": A brief explanation of why this is the correct answer\n";

        switch ($type) {
            case 'multiple_choice':
                $basePrompt .= "4. \"options\": An array of 4 possible answers (including the correct one)\n\n" .
                              "Example format:\n" .
                              "[\n" .
                              "  {\n" .
                              "    \"question\": \"What is the capital of France?\",\n" .
                              "    \"options\": [\"Paris\", \"London\", \"Berlin\", \"Madrid\"],\n" .
                              "    \"correct_answer\": \"Paris\",\n" .
                              "    \"explanation\": \"Paris has been the capital of France since 508 CE.\"\n" .
                              "  }\n" .
                              "]\n\n";
                break;
                
            case 'true_false':
                $basePrompt .= "\nIMPORTANT RULES FOR TRUE/FALSE QUESTIONS:\n" .
                              "1. The question MUST be a statement that can be clearly true or false\n" .
                              "2. The correct_answer MUST be EXACTLY either \"true\" or \"false\" (lowercase)\n" .
                              "3. Make statements clear and unambiguous\n" .
                              "4. Avoid using absolute words like 'always', 'never', 'all', 'none'\n\n" .
                              "Example format:\n" .
                              "[\n" .
                              "  {\n" .
                              "    \"question\": \"The Earth orbits around the Sun.\",\n" .
                              "    \"correct_answer\": \"true\",\n" .
                              "    \"explanation\": \"The Earth follows an elliptical orbit around the Sun, completing one revolution every 365.25 days.\"\n" .
                              "  },\n" .
                              "  {\n" .
                              "    \"question\": \"The Moon is larger than the Earth.\",\n" .
                              "    \"correct_answer\": \"false\",\n" .
                              "    \"explanation\": \"The Moon is about one-quarter the size of Earth in diameter.\"\n" .
                              "  }\n" .
                              "]\n\n";
                break;
                
            case 'fill_in_blanks':
                $basePrompt .= "\nIMPORTANT RULES FOR FILL-IN-THE-BLANKS QUESTIONS:\n" .
                              "1. The question MUST be a complete sentence with _____ (5 underscores) where the blank should be\n" .
                              "2. Use exactly ONE blank per question\n" .
                              "3. The correct_answer should be a single word or short phrase that fits in the blank\n" .
                              "4. The answer should be obvious when looking at the original text\n" .
                              "5. The blank should not be at the beginning or end of the sentence\n\n" .
                              "Example format:\n" .
                              "[\n" .
                              "  {\n" .
                              "    \"question\": \"The process of converting sunlight into chemical energy in plants is called _____.\",\n" .
                              "    \"correct_answer\": \"photosynthesis\",\n" .
                              "    \"explanation\": \"Photosynthesis is the biological process that allows plants to create energy from sunlight.\"\n" .
                              "  },\n" .
                              "  {\n" .
                              "    \"question\": \"Water consists of two _____ atoms bonded to one oxygen atom.\",\n" .
                              "    \"correct_answer\": \"hydrogen\",\n" .
                              "    \"explanation\": \"The chemical formula for water is H2O, where H represents hydrogen and O represents oxygen.\"\n" .
                              "  }\n" .
                              "]\n\n";
                break;
        }

        $basePrompt .= "IMPORTANT RULES:\n" .
                      "1. Create exactly {$numQuestions} high-quality questions\n" .
                      "2. Keep the same language as the input text\n" .
                      "3. Focus on key concepts and important details\n" .
                      "4. Make questions clear and unambiguous\n" .
                      "5. Ensure all answers are factually correct\n" .
                      "6. Include helpful explanations\n" .
                      "7. DO NOT include any explanatory text outside the JSON array\n" .
                      "8. Ensure the response is valid JSON\n\n" .
                      "TEXT TO PROCESS:\n\n" . $text;

        return $basePrompt;
    }

    /**
     * Make a request to the AI service specifically for quiz generation
     */
    private function makeQuizRequest(string $prompt): string
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
            
            Log::debug('Gemini API raw response for quiz:', ['response' => $body]);

            if ($response->getStatusCode() !== 200 || empty($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API error for quiz: ' . json_encode($body));
                throw new \Exception('Failed to get valid response from Gemini API: ' . json_encode($body));
            }

            $text = $body['candidates'][0]['content']['parts'][0]['text'];
            
            // Clean and parse the response
            $cleanedArray = $this->cleanAndParseGeminiResponse($text);
            
            // Re-encode to ensure valid JSON
            return json_encode($cleanedArray);
            
        } catch (\Exception $e) {
            Log::error('Quiz request failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Remove duplicate and similar quiz questions
     */
    private function removeDuplicateQuestions(array $questions): array
    {
        $seen = [];
        $unique = [];
        
        foreach ($questions as $q) {
            // Skip invalid questions
            if (!isset($q['question'], $q['correct_answer'])) {
                continue;
            }
            
            // Create a simple hash of the question to detect duplicates
            $questionHash = md5(strtolower(trim($q['question'])));
            
            // If we haven't seen this question before, add it to the unique list
            if (!isset($seen[$questionHash])) {
                $seen[$questionHash] = true;
                $unique[] = $q;
            }
        }
        
        return $unique;
    }
} 