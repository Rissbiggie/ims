<?php

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\User;

class PurchaseOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->can('purchase_orders.view');
    }

    public function view(User $user, PurchaseOrder $po): bool
    {
        return $user->role->can('purchase_orders.view')
            || $po->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role->can('purchase_orders.create');
    }

    public function update(User $user, PurchaseOrder $po): bool
    {
        return $user->role->can('purchase_orders.manage')
            || ($po->created_by === $user->id && $po->status === 'draft');
    }

    public function approve(User $user, PurchaseOrder $po): bool
    {
        return $user->role->can('purchase_orders.approve');
            //&& $po->created_by !== $user->id; // Cannot approve own order
    }
     public function reject(User $user, PurchaseOrder $po): bool
   {
    return $user->role->can('purchase_orders.reject') ;
     //   && $po->created_by !== $user->id;
   }
   public function receive(User $user, PurchaseOrder $po): bool 
   {
    return $user->role->can('purchase_orders.receive') ;
   }
    public function delete(User $user, PurchaseOrder $po): bool
    {
        return $user->isAdmin() && $po->status === 'draft';
    }
}
