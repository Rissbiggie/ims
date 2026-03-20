<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\User;
use App\Notifications\PurchaseOrderApproved;
use App\Notifications\PurchaseOrderReceived;
use Illuminate\Support\Facades\DB;

class PurchaseOrderService
{
    public function __construct(
        private readonly StockService $stockService
    ) {}

    /**
     * Create a new purchase order in draft state.
     */
    public function create(array $data, array $items, User $creator): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $items, $creator) {
            $po = PurchaseOrder::create([
                ...$data,
                'created_by' => $creator->id,
                'status'     => 'draft',
                'order_date' => now()->toDateString(),
            ]);

            foreach ($items as $item) {
                $po->items()->create($item);
            }

            $po->recalculateTotal();

            AuditLog::record('purchase_order.created', $creator->id, PurchaseOrder::class, $po->id);

            return $po->fresh(['items.product', 'supplier']);
        });
    }

    /**
     * Submit purchase order for approval.
     */
    public function submit(PurchaseOrder $po, User $user): PurchaseOrder
    {
        abort_if($po->status !== 'draft', 422, 'Only draft orders can be submitted.');

        $po->update(['status' => 'pending_approval']);
        AuditLog::record('purchase_order.submitted', $user->id, PurchaseOrder::class, $po->id);

        return $po;
    }

    /**
     * Approve a pending purchase order.
     */
    public function approve(PurchaseOrder $po, User $approver): PurchaseOrder
    {
        abort_if(!$po->canBeApproved(), 422, 'This order cannot be approved in its current state.');

        $po->update([
            'status'      => 'approved',
            'approved_by' => $approver->id,
        ]);

        AuditLog::record('purchase_order.approved', $approver->id, PurchaseOrder::class, $po->id);

        // Notify the creator
        $po->createdBy->notify(new PurchaseOrderApproved($po));

        return $po;
    }

    /**
     * Reject a pending purchase order.
     */
    public function reject(PurchaseOrder $po, User $rejector, string $reason): PurchaseOrder
    {
        abort_if(!$po->canBeApproved(), 422, 'This order cannot be rejected in its current state.');

        $po->update([
            'status'           => 'cancelled',
            'rejection_reason' => $reason,
        ]);

        AuditLog::record('purchase_order.rejected', $rejector->id, PurchaseOrder::class, $po->id);

        return $po;
    }

    /**
     * Receive goods against a purchase order (partial or full).
     */
    public function receive(PurchaseOrder $po, array $receivedItems, User $receiver): PurchaseOrder
    {
        abort_if(!$po->canBeReceived(), 422, 'This order cannot be received in its current state.');

        return DB::transaction(function () use ($po, $receivedItems, $receiver) {
            foreach ($receivedItems as $itemData) {
                /** @var PurchaseOrderItem $item */
                $item = $po->items()->where('product_id', $itemData['product_id'])->firstOrFail();

                $qtyToReceive = (int) $itemData['quantity_received'];
                if ($qtyToReceive <= 0) continue;

                $remaining = $item->remaining_quantity;
                if ($qtyToReceive > $remaining) {
                    throw new \DomainException(
                        "Cannot receive {$qtyToReceive} units for product ID {$item->product_id}. Remaining: {$remaining}."
                    );
                }

                $item->increment('quantity_received', $qtyToReceive);

                // Record stock transaction
                $this->stockService->stockIn(
                    product:         $item->product,
                    quantity:        $qtyToReceive,
                    user:            $receiver,
                    unitCost:        $item->unit_price,
                    reason:          "Received against PO #{$po->order_number}",
                    documentRef:     $po->order_number,
                    transactionable: $po,
                );
            }

            // Update PO status
            $po->refresh();
            $status = $po->isFullyReceived() ? 'received' : 'partially_received';
            $updates = ['status' => $status];
            if ($status === 'received') {
                $updates['actual_delivery_date'] = now()->toDateString();
            }
            $po->update($updates);

            AuditLog::record('purchase_order.received', $receiver->id, PurchaseOrder::class, $po->id);

            if ($status === 'received') {
                $po->createdBy->notify(new PurchaseOrderReceived($po));
            }

            return $po->fresh(['items.product', 'supplier']);
        });
    }
}
