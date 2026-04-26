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

class ManagerDashboardService
{
    /**
     * Get manager-focused dashboard data.
     */
    public function getDashboardData(User $user): array
    {
        return [
            'key_metrics' => $this->getKeyMetrics(),
            'approval_queue' => $this->getApprovalQueue($user),
            'procurement_metrics' => $this->getProcurementMetrics($user),
            'stock_overview' => $this->getStockOverview(),
            'recent_transactions' => $this->getRecentTransactions(),
            'budget_status' => $this->getBudgetStatus(),
        ];
    }

    /**
     * Get key operational metrics for manager.
     */
    private function getKeyMetrics(): array
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        return [
            'pending_approvals' => [
                'purchase_orders' => PurchaseOrder::where('status', 'pending_approval')->count(),
                'requisitions' => Requisition::where('status', 'pending_approval')->count(),
                'total' => PurchaseOrder::where('status', 'pending_approval')->count() +
                           Requisition::where('status', 'pending_approval')->count(),
            ],
            'todays_activity' => [
                'po_created' => PurchaseOrder::whereDate('created_at', $today)->count(),
                'requisitions_created' => Requisition::whereDate('created_at', $today)->count(),
                'stock_movements' => StockTransaction::whereDate('transaction_date', $today)->count(),
            ],
            'monthly_summary' => [
                'po_value_approved' => round(PurchaseOrder::where('status', 'approved')
                    ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
                    ->sum('total_value'), 2),
                'requisitions_issued' => Requisition::where('status', 'issued')
                    ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
                    ->count(),
            ],
        ];
    }

    /**
     * Get approval queue for manager.
     */
    public function getApprovalQueue(User $user): array
    {
        $pendingPOs = PurchaseOrder::where('status', 'pending_approval')
            ->with(['supplier', 'items.product', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (PurchaseOrder $po) {
                return [
                    'id' => $po->id,
                    'type' => 'Purchase Order',
                    'supplier' => $po->supplier->name,
                    'total_value' => round($po->total_value, 2),
                    'item_count' => $po->items->count(),
                    'created_by' => $po->createdBy->name,
                    'created_at' => $po->created_at,
                    'priority' => $po->total_value > 50000 ? 'HIGH' : 'NORMAL',
                ];
            });

        $pendingReqs = Requisition::where('status', 'pending_approval')
            ->with(['requestedBy', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (Requisition $req) {
                return [
                    'id' => $req->id,
                    'type' => 'Requisition',
                    'department' => $req->requestedBy->name,
                    'item_count' => $req->items->count(),
                    'created_by' => $req->requestedBy->name,
                    'created_at' => $req->created_at,
                    'priority' => 'NORMAL',
                ];
            });

        $queue = collect($pendingPOs)->merge($pendingReqs);
        return $queue->sortByDesc('created_at')->values()->toArray();
    }

    /**
     * Get procurement metrics and supplier performance.
     */
    public function getProcurementMetrics(User $user): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $currentMonthPOs = PurchaseOrder::where('status', 'approved')
            ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
            ->get();

        $previousMonthPOs = PurchaseOrder::where('status', 'approved')
            ->whereBetween('created_at', [$lastMonth, $lastMonth->copy()->endOfMonth()])
            ->get();

        $currentMonthValue = round($currentMonthPOs->sum('total_value'), 2);
        $previousMonthValue = round($previousMonthPOs->sum('total_value'), 2);
        $momGrowth = $previousMonthValue > 0 
            ? round((($currentMonthValue - $previousMonthValue) / $previousMonthValue) * 100, 2)
            : 0;

        // Supplier performance
        $supplierPerformance = DB::table('purchase_orders')
            ->join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
            ->where('purchase_orders.status', 'approved')
            ->whereBetween('purchase_orders.created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
            ->select('suppliers.id', 'suppliers.name', DB::raw('COUNT(*) as order_count'), 
                     DB::raw('SUM(purchase_orders.total_value) as total_value'))
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total_value')
            ->limit(5)
            ->get();

        return [
            'current_month_value' => $currentMonthValue,
            'previous_month_value' => $previousMonthValue,
            'growth_percentage' => $momGrowth,
            'current_month_orders' => $currentMonthPOs->count(),
            'on_target' => $currentMonthValue >= ($previousMonthValue * 0.8),
            'top_suppliers' => $supplierPerformance->map(function ($supplier) {
                return [
                    'name' => $supplier->name,
                    'orders_count' => $supplier->order_count,
                    'total_value' => round($supplier->total_value, 2),
                    'avg_order_value' => round($supplier->total_value / $supplier->order_count, 2),
                ];
            })->toArray(),
        ];
    }

    /**
     * Get stock overview for manager.
     */
    private function getStockOverview(): array
    {
        $totalValue = Product::active()->sum(DB::raw('current_quantity * unit_price'));
        $lowStockCount = Product::active()->lowStock()->count();
        $outOfStockCount = Product::active()->outOfStock()->count();

        $topMovingProducts = StockTransaction::with(['product.category'])
            ->whereDate('transaction_date', '>=', Carbon::now()->subDays(30))
            ->select('product_id', DB::raw('ABS(SUM(quantity_change)) as total_movement'))
            ->groupBy('product_id')
            ->orderByDesc('total_movement')
            ->limit(5)
            ->get();

        return [
            'total_inventory_value' => round($totalValue, 2),
            'low_stock_items' => $lowStockCount,
            'out_of_stock_items' => $outOfStockCount,
            'top_moving_products' => $topMovingProducts->map(function ($tx) {
                return [
                    'product_name' => $tx->product?->name,
                    'category' => $tx->product?->category?->name,
                    'movement' => (int)$tx->total_movement,
                ];
            })->toArray(),
        ];
    }

    /**
     * Get recent transactions.
     */
    private function getRecentTransactions(): array
    {
        return StockTransaction::with(['product.category', 'performedBy'])
            ->whereDate('transaction_date', '>=', Carbon::now()->subDays(7))
            ->orderBy('transaction_date', 'desc')
            ->limit(15)
            ->get()
            ->map(function (StockTransaction $tx) {
                return [
                    'id' => $tx->id,
                    'product' => $tx->product->name,
                    'category' => $tx->product->category->name,
                    'type' => $tx->type->value,
                    'quantity' => $tx->quantity_change,
                    'performed_by' => $tx->performedBy->name,
                    'date' => $tx->transaction_date->format('M d, Y'),
                    'time' => $tx->transaction_date->format('H:i'),
                ];
            })
            ->toArray();
    }

    /**
     * Get budget status.
     */
    private function getBudgetStatus(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $monthlySpend = PurchaseOrder::where('status', 'approved')
            ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
            ->sum('total_value');

        $estimatedBudget = 100000; // This should come from config
        
        return [
            'monthly_spend' => round($monthlySpend, 2),
            'estimated_budget' => $estimatedBudget,
            'percentage_used' => round(($monthlySpend / $estimatedBudget) * 100, 2),
            'remaining' => round($estimatedBudget - $monthlySpend, 2),
        ];
    }
}
