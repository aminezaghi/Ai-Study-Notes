<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    protected $fillable = [
        'document_id',
        'question',
        'correct_answer',
        'options',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    /**
     * Get the document that owns the quiz question.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
