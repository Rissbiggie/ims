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
                // FIXED: total_value -> total_amount
                'po_value_approved' => round(PurchaseOrder::where('status', 'approved')
                    ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
                    ->sum('total_amount'), 2),
                'requisitions_issued' => Requisition::where('status', 'issued')
                    ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
                    ->count(),
            ],
        ];
    }

    public function getApprovalQueue(User $user): array
    {
        return PurchaseOrder::where('status', 'pending_approval')
            ->with(['supplier', 'items.product', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (PurchaseOrder $po) {
                return [
                    'id' => $po->id,
                    'type' => 'Purchase Order',
                    'supplier' => $po->supplier->name,
                    // FIXED: total_value -> total_amount
                    'total_value' => round($po->total_amount, 2),
                    'item_count' => $po->items->count(),
                    'created_by' => $po->createdBy->name,
                    'created_at' => $po->created_at,
                    'priority' => $po->total_amount > 50000 ? 'HIGH' : 'NORMAL',
                ];
            })
            ->merge(
                Requisition::where('status', 'pending_approval')
                    ->with(['requestedBy', 'items.product'])
                    ->get()
                    ->map(fn($req) => [
                        'id' => $req->id,
                        'type' => 'Requisition',
                        'department' => $req->requestedBy->name,
                        'item_count' => $req->items->count(),
                        'created_by' => $req->requestedBy->name,
                        'created_at' => $req->created_at,
                        'priority' => 'NORMAL',
                    ])
            )
            ->sortByDesc('created_at')
            ->values()
            ->toArray();
    }

    public function getProcurementMetrics(User $user): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $currentMonthPOs = PurchaseOrder::where('status', 'approved')
            ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
            ->get();

        // FIXED: total_value -> total_amount
        $currentMonthValue = round($currentMonthPOs->sum('total_amount'), 2);
        $previousMonthValue = round(PurchaseOrder::where('status', 'approved')
            ->whereBetween('created_at', [$lastMonth, $lastMonth->copy()->endOfMonth()])
            ->sum('total_amount'), 2);

        $momGrowth = $previousMonthValue > 0 
            ? round((($currentMonthValue - $previousMonthValue) / $previousMonthValue) * 100, 2)
            : 0;

        // FIXED: Joined query using purchase_orders.total_amount
        $supplierPerformance = DB::table('purchase_orders')
            ->join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
            ->where('purchase_orders.status', 'approved')
            ->whereBetween('purchase_orders.created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
            ->select(
                'suppliers.id', 
                'suppliers.name', 
                DB::raw('COUNT(*) as order_count'), 
                DB::raw('SUM(purchase_orders.total_amount) as total_val')
            )
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total_val')
            ->limit(5)
            ->get();

        return [
            'current_month_value' => $currentMonthValue,
            'previous_month_value' => $previousMonthValue,
            'growth_percentage' => $momGrowth,
            'current_month_orders' => $currentMonthPOs->count(),
            'on_target' => $currentMonthValue >= ($previousMonthValue * 0.8),
            'top_suppliers' => $supplierPerformance->map(fn($s) => [
                'name' => $s->name,
                'orders_count' => $s->order_count,
                'total_value' => round($s->total_val, 2),
                'avg_order_value' => $s->order_count > 0 ? round($s->total_val / $s->order_count, 2) : 0,
            ])->toArray(),
        ];
    }

    private function getStockOverview(): array
    {
        // FIXED: current_quantity -> quantity_on_hand
        $totalValue = Product::where('is_active', true)
            ->selectRaw('SUM(quantity_on_hand * unit_price) as total_val')
            ->value('total_val') ?? 0;

        // FIXED: lowStock() check usually needs column matching
        $lowStockCount = Product::where('is_active', true)
            ->whereColumn('quantity_on_hand', '<=', 'minimum_stock')
            ->count();

        $outOfStockCount = Product::where('is_active', true)
            ->where('quantity_on_hand', '<=', 0)
            ->count();

        return [
            'total_inventory_value' => round((float)$totalValue, 2),
            'low_stock_items' => $lowStockCount,
            'out_of_stock_items' => $outOfStockCount,
            'top_moving_products' => [], // Populate if needed
        ];
    }

    private function getBudgetStatus(): array
    {
        $thisMonth = Carbon::now()->startOfMonth();
        // FIXED: total_value -> total_amount
        $monthlySpend = PurchaseOrder::where('status', 'approved')
            ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
            ->sum('total_amount');

        $estimatedBudget = 100000; 
        
        return [
            'monthly_spend' => round($monthlySpend, 2),
            'estimated_budget' => $estimatedBudget,
            'percentage_used' => $estimatedBudget > 0 ? round(($monthlySpend / $estimatedBudget) * 100, 2) : 0,
            'remaining' => round($estimatedBudget - $monthlySpend, 2),
        ];
    }

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



}