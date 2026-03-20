<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockLevelChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Product $product,
        public readonly int $oldQuantity,
        public readonly int $newQuantity,
    ) {}
}
