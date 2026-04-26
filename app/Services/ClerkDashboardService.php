<?php

namespace App\Services;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Requisition;
use App\Models\StockAlert;
use App\Models\StockTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ClerkDashboardService
{
    /**
     * Get clerk-focused dashboard data.
     * Emphasizes tasks, pending operations, and daily checklist.
     */
    public function getDashboardData(User $user): array
    {
        return [
            'todays_tasks' => $this->getTodaysTasks($user),
            'pending_operations' => $this->getPendingOperations($user),
            'quick_stats' => $this->getQuickStats(),
            'stock_alerts' => $this->getStockAlerts(),
            'recent_activity' => $this->getRecentActivity($user),
        ];
    }

    /**
     * Get today's task checklist for the clerk.
     */
    public function getTodaysTasks(User $user): array
    {
        $today = Carbon::today();
        $approvedPOs = PurchaseOrder::where('status', 'approved')
            ->whereDate('updated_at', '>=', today())
            ->with(['supplier', 'items.product'])
            ->get()
            ->map(function (PurchaseOrder $po) {
                return [
                    'id' => $po->id,
                    'task_type' => 'PO_RECEIPT',
                    'title' => "Receive PO from {$po->supplier->name}",
                    'description' => "{$po->items->count()} items - Order #{$po->id}",
                    'priority' => 'HIGH',
                    'status' => 'pending_receipt',
                    'created_at' => $po->updated_at,
                ];
            });

        $pendingRequisitions = Requisition::where('status', 'approved')
            ->whereDate('updated_at', '>=', today())
            ->with(['requestedBy', 'items.product'])
            ->get()
            ->map(function (Requisition $req) {
                return [
                    'id' => $req->id,
                    'task_type' => 'REQUISITION_ISSUE',
                    'title' => "Issue requisition to {$req->requestedBy->name}",
                    'description' => "{$req->items->count()} items needed",
                    'priority' => 'NORMAL',
                    'status' => 'pending_issuance',
                    'created_at' => $req->updated_at,
                ];
            });

        $criticalAlerts = StockAlert::unresolved()
            ->whereHas('product', fn ($q) => $q->outOfStock())
            ->with('product')
            ->get()
            ->map(function (StockAlert $alert) {
                return [
                    'id' => $alert->id,
                    'task_type' => 'STOCK_ALERT',
                    'title' => "Critical: {$alert->product->name} out of stock",
                    'description' => $alert->message,
                    'priority' => 'CRITICAL',
                    'status' => 'needs_attention',
                    'created_at' => $alert->created_at,
                ];
            });

        $tasks = collect($approvedPOs)->merge($pendingRequisitions)->merge($criticalAlerts);
        return $tasks->sortByDesc('created_at')->values()->toArray();
    }

    /**
     * Get pending stock operations.
     */
    public function getPendingOperations(User $user): array
    {
        // Stock transactions waiting for verification
        $pendingTransactions = StockTransaction::with(['product', 'performedBy'])
            ->where('verified_at', null)
            ->whereDate('transaction_date', '>=', Carbon::now()->subDays(1))
            ->orderBy('transaction_date', 'desc')
            ->limit(10)
            ->get()
            ->map(function (StockTransaction $tx) {
                $icon = $tx->type->value === 'stock_in' ? '↓' : '↑';
                $typeLabel = $tx->type->value === 'stock_in' ? 'Receiving' : 'Issuing';
                return [
                    'id' => $tx->id,
                    'type' => $typeLabel,
                    'product' => $tx->product->name,
                    'quantity' => abs($tx->quantity_change),
                    'reference' => $tx->document_reference ?? 'Manual',
                    'performed_by' => $tx->performedBy->name,
                    'date' => $tx->transaction_date->format('M d, Y H:i'),
                    'status' => 'pending_verification',
                ];
            });

        // Pending requisition items to issue
        $pendingRequisitionItems = Requisition::where('status', 'approved')
            ->with(['items.product', 'requestedBy'])
            ->get()
            ->flatMap(function (Requisition $req) {
                return $req->items->map(function ($item) use ($req) {
                    return [
                        'id' => $item->id,
                        'requisition_id' => $req->id,
                        'type' => 'Requisition Issue',
                        'product' => $item->product->name,
                        'quantity_requested' => $item->quantity,
                        'quantity_available' => $item->product->current_quantity,
                        'department' => $req->requestedBy->name,
                        'requested_at' => $req->created_at->format('M d, Y'),
                        'status' => $item->product->current_quantity >= $item->quantity ? 'ready' : 'insufficient_stock',
                    ];
                });
            })
            ->take(10);

        return [
            'stock_transactions' => $pendingTransactions->toArray(),
            'requisition_items' => $pendingRequisitionItems->toArray(),
            'total_pending_items' => $pendingTransactions->count() + $pendingRequisitionItems->count(),
        ];
    }

    /**
     * Get quick statistics for dashboard widget.
     */
    private function getQuickStats(): array
    {
        $today = Carbon::today();

        return [
            'transactions_today' => StockTransaction::whereDate('transaction_date', $today)->count(),
            'stock_in_today' => StockTransaction::where('type', 'stock_in')
                ->whereDate('transaction_date', $today)
                ->sum(DB::raw('ABS(quantity_change)')),
            'stock_out_today' => StockTransaction::where('type', 'stock_out')
                ->whereDate('transaction_date', $today)
                ->sum(DB::raw('ABS(quantity_change)')),
            'pending_requisitions' => Requisition::where('status', 'pending_approval')
                ->orWhere('status', 'approved')
                ->count(),
            'low_stock_alerts' => StockAlert::unresolved()->count(),
            'out_of_stock_items' => Product::active()->outOfStock()->count(),
        ];
    }

    /**
     * Get stock alerts relevant to clerk.
     */
    private function getStockAlerts(): array
    {
        $critical = StockAlert::unresolved()
            ->whereHas('product', fn ($q) => $q->outOfStock())
            ->with('product.category')
            ->get();

        $warning = StockAlert::unresolved()
            ->whereHas('product', fn ($q) => $q->lowStock()->where(function($q) {
                $q->where('current_quantity', '>', 0);
            }))
            ->with('product.category')
            ->get();

        return [
            'critical_count' => $critical->count(),
            'warning_count' => $warning->count(),
            'critical_alerts' => $critical->take(5)->map(function (StockAlert $alert) {
                return [
                    'id' => $alert->id,
                    'product' => $alert->product->name,
                    'sku' => $alert->product->sku,
                    'current_stock' => $alert->product->current_quantity,
                    'message' => $alert->message,
                    'severity' => 'CRITICAL',
                    'created_at' => $alert->created_at->diffForHumans(),
                ];
            })->toArray(),
            'warning_alerts' => $warning->take(5)->map(function (StockAlert $alert) {
                return [
                    'id' => $alert->id,
                    'product' => $alert->product->name,
                    'sku' => $alert->product->sku,
                    'current_stock' => $alert->product->current_quantity,
                    'reorder_level' => $alert->product->reorder_level ?? 'N/A',
                    'message' => $alert->message,
                    'severity' => 'WARNING',
                    'created_at' => $alert->created_at->diffForHumans(),
                ];
            })->toArray(),
        ];
    }

    /**
     * Get recent activity for audit trail.
     */
    private function getRecentActivity(User $user): array
    {
        $twoDaysAgo = Carbon::now()->subDays(2);

        return StockTransaction::with(['product', 'performedBy'])
            ->where('created_at', '>=', $twoDaysAgo)
            ->orderBy('transaction_date', 'desc')
            ->limit(10)
            ->get()
            ->map(function (StockTransaction $tx) {
                return [
                    'id' => $tx->id,
                    'product' => $tx->product->name,
                    'type' => $tx->type->value,
                    'quantity' => $tx->quantity_change,
                    'by' => $tx->performedBy->name,
                    'timestamp' => $tx->transaction_date->diffForHumans(),
                    'date_time' => $tx->transaction_date->format('M d, Y H:i'),
                ];
            })
            ->toArray();
    }
}
