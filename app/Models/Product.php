<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sku', 'name', 'slug', 'description', 'category_id', 'supplier_id',
        'unit_of_measure', 'unit_price', 'selling_price',
        'reorder_level', 'reorder_quantity', 'minimum_stock', 'maximum_stock',
        'location', 'image_path', 'is_active', 'track_expiry',
    ];

    protected function casts(): array
    {
        return [
            'unit_price'    => 'decimal:2',
            'selling_price' => 'decimal:2',
            'is_active'     => 'boolean',
            'track_expiry'  => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
            if (empty($product->sku)) {
                $product->sku = static::generateSku();
            }
        });

        static::created(function (Product $product) {
            // Auto-create stock record with zero quantity
            $product->stock()->create(['quantity_on_hand' => 0]);
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stock(): HasOne
    {
        return $this->hasOne(Stock::class);
    }

    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function requisitionItems(): HasMany
    {
        return $this->hasMany(RequisitionItem::class);
    }

    public function stockAlerts(): HasMany
    {
        return $this->hasMany(StockAlert::class);
    }

    // ─── Computed Properties ──────────────────────────────────────────────────

    public function getCurrentQuantityAttribute(): int
    {
        return $this->stock?->quantity_on_hand ?? 0;
    }

    public function getAvailableQuantityAttribute(): int
    {
        $stock = $this->stock;
        return ($stock?->quantity_on_hand ?? 0) - ($stock?->quantity_reserved ?? 0);
    }

    public function isLowStock(): bool
    {
        return $this->current_quantity <= $this->reorder_level
            && $this->current_quantity > 0;
    }

    public function isOutOfStock(): bool
    {
        return $this->current_quantity <= 0;
    }

    public function needsReorder(): bool
    {
        return $this->current_quantity <= $this->reorder_level;
    }

    public function getStockStatusAttribute(): string
    {
        if ($this->isOutOfStock()) return 'out_of_stock';
        if ($this->isLowStock()) return 'low_stock';
        if ($this->current_quantity > $this->maximum_stock) return 'overstock';
        return 'in_stock';
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereHas('stock', function ($q) {
            $q->whereColumn('quantity_on_hand', '<=', 'products.reorder_level')
              ->where('quantity_on_hand', '>', 0);
        });
    }

    public function scopeOutOfStock($query)
    {
        return $query->whereHas('stock', function ($q) {
            $q->where('quantity_on_hand', '<=', 0);
        });
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('sku', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%");
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public static function generateSku(): string
    {
        do {
            $sku = 'PRD-' . strtoupper(Str::random(8));
        } while (static::where('sku', $sku)->exists());

        return $sku;
    }
}
