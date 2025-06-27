<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteQuestion extends Model
{
    protected $fillable = [
        'enhanced_note_id',
        'type',
        'question',
        'choices',
        'correct_answer',
        'order',
    ];

    protected $casts = [
        'choices' => 'array',
    ];

    public function enhancedNote(): BelongsTo
    {
        return $this->belongsTo(EnhancedStudyNote::class, 'enhanced_note_id');
    }
} 