<?php

namespace App\Models;

use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class StockTransaction extends Model
{
    protected $fillable = [
        'reference_number', 'product_id', 'performed_by',
        'type', 'quantity_before', 'quantity_change', 'quantity_after',
        'unit_cost', 'total_cost', 'transactionable_type', 'transactionable_id',
        'reason', 'document_reference', 'transaction_date',
    ];

    protected function casts(): array
    {
        return [
            'type'             => TransactionType::class,
            'unit_cost'        => 'decimal:2',
            'total_cost'       => 'decimal:2',
            'transaction_date' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (StockTransaction $tx) {
            if (empty($tx->reference_number)) {
                $tx->reference_number = static::generateReference();
            }
            if (empty($tx->transaction_date)) {
                $tx->transaction_date = now();
            }
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function transactionable(): MorphTo
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeInbound($query)
    {
        return $query->whereIn('type', [
            TransactionType::StockIn->value,
            TransactionType::AdjustmentIn->value,
            TransactionType::TransferIn->value,
            TransactionType::ReturnIn->value,
            TransactionType::OpeningStock->value,
        ]);
    }

    public function scopeOutbound($query)
    {
        return $query->whereIn('type', [
            TransactionType::StockOut->value,
            TransactionType::AdjustmentOut->value,
            TransactionType::TransferOut->value,
            TransactionType::ReturnOut->value,
            TransactionType::DamageWriteOff->value,
            TransactionType::ExpiredWriteOff->value,
        ]);
    }

    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('transaction_date', [$from, $to]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public static function generateReference(): string
    {
        return 'TXN-' . strtoupper(Str::random(10));
    }
}
