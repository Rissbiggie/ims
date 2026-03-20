<?php

namespace App\Policies;

use App\Models\Requisition;
use App\Models\User;

class RequisitionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->can('requisitions.view');
    }

    public function view(User $user, Requisition $req): bool
    {
        return $user->role->can('requisitions.view')
            || $req->requested_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role->can('requisitions.create');
    }

    public function approve(User $user, Requisition $req): bool
    {
        return $user->role->can('requisitions.approve')
            && $req->requested_by !== $user->id;
    }

    public function issue(User $user, Requisition $req): bool
    {
        return $user->role->can('stock.record')
            && $req->status === 'approved';
    }
}
