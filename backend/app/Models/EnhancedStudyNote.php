<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnhancedStudyNote extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'document_id',
        'section_title',
        'lesson_intro',
        'key_points',
        'definitions',
        'examples',
        'section_summary',
        'next_topic',
        'task',
        'order'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'key_points' => 'array',
        'definitions' => 'array',
        'examples' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the document that owns the enhanced study note.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Get the questions for the enhanced study note.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(NoteQuestion::class, 'enhanced_note_id');
    }
} 