<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'address',
        'contact_person', 'company_registration', 'status', 'notes',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getTotalOrdersAttribute(): int
    {
        return $this->purchaseOrders()->count();
    }

    public function getTotalOrderValueAttribute(): float
    {
        return $this->purchaseOrders()->sum('total_amount');
    }

    
}
