<?php

namespace App\Services;

use App\Models\EnhancedStudyNote;
use App\Models\NoteQuestion;
use App\Models\StudyNote;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

class EnhancedStudyNoteService
{
    private string $apiKey;
    private string $endpoint;
    private Client $client;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        
        // Set PHP execution time limit to 5 minutes
        set_time_limit(300);
        
        $this->client = new Client([
            'timeout' => 180, // 3 minutes timeout
            'connect_timeout' => 30,
            'http_errors' => false
        ]);
    }

    /**
     * Generate enhanced study notes from a study note's content
     */
    public function generateEnhancedNotes(StudyNote $studyNote): array
    {
        $prompt = "You are an expert study notes enhancer with deep analytical capabilities. Your task is to take the following study note content " .
                 "and create a comprehensive, detailed enhanced version with extensive key points, thorough definitions, detailed examples, and thought-provoking questions. " .
                 "First, detect the language of the provided text and ensure all your responses are in that SAME language.\n\n" .
                 "CRITICAL: Your response MUST be a SINGLE, VALID JSON object. Do not include any text before or after the JSON. " .
                 "Do not use markdown formatting or code blocks. The JSON object must match the exact structure shown below.\n\n" .
                 "Your response must follow this EXACT structure:\n\n" .
                 "{\n" .
                 "  \"section_title\": \"A clear, concise title that accurately represents the main topic or theme of this content\",\n" .
                 "  \"key_points\": [\n" .
                 "    \"Detailed point 1 with thorough explanation, including context, significance, and implications\",\n" .
                 "    \"Detailed point 2 with thorough explanation, including context, significance, and implications\",\n" .
                 "    \"Detailed point 3 with thorough explanation, including context, significance, and implications\",\n" .
                 "    \"Detailed point 4 with thorough explanation, including context, significance, and implications\"\n" .
                 "  ],\n" .
                 "  \"definitions\": {\n" .
                 "    \"Term 1\": \"Comprehensive definition including context and practical usage\",\n" .
                 "    \"Term 2\": \"Comprehensive definition including context and practical usage\",\n" .
                 "    \"Term 3\": \"Comprehensive definition including context and practical usage\"\n" .
                 "  },\n" .
                 "  \"examples\": [\n" .
                 "    {\n" .
                 "      \"title\": \"Detailed Real-world Example\",\n" .
                 "      \"description\": \"A comprehensive, step-by-step explanation of a practical scenario\"\n" .
                 "    },\n" .
                 "    {\n" .
                 "      \"title\": \"Technical Example\",\n" .
                 "      \"description\": \"A thorough technical example with detailed explanations\"\n" .
                 "    }\n" .
                 "  ],\n" .
                 "  \"questions\": [\n" .
                 "    {\n" .
                 "      \"type\": \"mcq\",\n" .
                 "      \"question\": \"A complex question that tests understanding?\",\n" .
                 "      \"choices\": [\"Choice 1\", \"Choice 2\", \"Choice 3\", \"Choice 4\"],\n" .
                 "      \"correct_answer\": \"Choice 2\"\n" .
                 "    },\n" .
                 "    {\n" .
                 "      \"type\": \"fill\",\n" .
                 "      \"question\": \"Complete this statement: ___\",\n" .
                 "      \"correct_answer\": \"precise answer\"\n" .
                 "    },\n" .
                 "    {\n" .
                 "      \"type\": \"short\",\n" .
                 "      \"question\": \"A question requiring explanation\",\n" .
                 "      \"correct_answer\": \"A concise but complete answer\"\n" .
                 "    }\n" .
                 "  ]\n" .
                 "}\n\n" .
                 "IMPORTANT GUIDELINES:\n" .
                 "1. Generate a clear, descriptive section title that captures the main topic\n" .
                 "2. Generate 4-6 detailed key points\n" .
                 "3. Include 3-5 comprehensive definitions\n" .
                 "4. Provide 2 detailed examples\n" .
                 "5. Create 3 questions (must include MCQ, fill-in-blank, and short answer)\n" .
                 "6. Keep all content in the SAME LANGUAGE as the input text\n" .
                 "7. Make all content clear, accurate, and educational\n" .
                 "8. CRITICAL: Return ONLY the JSON object, no other text\n\n" .
                 "Here is the study note content to enhance:\n\n" . $studyNote->content;

        try {
            $response = $this->makeRequest($prompt);
            $result = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE || !$this->validateResponse($result)) {
                Log::warning('Invalid JSON response from AI service: ' . $response);
                throw new \Exception('Invalid response format from AI service');
            }

            // Create the enhanced study note
            $enhancedNote = EnhancedStudyNote::create([
                'document_id' => $studyNote->document_id,
                'section_title' => $result['section_title'],
                'key_points' => $result['key_points'],
                'definitions' => $result['definitions'],
                'examples' => $result['examples'],
                'order' => 0
            ]);

            // Create the checkpoint questions
            $order = 0;
            foreach ($result['questions'] as $questionData) {
                NoteQuestion::create([
                    'enhanced_note_id' => $enhancedNote->id,
                    'type' => $questionData['type'],
                    'question' => $questionData['question'],
                    'choices' => isset($questionData['choices']) ? $questionData['choices'] : null,
                    'correct_answer' => $questionData['correct_answer'],
                    'order' => $order++
                ]);
            }

            return [
                'enhanced_note' => $enhancedNote->load('questions'),
                'questions' => $enhancedNote->questions
            ];

        } catch (\Exception $e) {
            Log::error('Failed to generate enhanced study note: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Validate the AI response format
     */
    private function validateResponse(array $response): bool
    {
        try {
            // Basic structure validation
            if (!isset($response['section_title']) || !is_string($response['section_title']) ||
                !isset($response['key_points']) || !is_array($response['key_points']) ||
                !isset($response['definitions']) || !is_array($response['definitions']) ||
                !isset($response['examples']) || !is_array($response['examples']) ||
                !isset($response['questions']) || !is_array($response['questions'])) {
                Log::warning('Missing required fields in response', [
                    'has_section_title' => isset($response['section_title']),
                    'has_key_points' => isset($response['key_points']),
                    'has_definitions' => isset($response['definitions']),
                    'has_examples' => isset($response['examples']),
                    'has_questions' => isset($response['questions'])
                ]);
                return false;
            }

            // Content requirements validation
            if (count($response['key_points']) < 4 || count($response['key_points']) > 6 ||
                count($response['definitions']) < 3 || count($response['definitions']) > 5 ||
                count($response['examples']) < 2 || count($response['examples']) > 3 ||
                count($response['questions']) < 3) {
                Log::warning('Invalid content counts in response', [
                    'key_points_count' => count($response['key_points']),
                    'definitions_count' => count($response['definitions']),
                    'examples_count' => count($response['examples']),
                    'questions_count' => count($response['questions'])
                ]);
                return false;
            }

            // Question types validation
            $questionTypes = array_column($response['questions'], 'type');
            if (!in_array('mcq', $questionTypes) || !in_array('fill', $questionTypes)) {
                Log::warning('Missing required question types', [
                    'found_types' => $questionTypes
                ]);
                return false;
            }

            // Examples validation
            foreach ($response['examples'] as $index => $example) {
                if (!isset($example['title']) || !isset($example['description']) ||
                    empty($example['title']) || empty($example['description'])) {
                    Log::warning('Invalid example format', [
                        'example_index' => $index,
                        'has_title' => isset($example['title']),
                        'has_description' => isset($example['description'])
                    ]);
                    return false;
                }
            }

            // Questions validation
            foreach ($response['questions'] as $index => $question) {
                if (!isset($question['type']) || !isset($question['question']) || !isset($question['correct_answer'])) {
                    Log::warning('Invalid question format', [
                        'question_index' => $index,
                        'has_type' => isset($question['type']),
                        'has_question' => isset($question['question']),
                        'has_correct_answer' => isset($question['correct_answer'])
                    ]);
                    return false;
                }
                
                // Validate MCQ choices
                if ($question['type'] === 'mcq' && (!isset($question['choices']) || !is_array($question['choices']) || count($question['choices']) < 2)) {
                    Log::warning('Invalid MCQ choices', [
                        'question_index' => $index,
                        'has_choices' => isset($question['choices']),
                        'choices_count' => isset($question['choices']) ? count($question['choices']) : 0
                    ]);
                    return false;
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Error during response validation', [
                'error' => $e->getMessage(),
                'response' => $response
            ]);
            return false;
        }
    }

    /**
     * Make a request to the Gemini API
     */
    private function makeRequest(string $prompt): string
    {
        $url = $this->endpoint . '?key=' . $this->apiKey;
        
        try {
            $response = $this->client->post($url, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Accept-Charset' => 'utf-8'
                ],
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.3, // Reduced for more consistent formatting
                        'topK' => 20, // Reduced for more focused responses
                        'topP' => 0.9, // Increased for better coherence
                        'maxOutputTokens' => 2048,
                    ]
                ]
            ]);

            $body = json_decode($response->getBody(), true);
            
            if (!isset($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Unexpected Gemini API response format', [
                    'response' => $body,
                    'status_code' => $response->getStatusCode()
                ]);
                throw new \Exception('Unexpected response format from Gemini API');
            }
            
            $text = $body['candidates'][0]['content']['parts'][0]['text'];
            
            // Clean up the response text
            $text = trim($text);
            
            // Remove any markdown code block markers
            $text = preg_replace('/```(?:json)?\s*(.*?)\s*```/s', '$1', $text);
            
            // Try to extract JSON from the response text
            if (preg_match('/^\s*(\{.*\})\s*$/s', $text, $matches)) {
                $jsonStr = $matches[1];
                // Ensure proper UTF-8 encoding and handle potential Unicode escapes
                $jsonStr = mb_convert_encoding($jsonStr, 'UTF-8', 'UTF-8');
                $jsonStr = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function ($match) {
                    return mb_convert_encoding(pack('H*', $match[1]), 'UTF-8', 'UTF-16BE');
                }, $jsonStr);
                
                // Remove any BOM characters
                $jsonStr = str_replace("\xEF\xBB\xBF", '', $jsonStr);
                
                // Try to decode the JSON
                $result = json_decode($jsonStr, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Validate the structure before returning
                    if ($this->validateResponse($result)) {
                        return $jsonStr;
                    }
                    
                    Log::error('Invalid response structure from Gemini', [
                        'parsed_json' => $result,
                        'validation_error' => 'Response structure does not match expected format'
                    ]);
                    throw new \Exception('Invalid response structure from AI service');
                }
                
                Log::error('Failed to parse JSON from Gemini response', [
                    'text' => $text,
                    'extracted_json' => $jsonStr,
                    'json_error' => json_last_error_msg()
                ]);
                throw new \Exception('Failed to parse JSON from AI service response: ' . json_last_error_msg());
            }
            
            Log::error('No valid JSON found in Gemini response', [
                'response_text' => $text,
                'prompt_length' => strlen($prompt)
            ]);
            throw new \Exception('No valid JSON found in AI service response');
            
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            Log::error('Gemini API request failed', [
                'error' => $e->getMessage(),
                'response' => $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : null
            ]);
            throw new \Exception('Failed to communicate with AI service: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Error in makeRequest', [
                'error' => $e->getMessage(),
                'prompt_length' => strlen($prompt)
            ]);
            throw $e;
        }
    }
} 