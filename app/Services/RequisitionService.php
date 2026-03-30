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
     * Create a new requisition as either a Draft or Pending.
     */
    public function create(array $data, array $items, User $requester, bool $shouldSubmit = false): Requisition
    {
        return DB::transaction(function () use ($data, $items, $requester, $shouldSubmit) {
            $status = $shouldSubmit ? Requisition::STATUS_PENDING : Requisition::STATUS_DRAFT;

            $req = Requisition::create([
                ...$data,
                'requested_by' => $requester->id,
                'status'       => $status,
            ]);

            foreach ($items as $item) {
                $req->items()->create($item);
            }

            AuditLog::record("requisition.{$status}", $requester->id, Requisition::class, $req->id);

            return $req->fresh(['items.product']);
        });
    }

    /**
     * Submit an existing Draft for approval.
     */
    public function submit(Requisition $req, User $user): Requisition
    {
        abort_if(!$req->canBeSubmitted(), 422, 'Only drafts can be submitted for approval.');

        $req->update(['status' => Requisition::STATUS_PENDING]);

        AuditLog::record('requisition.submitted', $user->id, Requisition::class, $req->id);

        // Optional: Trigger notification to managers here
        // $req->notifyManagers(new RequisitionPending($req));

        return $req;
    }

    /**
     * Approve a pending requisition (with optional quantity adjustments).
     */
    public function approve(Requisition $req, User $approver, array $approvedQuantities = []): Requisition
    {
        abort_if(!$req->canBeApproved(), 422, 'This requisition is not in a submittable state.');

        return DB::transaction(function () use ($req, $approver, $approvedQuantities) {
            foreach ($approvedQuantities as $itemId => $qty) {
                $req->items()->where('id', $itemId)->update(['quantity_approved' => $qty]);
            }

            $req->update([
                'status'      => Requisition::STATUS_APPROVED,
                'approved_by' => $approver->id,
                'approved_at' => now(),
            ]);

            AuditLog::record('requisition.approved', $approver->id, Requisition::class, $req->id);
            $req->requestedBy->notify(new RequisitionApproved($req));

            return $req->fresh(['items.product']);
        });
    }

    /**
     * Issue stock against an approved requisition.
     */
    public function issue(Requisition $req, array $issuedItems, User $issuer): Requisition
    {
        abort_if(!$req->canBeIssued(), 422, 'This requisition is not ready for issuance.');

        return DB::transaction(function () use ($req, $issuedItems, $issuer) {
            foreach ($issuedItems as $itemData) {
                /** @var RequisitionItem $item */
                $item = $req->items()->where('product_id', $itemData['product_id'])->firstOrFail();

                $qtyToIssue = (int) $itemData['quantity_issued'];
                if ($qtyToIssue <= 0) continue;

                if ($qtyToIssue > $item->remaining_to_issue) {
                    throw new \DomainException("Cannot issue more than approved remaining amount.");
                }

                $item->increment('quantity_issued', $qtyToIssue);

                // This triggers the actual physical inventory deduction
                $this->stockService->stockOut(
                    product:         $item->product,
                    quantity:        $qtyToIssue,
                    user:            $issuer,
                    reason:          "Issued against REQ #{$req->requisition_number}",
                    documentRef:     $req->requisition_number,
                    transactionable: $req,
                );
            }

            $req->refresh();
            $allIssued = $req->items->every(fn ($i) => $i->isFullyIssued());
            
            $req->update([
                'status'    => $allIssued ? Requisition::STATUS_ISSUED : Requisition::STATUS_PARTIAL,
                'issued_by' => $issuer->id,
                'issued_at' => now(),
            ]);

            AuditLog::record('requisition.issued', $issuer->id, Requisition::class, $req->id);

            return $req->fresh(['items.product']);
        });
    }
}