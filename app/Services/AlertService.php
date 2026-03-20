<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockAlert;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Support\Facades\Notification;

class AlertService
{
    /**
     * Check a product's current stock and create alerts if thresholds are crossed.
     */
    public function checkAndCreateAlerts(Product $product): void
    {
        $product->refresh();
        $qty = $product->current_quantity;

        if ($qty <= 0) {
            $this->createAlertIfNotExists($product, 'out_of_stock', $qty);
        } elseif ($qty <= $product->reorder_level) {
            $this->createAlertIfNotExists($product, 'low_stock', $qty);
        } elseif ($qty > $product->maximum_stock) {
            $this->createAlertIfNotExists($product, 'overstock', $qty);
        }
    }

    /**
     * Resolve any open alerts that are no longer valid.
     */
    public function checkAndResolveAlerts(Product $product): void
    {
        $product->refresh();
        $qty = $product->current_quantity;
        $system = User::where('role', 'admin')->first(); // System user for auto-resolution

        // Resolve out_of_stock if qty > 0
        if ($qty > 0) {
            $product->stockAlerts()
                ->unresolved()
                ->where('type', 'out_of_stock')
                ->each(fn ($a) => $a->resolve($system ?? new User(['id' => null])));
        }

        // Resolve low_stock if qty > reorder_level
        if ($qty > $product->reorder_level) {
            $product->stockAlerts()
                ->unresolved()
                ->where('type', 'low_stock')
                ->each(fn ($a) => $a->resolve($system ?? new User(['id' => null])));
        }

        // Resolve overstock if qty <= maximum_stock
        if ($qty <= $product->maximum_stock) {
            $product->stockAlerts()
                ->unresolved()
                ->where('type', 'overstock')
                ->each(fn ($a) => $a->resolve($system ?? new User(['id' => null])));
        }
    }

    /**
     * Run a full stock sweep — used by scheduled job.
     */
    public function runFullStockCheck(): void
    {
        Product::active()->with('stock')->chunk(100, function ($products) {
            foreach ($products as $product) {
                $this->checkAndCreateAlerts($product);
            }
        });
    }

    /**
     * Get all unresolved alerts grouped by type.
     */
    public function getUnresolvedAlerts(): array
    {
        return StockAlert::unresolved()
            ->with('product.category')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('type')
            ->toArray();
    }

    private function createAlertIfNotExists(Product $product, string $type, int $qty): void
    {
        $exists = StockAlert::where('product_id', $product->id)
            ->where('type', $type)
            ->unresolved()
            ->exists();

        if (!$exists) {
            $alert = StockAlert::create([
                'product_id'            => $product->id,
                'type'                  => $type,
                'triggered_at_quantity' => $qty,
            ]);

            // Notify all managers and admins
            $recipients = User::whereIn('role', ['admin', 'manager'])->get();
            Notification::send($recipients, new LowStockAlert($product, $type, $qty));
        }
    }
}
