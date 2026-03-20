<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number', 'supplier_id', 'created_by', 'approved_by',
        'status', 'order_date', 'expected_delivery_date',
        'actual_delivery_date', 'total_amount', 'notes', 'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'order_date'             => 'date',
            'expected_delivery_date' => 'date',
            'actual_delivery_date'   => 'date',
            'total_amount'           => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PurchaseOrder $po) {
            if (empty($po->order_number)) {
                $po->order_number = static::generateOrderNumber();
            }
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function stockTransactions(): MorphMany
    {
        return $this->morphMany(StockTransaction::class, 'transactionable');
    }

    // ─── State Helpers ────────────────────────────────────────────────────────

    public function canBeApproved(): bool
    {
        return $this->status === 'pending_approval';
    }

    public function canBeReceived(): bool
    {
        return in_array($this->status, ['approved', 'ordered', 'partially_received']);
    }

    public function isFullyReceived(): bool
    {
        return $this->items->every(fn ($item) =>
            $item->quantity_received >= $item->quantity_ordered
        );
    }

    public function recalculateTotal(): void
    {
        $total = $this->items()->sum(DB::raw('quantity_ordered * unit_price'));
        $this->update(['total_amount' => $total]);
    }

    public static function generateOrderNumber(): string
    {
        $prefix = 'PO-' . date('Ym') . '-';
        $last = static::where('order_number', 'like', $prefix . '%')
                      ->orderByDesc('id')->first();
        $seq = $last ? ((int) substr($last->order_number, -4)) + 1 : 1;
        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
