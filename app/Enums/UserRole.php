<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin      = 'admin';
    case Manager    = 'manager';
    case StoreClerk = 'store_clerk';

    public function label(): string
    {
        return match($this) {
            self::Admin      => 'Administrator',
            self::Manager    => 'Manager',
            self::StoreClerk => 'Store Clerk',
        };
    }

    public function permissions(): array
    {
        return match($this) {
          self::Admin => [
            'users.manage', 'products.manage', 'categories.manage',
           'suppliers.manage', 'stock.manage', 'stock.record',
           'purchase_orders.manage', 'purchase_orders.create', 'purchase_orders.approve', 
           'requisitions.manage', 'requisitions.approve','requisitions.create',
           'reports.view', 'audit_logs.view', 'settings.manage','products.view', 'products.create', 'products.edit', 'purchase_orders.reject','purchase_orders.receive',
],
            self::Manager => [
                'products.view', 'products.create', 'products.edit',
                'categories.view', 'suppliers.view', 'suppliers.manage',
                'stock.view', 'stock.adjust',
                'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.approve',
                'requisitions.view', 'requisitions.approve',
                'reports.view', 'audit_logs.view','purchase_orders.receive'
            ],
            self::StoreClerk => [
                'products.view', 'categories.view', 'suppliers.view',
                'stock.view', 'stock.record',
                'purchase_orders.view', 'purchase_orders.create',
                'requisitions.view', 'requisitions.create', 'purchase_orders.approve',
                'reports.view','audit_logs.view','purchase_orders.receive'
            ],
        };
    }

    public function can(string $permission): bool
    {
        return in_array($permission, $this->permissions());
    }
}
