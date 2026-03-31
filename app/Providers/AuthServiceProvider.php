<?php

namespace App\Providers;

use App\Models\PurchaseOrder;
use App\Models\Requisition;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\RequisitionPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Requisition::class => RequisitionPolicy::class,
        PurchaseOrder::class => PurchaseOrderPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
