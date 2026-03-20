<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\User;
use App\Notifications\RequisitionApproved;
use App\Notifications\RequisitionIssued;
use Illuminate\Support\Facades\DB;

class RequisitionService
{
    public function __construct(
        private readonly StockService $stockService
    ) {}

    /**
     * Create a new stock requisition.
     */
    public function create(array $data, array $items, User $requester): Requisition
    {
        return DB::transaction(function () use ($data, $items, $requester) {
            $req = Requisition::create([
                ...$data,
                'requested_by' => $requester->id,
                'status'       => 'pending',
            ]);

            foreach ($items as $item) {
                $req->items()->create($item);
            }

            AuditLog::record('requisition.created', $requester->id, Requisition::class, $req->id);

            return $req->fresh(['items.product']);
        });
    }

    /**
     * Approve a pending requisition (with optional quantity adjustments).
     */
    public function approve(Requisition $req, User $approver, array $approvedQuantities = []): Requisition
    {
        abort_if(!$req->canBeApproved(), 422, 'This requisition cannot be approved in its current state.');

        return DB::transaction(function () use ($req, $approver, $approvedQuantities) {
            foreach ($approvedQuantities as $itemId => $qty) {
                $req->items()->where('id', $itemId)->update(['quantity_approved' => $qty]);
            }

            $req->update([
                'status'      => 'approved',
                'approved_by' => $approver->id,
                'approved_at' => now(),
            ]);

            AuditLog::record('requisition.approved', $approver->id, Requisition::class, $req->id);
            $req->requestedBy->notify(new RequisitionApproved($req));

            return $req->fresh(['items.product']);
        });
    }

    /**
     * Reject a requisition.
     */
    public function reject(Requisition $req, User $rejector, string $reason): Requisition
    {
        abort_if(!$req->canBeApproved(), 422, 'This requisition cannot be rejected in its current state.');

        $req->update([
            'status'           => 'rejected',
            'rejection_reason' => $reason,
        ]);

        AuditLog::record('requisition.rejected', $rejector->id, Requisition::class, $req->id);

        return $req;
    }

    /**
     * Issue stock against an approved requisition.
     */
    public function issue(Requisition $req, array $issuedItems, User $issuer): Requisition
    {
        abort_if(!$req->canBeIssued(), 422, 'This requisition cannot be issued in its current state.');

        return DB::transaction(function () use ($req, $issuedItems, $issuer) {
            foreach ($issuedItems as $itemData) {
                /** @var RequisitionItem $item */
                $item = $req->items()->where('product_id', $itemData['product_id'])->firstOrFail();

                $qtyToIssue = (int) $itemData['quantity_issued'];
                if ($qtyToIssue <= 0) continue;

                if ($qtyToIssue > $item->remaining_to_issue) {
                    throw new \DomainException(
                        "Cannot issue {$qtyToIssue}. Remaining to issue: {$item->remaining_to_issue}."
                    );
                }

                $item->increment('quantity_issued', $qtyToIssue);

                $this->stockService->stockOut(
                    product:         $item->product,
                    quantity:        $qtyToIssue,
                    user:            $issuer,
                    reason:          "Issued against REQ #{$req->requisition_number} — {$req->department}",
                    documentRef:     $req->requisition_number,
                    transactionable: $req,
                );
            }

            $req->refresh();
            $allIssued = $req->items->every(fn ($i) => $i->isFullyIssued());
            $req->update([
                'status'    => $allIssued ? 'issued' : 'partially_issued',
                'issued_by' => $issuer->id,
                'issued_at' => now(),
            ]);

            AuditLog::record('requisition.issued', $issuer->id, Requisition::class, $req->id);

            if ($allIssued) {
                $req->requestedBy->notify(new RequisitionIssued($req));
            }

            return $req->fresh(['items.product']);
        });
    }
}
