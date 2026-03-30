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

    // Defined constants to avoid "magic strings" throughout the app
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PARTIAL = 'partially_issued';
    const STATUS_ISSUED = 'issued';

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
            
            // Ensure every requisition starts as a draft if no status is provided
            if (empty($req->status)) {
                $req->status = self::STATUS_DRAFT;
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

    // ─── State Helpers ────────────────────────────────────────────────────────

    /**
     * Can the requisition be officially submitted for approval?
     */
    public function canBeSubmitted(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Can a manager approve this requisition?
     */
    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Can the store clerk issue items for this?
     */
    public function canBeIssued(): bool
    {
        return in_array($this->status, [self::STATUS_APPROVED, self::STATUS_PARTIAL]);
    }
    
    /**
     * Can the user still edit the items in this requisition?
     */
    public function isEditable(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    // ─── Logic ────────────────────────────────────────────────────────────────

    public static function generateNumber(): string
    {
        $prefix = 'REQ-' . date('Ym') . '-';
        $last = static::where('requisition_number', 'like', $prefix . '%')
                      ->orderByDesc('id')->first();
        $seq = $last ? ((int) substr($last->requisition_number, -4)) + 1 : 1;
        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}