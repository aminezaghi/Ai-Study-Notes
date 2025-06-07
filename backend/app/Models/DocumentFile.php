<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentFile extends Model
{
    protected $fillable = [
        'document_id',
        'original_filename',
        'file_path',
        'page_count',
        'extracted_text',
        'order',
    ];

    /**
     * Get the document that owns the file.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
