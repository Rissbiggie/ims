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
    // PurchaseOrderService.php

/**
 * Reject a pending purchase order.
 */
public function reject(PurchaseOrder $po, User $rejector, string $reason): PurchaseOrder
{
    // Ensure it's in pending_approval before rejecting
    abort_if($po->status !== 'pending_approval', 422, 'Only pending orders can be rejected.');

    $po->update([
        'status'           => 'rejected', // Changed from 'cancelled' to 'rejected'
        'rejection_reason' => $reason,
    ]);

    AuditLog::record('purchase_order.rejected', $rejector->id, PurchaseOrder::class, $po->id);

    return $po;
}

/**
 * Receive goods against a purchase order.
 */
public function receive(PurchaseOrder $po, array $receivedItems, User $receiver): PurchaseOrder
{
    abort_if($po->status !== 'approved' && $po->status !== 'partially_received', 422, 'Order must be approved to receive goods.');

    return DB::transaction(function () use ($po, $receivedItems, $receiver) {
        foreach ($receivedItems as $itemData) {
            // Find the item within this PO context
            $item = $po->items()->where('product_id', $itemData['product_id'])->first();

            if (!$item) continue; 

            $qtyToReceive = (int) $itemData['quantity_received'];
            $remaining = $item->quantity_ordered - $item->quantity_received;

            if ($qtyToReceive > $remaining) {
                throw new \DomainException(
                    "Over-receiving not allowed for Product #{$itemData['product_id']}. Max allowed: {$remaining}"
                );
            }

            $item->increment('quantity_received', $qtyToReceive);

            // Trigger stock-in logic
            $this->stockService->stockIn(
                product:         $item->product,
                quantity:        $qtyToReceive,
                user:            $receiver,
                unitCost:        $item->unit_price,
                reason:          "PO Receipt: #{$po->order_number}",
                documentRef:     $po->order_number,
                transactionable: $po,
            );
        }

        // Logic for Status Update
        $po->refresh();
        
        // Custom logic: check if all items are fully met
        $isComplete = $po->items->every(fn($item) => $item->quantity_received >= $item->quantity_ordered);
        
        $newStatus = $isComplete ? 'received' : 'partially_received';
        
        $po->update([
            'status' => $newStatus,
            'actual_delivery_date' => $isComplete ? now() : null
        ]);

        AuditLog::record('purchase_order.received', $receiver->id, PurchaseOrder::class, $po->id);

        return $po->fresh(['items.product', 'supplier']);
    });
}
}