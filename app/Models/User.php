<?php

namespace App\Models;

use App\Enums\UserRole;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens,HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'is_active', 'phone', 'address',
        'last_login_at', 'last_login_ip',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'role'              => UserRole::class,
        ];
    }

    // ─── Role Helpers ────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    
    public function isManager(): bool
    {
        return $this->role === UserRole::Manager;
    }

    public function isStoreClerk(): bool
    {
        return $this->role === UserRole::StoreClerk;
    }

    public function hasRole(UserRole ...$roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function canApprove(): bool
    {
        return $this->hasRole(UserRole::Admin, UserRole::Manager);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class, 'performed_by');
    }

    public function purchaseOrdersCreated(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'created_by');
    }

    public function purchaseOrdersApproved(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'approved_by');
    }

    public function requisitionsRequested(): HasMany
    {
        return $this->hasMany(Requisition::class, 'requested_by');
    }

    public function requisitionsApproved(): HasMany
    {
        return $this->hasMany(Requisition::class, 'approved_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, UserRole $role)
    {
        return $query->where('role', $role);
    }
}
