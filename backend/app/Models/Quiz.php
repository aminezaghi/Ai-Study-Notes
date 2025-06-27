<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = [
        'document_id',
        'title',
        'type',
        'difficulty',
        'total_questions',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_questions' => 'integer',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $attributes = [
        'difficulty' => 'medium',
    ];

    /**
     * Get the document that owns the quiz.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Get the questions for the quiz.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }

    /**
     * Get the available difficulty levels.
     */
    public static function getDifficultyLevels(): array
    {
        return ['easy', 'medium', 'hard'];
    }
} 