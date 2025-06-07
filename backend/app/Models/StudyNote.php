<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyNote extends Model
{
    protected $fillable = [
        'document_id',
        'content',
        'summary',
    ];

    /**
     * Get the document that owns the study note.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
