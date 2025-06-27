<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnhancedStudyNote extends Model
{
    protected $fillable = [
        'document_id',
        'section_title',
        'key_points',
        'definitions',
        'examples',
        'order',
    ];

    protected $casts = [
        'key_points' => 'array',
        'definitions' => 'array',
        'examples' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(NoteQuestion::class, 'enhanced_note_id');
    }
} 