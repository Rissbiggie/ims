<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Requisition extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'requisition_number', 'requested_by', 'approved_by', 'issued_by',
        'status', 'department', 'purpose', 'required_date',
        'notes', 'rejection_reason', 'approved_at', 'issued_at',
    ];

    protected function casts(): array
    {
        return [
            'required_date' => 'date',
            'approved_at'   => 'datetime',
            'issued_at'     => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Requisition $req) {
            if (empty($req->requisition_number)) {
                $req->requisition_number = static::generateNumber();
            }
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RequisitionItem::class);
    }

    public function stockTransactions(): MorphMany
    {
        return $this->morphMany(StockTransaction::class, 'transactionable');
    }

    // ─── State ────────────────────────────────────────────────────────────────

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeIssued(): bool
    {
        return in_array($this->status, ['approved', 'partially_issued']);
    }

    public static function generateNumber(): string
    {
        $prefix = 'REQ-' . date('Ym') . '-';
        $last = static::where('requisition_number', 'like', $prefix . '%')
                      ->orderByDesc('id')->first();
        $seq = $last ? ((int) substr($last->requisition_number, -4)) + 1 : 1;
        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
