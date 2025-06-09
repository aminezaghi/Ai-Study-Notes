<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\StudyNoteController;
use App\Http\Controllers\FlashcardController;

// Public routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    // Document routes
    Route::apiResource('documents', DocumentController::class);

    // Study Notes
    Route::get('/documents/{document}/notes', [StudyNoteController::class, 'index']);
    Route::post('/documents/{document}/notes/generate', [StudyNoteController::class, 'generate']);

    // Flashcards
    Route::get('/documents/{document}/flashcards', [FlashcardController::class, 'index']);
    Route::post('/documents/{document}/flashcards/generate', [FlashcardController::class, 'generate']);
    Route::delete('/documents/{document}/flashcards/{flashcard}', [FlashcardController::class, 'destroy']);
}); 