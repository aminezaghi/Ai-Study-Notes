<?php

namespace App\Http\Controllers;

use App\Services\AnswerValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnswerValidationController extends Controller
{
    private AnswerValidationService $validationService;

    public function __construct(AnswerValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    public function validateAnswer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string',
            'correct_answer' => 'required|string',
            'user_answer' => 'required|string',
            'question_type' => 'required|string|in:mcq,fill_blank,short_answer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid request data',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->validationService->validateAnswer(
                $request->input('question'),
                $request->input('correct_answer'),
                $request->input('user_answer'),
                $request->input('question_type')
            );

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to validate answer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 