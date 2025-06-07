<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flashcard extends Model
{
    protected $fillable = [
        'document_id',
        'question',
        'answer',
    ];

    /**
     * Get the document that owns the flashcard.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
