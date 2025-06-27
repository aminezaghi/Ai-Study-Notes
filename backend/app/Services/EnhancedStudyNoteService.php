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
    public function generateEnhancedNotes(StudyNote $studyNote, string $sectionTitle): array
    {
        $prompt = "You are an expert study notes enhancer. Your task is to take the following study note content " .
                 "and create an enhanced version with key points, definitions, examples, and checkpoint questions. " .
                 "First, detect the language of the provided text and ensure all your responses are in that SAME language. " .
                 "Format your response exactly as shown in this example (but in the SAME LANGUAGE as the input):\n\n" .
                 "{\n" .
                 "  \"key_points\": [\n" .
                 "    \"Point 1 with clear explanation\",\n" .
                 "    \"Point 2 with clear explanation\",\n" .
                 "    \"Point 3 with clear explanation\"\n" .
                 "  ],\n" .
                 "  \"definitions\": {\n" .
                 "    \"Term 1\": \"Clear definition\",\n" .
                 "    \"Term 2\": \"Clear definition\"\n" .
                 "  },\n" .
                 "  \"examples\": [\n" .
                 "    {\n" .
                 "      \"title\": \"Example 1 Title\",\n" .
                 "      \"description\": \"Detailed explanation\"\n" .
                 "    },\n" .
                 "    {\n" .
                 "      \"title\": \"Example 2 Title\",\n" .
                 "      \"description\": \"Detailed explanation\"\n" .
                 "    }\n" .
                 "  ],\n" .
                 "  \"questions\": [\n" .
                 "    {\n" .
                 "      \"type\": \"mcq\",\n" .
                 "      \"question\": \"Clear question text?\",\n" .
                 "      \"choices\": [\"Choice 1\", \"Choice 2\", \"Choice 3\"],\n" .
                 "      \"correct_answer\": \"Choice 2\"\n" .
                 "    },\n" .
                 "    {\n" .
                 "      \"type\": \"fill\",\n" .
                 "      \"question\": \"Complete this statement: ___\",\n" .
                 "      \"correct_answer\": \"answer\"\n" .
                 "    }\n" .
                 "  ]\n" .
                 "}\n\n" .
                 "IMPORTANT GUIDELINES:\n" .
                 "1. Generate 3-5 key points that capture the main concepts\n" .
                 "2. Include 2-4 important definitions\n" .
                 "3. Provide 1-2 practical examples\n" .
                 "4. Create 2 checkpoint questions (mix of MCQ and fill-in-the-blank)\n" .
                 "5. Keep all content in the SAME LANGUAGE as the input text\n" .
                 "6. Make sure all content is clear, accurate, and educational\n\n" .
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
                'section_title' => $sectionTitle,
                'key_points' => $result['key_points'],
                'definitions' => $result['definitions'],
                'examples' => $result['examples'],
                'order' => 0 // You might want to handle order differently
            ]);

            // Create the checkpoint questions
            foreach ($result['questions'] as $questionData) {
                NoteQuestion::create([
                    'enhanced_note_id' => $enhancedNote->id,
                    'type' => $questionData['type'],
                    'question' => $questionData['question'],
                    'choices' => isset($questionData['choices']) ? $questionData['choices'] : null,
                    'correct_answer' => $questionData['correct_answer'],
                    'order' => 0 // You might want to handle order differently
                ]);
            }

            return [
                'enhanced_note' => $enhancedNote,
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
        return isset($response['key_points']) && is_array($response['key_points'])
            && isset($response['definitions']) && is_array($response['definitions'])
            && isset($response['examples']) && is_array($response['examples'])
            && isset($response['questions']) && is_array($response['questions'])
            && count($response['key_points']) >= 3
            && count($response['definitions']) >= 2
            && count($response['examples']) >= 1
            && count($response['questions']) >= 2;
    }

    /**
     * Make a request to the Gemini API
     */
    private function makeRequest(string $prompt): string
    {
        $url = $this->endpoint . '?key=' . $this->apiKey;
        
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
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.8,
                    'maxOutputTokens' => 2048,
                ]
            ]
        ]);

        $body = json_decode($response->getBody(), true);
        
        if (!isset($body['candidates'][0]['content']['parts'][0]['text'])) {
            Log::error('Unexpected Gemini API response format', ['response' => $body]);
            throw new \Exception('Unexpected response format from Gemini API');
        }

        $text = $body['candidates'][0]['content']['parts'][0]['text'];
        
        // Clean up potential markdown code block markers
        $text = preg_replace('/```(?:json)?\s*(.*?)\s*```/s', '$1', $text);
        
        // Try to extract JSON from the response text
        if (preg_match('/\{.*\}/s', $text, $matches)) {
            $jsonStr = $matches[0];
            // Ensure proper UTF-8 encoding
            $jsonStr = mb_convert_encoding($jsonStr, 'UTF-8', 'UTF-8');
            $result = json_decode($jsonStr, true);
            
            if (json_last_error() === JSON_ERROR_NONE) {
                return $jsonStr;
            }
            
            Log::error('Failed to parse JSON from Gemini response', [
                'text' => $text,
                'extracted_json' => $jsonStr,
                'json_error' => json_last_error_msg()
            ]);
        }
        
        Log::error('No valid JSON found in Gemini response', ['response_text' => $text]);
        throw new \Exception('Invalid response format from AI service');
    }
} 