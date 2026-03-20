<?php

namespace App\Services;

use App\Enums\TransactionType;
use App\Events\StockLevelChanged;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function __construct(
        private readonly AlertService $alertService
    ) {}

    /**
     * Record a stock-in transaction (receiving goods from supplier).
     */
    public function stockIn(
        Product $product,
        int $quantity,
        User $user,
        ?float $unitCost = null,
        ?string $reason = null,
        ?string $documentRef = null,
        mixed $transactionable = null
    ): StockTransaction {
        return DB::transaction(function () use (
            $product, $quantity, $user, $unitCost, $reason, $documentRef, $transactionable
        ) {
            $stock = $product->stock()->lockForUpdate()->first();
            $quantityBefore = $stock->quantity_on_hand;

            $stock->addQuantity($quantity);

            $tx = StockTransaction::create([
                'product_id'            => $product->id,
                'performed_by'          => $user->id,
                'type'                  => TransactionType::StockIn,
                'quantity_before'       => $quantityBefore,
                'quantity_change'       => $quantity,
                'quantity_after'        => $stock->fresh()->quantity_on_hand,
                'unit_cost'             => $unitCost,
                'total_cost'            => $unitCost ? $unitCost * $quantity : null,
                'reason'                => $reason,
                'document_reference'    => $documentRef,
                'transactionable_type'  => $transactionable ? get_class($transactionable) : null,
                'transactionable_id'    => $transactionable?->id,
                'transaction_date'      => now(),
            ]);

            event(new StockLevelChanged($product, $quantityBefore, $stock->fresh()->quantity_on_hand));
            $this->alertService->checkAndResolveAlerts($product);

            AuditLog::record("stock_in", $user->id, Product::class, $product->id, null, [
                'quantity' => $quantity, 'quantity_after' => $tx->quantity_after,
            ]);

            return $tx;
        });
    }

    /**
     * Record a stock-out transaction (issuing goods to department/user).
     */
    public function stockOut(
        Product $product,
        int $quantity,
        User $user,
        ?string $reason = null,
        ?string $documentRef = null,
        mixed $transactionable = null
    ): StockTransaction {
        return DB::transaction(function () use (
            $product, $quantity, $user, $reason, $documentRef, $transactionable
        ) {
            $stock = $product->stock()->lockForUpdate()->first();
            $quantityBefore = $stock->quantity_on_hand;

            $stock->removeQuantity($quantity); // Throws DomainException if insufficient

            $tx = StockTransaction::create([
                'product_id'            => $product->id,
                'performed_by'          => $user->id,
                'type'                  => TransactionType::StockOut,
                'quantity_before'       => $quantityBefore,
                'quantity_change'       => -$quantity,
                'quantity_after'        => $stock->fresh()->quantity_on_hand,
                'reason'                => $reason,
                'document_reference'    => $documentRef,
                'transactionable_type'  => $transactionable ? get_class($transactionable) : null,
                'transactionable_id'    => $transactionable?->id,
                'transaction_date'      => now(),
            ]);

            event(new StockLevelChanged($product, $quantityBefore, $stock->fresh()->quantity_on_hand));
            $this->alertService->checkAndCreateAlerts($product);

            AuditLog::record("stock_out", $user->id, Product::class, $product->id, null, [
                'quantity' => $quantity, 'quantity_after' => $tx->quantity_after,
            ]);

            return $tx;
        });
    }

    /**
     * Manually adjust stock to a specific quantity.
     */
    public function adjustStock(
        Product $product,
        int $newQuantity,
        User $user,
        string $reason
    ): StockTransaction {
        return DB::transaction(function () use ($product, $newQuantity, $user, $reason) {
            $stock = $product->stock()->lockForUpdate()->first();
            $quantityBefore = $stock->quantity_on_hand;
            $change = $newQuantity - $quantityBefore;

            $stock->update(['quantity_on_hand' => $newQuantity]);

            $tx = StockTransaction::create([
                'product_id'       => $product->id,
                'performed_by'     => $user->id,
                'type'             => $change >= 0 ? TransactionType::AdjustmentIn : TransactionType::AdjustmentOut,
                'quantity_before'  => $quantityBefore,
                'quantity_change'  => $change,
                'quantity_after'   => $newQuantity,
                'reason'           => $reason,
                'transaction_date' => now(),
            ]);

            event(new StockLevelChanged($product, $quantityBefore, $newQuantity));
            $this->alertService->checkAndCreateAlerts($product);
            $this->alertService->checkAndResolveAlerts($product);

            AuditLog::record("stock_adjustment", $user->id, Product::class, $product->id,
                ['quantity' => $quantityBefore],
                ['quantity' => $newQuantity, 'reason' => $reason]
            );

            return $tx;
        });
    }

    /**
     * Set opening stock for a newly created product.
     */
    public function setOpeningStock(Product $product, int $quantity, User $user, ?float $unitCost = null): StockTransaction
    {
        return DB::transaction(function () use ($product, $quantity, $user, $unitCost) {
            $stock = $product->stock()->lockForUpdate()->first();
            $stock->update(['quantity_on_hand' => $quantity]);

            return StockTransaction::create([
                'product_id'       => $product->id,
                'performed_by'     => $user->id,
                'type'             => TransactionType::OpeningStock,
                'quantity_before'  => 0,
                'quantity_change'  => $quantity,
                'quantity_after'   => $quantity,
                'unit_cost'        => $unitCost,
                'total_cost'       => $unitCost ? $unitCost * $quantity : null,
                'reason'           => 'Opening stock entry',
                'transaction_date' => now(),
            ]);
        });
    }

    /**
     * Write off damaged or expired stock.
     */
    public function writeOff(
        Product $product,
        int $quantity,
        User $user,
        string $type, // 'damage' or 'expired'
        string $reason
    ): StockTransaction {
        $txType = $type === 'expired'
            ? TransactionType::ExpiredWriteOff
            : TransactionType::DamageWriteOff;

        return DB::transaction(function () use ($product, $quantity, $user, $txType, $reason) {
            $stock = $product->stock()->lockForUpdate()->first();
            $quantityBefore = $stock->quantity_on_hand;

            $stock->removeQuantity($quantity);

            $tx = StockTransaction::create([
                'product_id'       => $product->id,
                'performed_by'     => $user->id,
                'type'             => $txType,
                'quantity_before'  => $quantityBefore,
                'quantity_change'  => -$quantity,
                'quantity_after'   => $stock->fresh()->quantity_on_hand,
                'reason'           => $reason,
                'transaction_date' => now(),
            ]);

            event(new StockLevelChanged($product, $quantityBefore, $tx->quantity_after));
            $this->alertService->checkAndCreateAlerts($product);

            return $tx;
        });
    }
}
