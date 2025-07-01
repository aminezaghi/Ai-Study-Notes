<?php

namespace App\Services;

use App\Models\EnhancedStudyNote;
use App\Models\NoteQuestion;
use App\Models\StudyNote;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
        $prompt = $this->getPrompt($studyNote->content);

        try {
            $response = $this->makeRequest($prompt);
            $result = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE || !$this->validateResponse($result)) {
                Log::warning('Invalid JSON response from AI service: ' . $response);
                throw new \Exception('Invalid response format from AI service');
            }

            return $this->createEnhancedNote($studyNote, $result);

        } catch (\Exception $e) {
            Log::error('Failed to generate enhanced study note: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get the prompt for enhanced study note generation
     */
    private function getPrompt(string $content): string
    {
        return "You are an expert educational content creator specializing in creating engaging, structured course sections. " .
               "Your task is to transform study notes into a well-organized learning module. " .
               "First, detect the language of the provided text and ensure all your responses are in that SAME language.\\n\\n" .
               "Return a SINGLE, VALID JSON object with these fields:\\n\\n" .
               
               "1. section_title (required):\\n" .
               "   - Clear, descriptive title that captures the main topic\\n" .
               "   - Example: 'Introduction to Neural Networks' (not just 'Neural Networks')\\n" .
               "   - Example: 'Understanding DNA Replication Mechanisms' (not just 'DNA')\\n\\n" .
               
               "2. lesson_intro (required):\\n" .
               "   - 2-3 sentences introducing the topic and its importance\\n" .
               "   - Include real-world relevance\\n" .
               "   - Example: 'Neural networks form the backbone of modern artificial intelligence, enabling computers to recognize patterns much like the human brain. In this section, we'll explore the fundamental concepts behind neural networks and understand how they process information. This knowledge is essential for anyone interested in machine learning and AI applications.'\\n\\n" .
               
               "3. key_points (required, 3-6 items):\\n" .
               "   - Each point should be a complete, detailed explanation\\n" .
               "   - Include context and significance\\n" .
               "   Example format:\\n" .
               "   [\\n" .
               "     'Network Architecture: Neural networks consist of interconnected layers of neurons. Each layer processes information in a specific way, with input layers receiving data, hidden layers performing computations, and output layers producing results.',\\n" .
               "     'Learning Process: Through backpropagation, neural networks adjust their internal weights based on training data, gradually improving their accuracy in pattern recognition tasks.',\\n" .
               "     'Activation Functions: These mathematical functions determine how neurons process and transmit information, with common types including ReLU, sigmoid, and tanh functions.'\\n" .
               "   ]\\n\\n" .
               
               "4. definitions (required):\\n" .
               "   - Key terms with comprehensive explanations\\n" .
               "   - Include practical context\\n" .
               "   Example format:\\n" .
               "   {\\n" .
               "     'Neuron': 'The basic computational unit of a neural network, inspired by biological neurons. It receives inputs, applies weights and biases, and produces an output through an activation function.',\\n" .
               "     'Backpropagation': 'A training algorithm that calculates the gradient of the error function with respect to the network weights, enabling the network to learn from its mistakes and improve accuracy.'\\n" .
               "   }\\n\\n" .
               
               "5. examples (required, 1-2 items):\\n" .
               "   - Real-world applications or detailed scenarios\\n" .
               "   - Include step-by-step explanations\\n" .
               "   Example format:\\n" .
               "   [\\n" .
               "     {\\n" .
               "       'title': 'Image Recognition in Healthcare',\\n" .
               "       'description': 'In medical imaging, neural networks help detect abnormalities in X-rays. For example, a convolutional neural network (CNN) processes a chest X-ray image through multiple layers: first identifying basic patterns like edges, then combining these into more complex features like tissue textures, and finally recognizing potential tumors or lesions.'\\n" .
               "     }\\n" .
               "   ]\\n\\n" .
               
               "6. section_summary (required):\\n" .
               "   - 2-3 sentences recapping key takeaways\\n" .
               "   - Connect concepts together\\n" .
               "   Example: 'Neural networks represent a powerful approach to machine learning, mimicking the human brain's structure to process and learn from data. Through carefully designed architectures and training processes, these networks can recognize complex patterns and make intelligent decisions. Understanding these fundamentals provides a strong foundation for exploring more advanced AI applications.'\\n\\n" .
               
               "7. task (optional):\\n" .
               "   - Practical, hands-on exercise\\n" .
               "   - Should reinforce learning\\n" .
               "   Example: 'Design a simple neural network architecture for a specific problem: Choose between image classification, sentiment analysis, or price prediction. Sketch the network layers, specify the number of neurons in each layer, and explain why you chose this structure. Compare your design with existing solutions online.'\\n\\n" .
               
               "8. next_topic (optional):\\n" .
               "   - Logical next section title\\n" .
               "   - Should build on current content\\n" .
               "   Example: 'Training Neural Networks: Optimization Techniques and Best Practices'\\n\\n" .
               
               "9. questions (required, 1-3 items):\\n" .
               "   - Mix of question types\\n" .
               "   - Test understanding, not memorization\\n" .
               "   - ONLY use these question types: 'mcq', 'fill_blank', or 'short_answer'\\n" .
               "   Example format for each type:\\n" .
               "   [\\n" .
               "     {\\n" .
               "       'type': 'mcq',\\n" .
               "       'question': 'Which component of a neural network is primarily responsible for introducing non-linearity into the model?',\\n" .
               "       'choices': [\\n" .
               "         'Activation functions',\\n" .
               "         'Weight matrices',\\n" .
               "         'Input layers',\\n" .
               "         'Bias terms'\\n" .
               "       ],\\n" .
               "       'correct_answer': 'Activation functions',\\n" .
               "       'explanation': 'Activation functions introduce non-linearity into neural networks, allowing them to learn complex patterns. Without activation functions, the network would only be capable of learning linear relationships.'\\n" .
               "     },\\n" .
               "     {\\n" .
               "       'type': 'fill_blank',\\n" .
               "       'question': 'The process of adjusting weights based on the error gradient is called _____.',\\n" .
               "       'correct_answer': 'backpropagation',\\n" .
               "       'explanation': 'Backpropagation is the fundamental algorithm that allows neural networks to learn from their mistakes by adjusting weights based on the calculated error gradient.'\\n" .
               "     },\\n" .
               "     {\\n" .
               "       'type': 'short_answer',\\n" .
               "       'question': 'Explain how activation functions contribute to a neural network\\'s ability to learn complex patterns.',\\n" .
               "       'correct_answer': 'Activation functions introduce non-linearity into the network, allowing it to learn and model complex, non-linear relationships in the data. Without them, the network would only be capable of learning linear combinations of inputs.',\\n" .
               "       'explanation': 'The non-linear nature of activation functions is crucial for neural networks to approximate complex functions and patterns that exist in real-world data.'\\n" .
               "     }\\n" .
               "   ]\\n\\n" .
               
               "IMPORTANT GUIDELINES:\\n" .
               "1. Focus on understanding and application, not just facts\\n" .
               "2. Use clear, precise language\\n" .
               "3. Maintain consistent depth across all sections\\n" .
               "4. Ensure examples are practical and relatable\\n" .
               "5. Questions should test conceptual understanding\\n" .
               "6. Keep the same language as the input text\\n\\n" .
               
               "Here's the content to analyze:\\n\\n" . $content;
    }

    /**
     * Validate the AI response format
     */
    private function validateResponse(array $response): bool
    {
        $validator = Validator::make($response, [
            'section_title' => 'required|string',
            'lesson_intro' => 'required|string',
            'key_points' => 'required|array|min:3|max:6',
            'key_points.*' => 'required|string',
            'definitions' => 'required|array',
            'definitions.*' => 'required|string',
            'examples' => 'required|array|min:1|max:2',
            'examples.*.title' => 'required|string',
            'examples.*.description' => 'required|string',
            'section_summary' => 'required|string',
            'task' => 'nullable|string',
            'next_topic' => 'nullable|string',
            'questions' => 'required|array|min:1|max:3',
            'questions.*.type' => 'required|in:mcq,fill_blank,short_answer',
            'questions.*.question' => 'required|string',
            'questions.*.choices' => 'required_if:questions.*.type,mcq|array',
            'questions.*.correct_answer' => 'required|string',
            'questions.*.explanation' => 'required|string'
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return true;
    }

    /**
     * Create enhanced study note from AI response
     */
    private function createEnhancedNote(StudyNote $studyNote, array $response): array
    {
        // Create the enhanced study note
        $enhancedNote = EnhancedStudyNote::create([
            'document_id' => $studyNote->document_id,
            'section_title' => $response['section_title'],
            'lesson_intro' => $response['lesson_intro'],
            'key_points' => $response['key_points'],
            'definitions' => $response['definitions'],
            'examples' => $response['examples'],
            'section_summary' => $response['section_summary'],
            'next_topic' => $response['next_topic'] ?? null,
            'task' => $response['task'] ?? null,
            'order' => 0
        ]);

        // Create questions
        $questions = collect($response['questions'])->map(function ($q) use ($enhancedNote) {
            return NoteQuestion::create([
                'enhanced_note_id' => $enhancedNote->id,
                'type' => $q['type'],
                'question' => $q['question'],
                'choices' => $q['type'] === 'mcq' ? $q['choices'] : null,
                'correct_answer' => $q['correct_answer'],
                'explanation' => $q['explanation'],
                'order' => 0
            ]);
        });

        return [
            'enhanced_note' => $enhancedNote->load('questions'),
            'questions' => $questions
        ];
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