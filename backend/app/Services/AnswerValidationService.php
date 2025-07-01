<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class AnswerValidationService
{
    private string $apiKey;
    private string $endpoint;
    private Client $client;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        
        if (empty($this->apiKey)) {
            throw new \RuntimeException('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
        }
        
        $this->endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        $this->client = new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'http_errors' => false
        ]);
    }

    public function validateAnswer(string $question, string $correctAnswer, string $userAnswer, string $questionType): array
    {
        $prompt = $this->getPrompt($question, $correctAnswer, $userAnswer, $questionType);

        try {
            Log::info('Making request to AI service', [
                'question' => $question,
                'question_type' => $questionType
            ]);

            $response = $this->makeRequest($prompt);
            
            Log::info('Raw AI response', [
                'response' => $response
            ]);

            $result = $this->parseResponse($response);
            
            Log::info('Parsed response', [
                'result' => $result
            ]);

            if (!$this->isValidResponseFormat($result)) {
                Log::error('Invalid response format', [
                    'raw_response' => $response,
                    'parsed_result' => $result
                ]);
                throw new \Exception('Invalid response format from AI service');
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('Validation error', [
                'error' => $e->getMessage(),
                'prompt' => $prompt,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function getPrompt(string $question, string $correctAnswer, string $userAnswer, string $questionType): string
    {
        return "You are an answer validator for an educational platform. Your task is to check if a student's answer matches the correct answer, considering typos and semantic meaning.\n\n" .
               "Question Type: " . $questionType . "\n" .
               "Question: " . $question . "\n" .
               "Correct Answer: " . $correctAnswer . "\n" .
               "Student's Answer: " . $userAnswer . "\n\n" .
               
               "Respond with ONLY a JSON object in this EXACT format (no other text):\n" .
               "{\n" .
               "  \"is_correct\": true or false,\n" .
               "  \"confidence\": number between 0-100,\n" .
               "  \"feedback\": \"explanation string\",\n" .
               "  \"similarity_score\": number between 0-100\n" .
               "}\n\n" .
               
               "Rules:\n" .
               "1. For fill_blank: Allow minor typos/spacing differences\n" .
               "2. For short_answer: Focus on meaning, not exact wording\n" .
               "3. Give helpful feedback explaining why the answer is right/wrong\n" .
               "4. Use similarity_score for how close the answer is\n" .
               "5. IMPORTANT: Return ONLY the JSON object, no other text\n\n" .
               
               "Evaluate this answer now:";
    }

    private function makeRequest(string $prompt): string
    {
        $url = $this->endpoint . '?key=' . $this->apiKey;
        
        try {
            $requestBody = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'topK' => 1,
                    'topP' => 1,
                    'maxOutputTokens' => 1024,
                ]
            ];

            Log::debug('Making AI request', [
                'url' => $url,
                'request_body' => $requestBody
            ]);

            $response = $this->client->post($url, [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'json' => $requestBody
            ]);

            $statusCode = $response->getStatusCode();
            $body = json_decode($response->getBody(), true);

            Log::debug('AI service response', [
                'status_code' => $statusCode,
                'body' => $body
            ]);

            if ($statusCode !== 200) {
                throw new \Exception("AI service returned status code: {$statusCode}");
            }
            
            if (!isset($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Unexpected AI response structure', [
                    'body' => $body
                ]);
                throw new \Exception('Unexpected response structure from AI service');
            }
            
            return $body['candidates'][0]['content']['parts'][0]['text'];
            
        } catch (\Exception $e) {
            Log::error('Request error', [
                'error' => $e->getMessage(),
                'prompt_length' => strlen($prompt)
            ]);
            throw $e;
        }
    }

    private function parseResponse(string $response): array
    {
        try {
            // First try direct JSON decode
            $result = json_decode($response, true);
            
            if (json_last_error() === JSON_ERROR_NONE && $this->isValidResponseFormat($result)) {
                return $result;
            }

            // If that fails, try to extract JSON object
            if (preg_match('/\{(?:[^{}]|(?R))*\}/s', $response, $matches)) {
                $jsonStr = $matches[0];
                $result = json_decode($jsonStr, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $result;
                }
            }

            Log::error('Failed to parse response', [
                'response' => $response,
                'json_error' => json_last_error_msg()
            ]);
            
            throw new \Exception('Failed to parse AI service response');
            
        } catch (\Exception $e) {
            Log::error('Parse error', [
                'error' => $e->getMessage(),
                'response' => $response
            ]);
            throw $e;
        }
    }

    private function isValidResponseFormat(array $result): bool
    {
        $requiredFields = ['is_correct', 'confidence', 'feedback', 'similarity_score'];
        
        // Check all required fields exist
        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $result)) {
                Log::warning("Missing required field: {$field}", [
                    'result' => $result
                ]);
                return false;
            }
        }

        // Validate types and ranges
        if (!is_bool($result['is_correct'])) {
            Log::warning('is_correct is not boolean', ['value' => $result['is_correct']]);
            return false;
        }

        if (!is_numeric($result['confidence']) || $result['confidence'] < 0 || $result['confidence'] > 100) {
            Log::warning('Invalid confidence value', ['value' => $result['confidence']]);
            return false;
        }

        if (!is_string($result['feedback']) || empty($result['feedback'])) {
            Log::warning('Invalid feedback value', ['value' => $result['feedback']]);
            return false;
        }

        if (!is_numeric($result['similarity_score']) || $result['similarity_score'] < 0 || $result['similarity_score'] > 100) {
            Log::warning('Invalid similarity_score value', ['value' => $result['similarity_score']]);
            return false;
        }

        return true;
    }
} 