<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    protected $fillable = [
        'product_id', 'quantity_on_hand',
        'quantity_reserved', 'quantity_on_order',
        'last_restock_at', 'last_issue_at',
    ];

    protected function casts(): array
    {
        return [
            'last_restock_at' => 'datetime',
            'last_issue_at'   => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function getAvailableQuantityAttribute(): int
    {
        return $this->quantity_on_hand - $this->quantity_reserved;
    }

    /**
     * Atomically increment stock quantity.
     */
    public function addQuantity(int $qty): void
    {
        $this->increment('quantity_on_hand', $qty);
        $this->update(['last_restock_at' => now()]);
    }

    /**
     * Atomically decrement stock quantity. Throws if insufficient.
     */
    public function removeQuantity(int $qty): void
    {
        if ($this->quantity_on_hand < $qty) {
            throw new \DomainException(
                "Insufficient stock for product ID {$this->product_id}. "
                . "Available: {$this->quantity_on_hand}, Requested: {$qty}"
            );
        }
        $this->decrement('quantity_on_hand', $qty);
        $this->update(['last_issue_at' => now()]);
    }
}
