<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequisitionItem extends Model
{
    protected $fillable = [
        'requisition_id', 'product_id',
        'quantity_requested', 'quantity_approved',
        'quantity_issued', 'notes',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getRemainingToIssueAttribute(): int
    {
        $approved = $this->quantity_approved ?? $this->quantity_requested;
        return $approved - $this->quantity_issued;
    }

    public function isFullyIssued(): bool
    {
        $approved = $this->quantity_approved ?? $this->quantity_requested;
        return $this->quantity_issued >= $approved;
    }
}
