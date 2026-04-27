<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Requisition;
use App\Models\StockAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    /**
     * Get comprehensive dashboard data for admin.
     * System-wide overview with critical metrics and alerts.
     */
    public function getDashboardData(User $user): array
    {
        return [
            'overview' => $this->getSystemOverview(),
            'critical_metrics' => $this->getCriticalMetrics(),
            'recent_activity' => $this->getRecentActivity(),
            'user_statistics' => $this->getUserStatistics(),
            'financial_summary' => $this->getFinancialSummary(),
            'system_health' => $this->getSystemHealth($user),
            'alerts' => $this->getCriticalAlerts(),
        ];
    }

    /**
     * Get system-wide overview.
     */
 // app/Services/AdminDashboardService.php
// app/Services/AdminDashboardService.php

private function getSystemOverview(): array
{
    // 1. Basic count
    $totalProducts = Product::where('is_active', true)->count();

    // 2. Total Value (using quantity_on_hand)
    $totalValue = Product::where('is_active', true)
        ->selectRaw('SUM(quantity_on_hand * unit_price) as total_val')
        ->value('total_val') ?? 0;

    // 3. Low Stock (quantity_on_hand <= minimum_stock)
    $lowStockCount = Product::where('is_active', true)
        ->whereColumn('quantity_on_hand', '<=', 'minimum_stock')
        ->where('quantity_on_hand', '>', 0)
        ->count();

    // 4. Out of Stock
    $outOfStockCount = Product::where('is_active', true)
        ->where('quantity_on_hand', '<=', 0)
        ->count();

    return [
        'total_products' => $totalProducts,
        'total_inventory_value' => round((float)$totalValue, 2),
        'low_stock_items' => $lowStockCount,
        'out_of_stock_items' => $outOfStockCount,
        'inventory_health' => $this->calculateInventoryHealth($lowStockCount, $outOfStockCount, $totalProducts),
    ];
}

    /**
     * Get critical metrics for admin visibility.
     */
    private function getCriticalMetrics(): array
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        return [
            'pending_approvals' => [
                'purchase_orders' => PurchaseOrder::where('status', 'pending_approval')->count(),
                'requisitions' => Requisition::where('status', 'pending_approval')->count(),
            ],
            'daily_transactions' => [
                'stock_in' => DB::table('stock_transactions')
                    ->whereDate('transaction_date', $today)
                    ->where('type', 'stock_in')
                    ->count(),
                'stock_out' => DB::table('stock_transactions')
                    ->whereDate('transaction_date', $today)
                    ->where('type', 'stock_out')
                    ->count(),
            ],
            'monthly_transactions' => [
                'stock_in' => DB::table('stock_transactions')
                    ->whereBetween('transaction_date', [$thisMonth, $thisMonth->copy()->endOfMonth()])
                    ->where('type', 'stock_in')
                    ->count(),
                'stock_out' => DB::table('stock_transactions')
                    ->whereBetween('transaction_date', [$thisMonth, $thisMonth->copy()->endOfMonth()])
                    ->where('type', 'stock_out')
                    ->count(),
            ],
            'rejected_orders' => PurchaseOrder::where('status', 'rejected')
                ->whereDate('updated_at', '>=', Carbon::now()->subDays(30))
                ->count(),
        ];
    }

    /**
     * Get recent system activity.
     */
    private function getRecentActivity(): array
    {
        $recentLogs = AuditLog::with('user')
            ->latest()
            ->take(20)
            ->get()
            ->map(function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user' => $log->user?->name,
                    'model' => class_basename($log->model_type),
                    'timestamp' => $log->created_at,
                    'description' => $this->humanizeAction($log),
                ];
            });

        return $recentLogs->toArray();
    }

    /**
     * Get user statistics.
     */
private function getUserStatistics(): array
{
    $activeUsers = User::where('is_active', true)->count();
    $inactiveUsers = User::where('is_active', false)->count();

    // Use DB query directly for the count to avoid Enum casting issues during grouping
    $loginStats = DB::table('users')
        ->select('role', DB::raw('COUNT(*) as count'))
        ->where('is_active', true)
        ->groupBy('role')
        ->get()
        ->pluck('count', 'role')
        ->toArray();

    return [
        'total_active' => $activeUsers,
        'total_inactive' => $inactiveUsers,
        'by_role' => $loginStats,
        'last_24h_logins' => User::where('last_login_at', '>=', Carbon::now()->subDay())->count(),
        'last_7d_logins' => User::where('last_login_at', '>=', Carbon::now()->subDays(7))->count(),
    ];
}

    /**
     * Get financial summary.
     */
 private function getFinancialSummary(): array
{
    $thisMonth = \Carbon\Carbon::now()->startOfMonth();

    $poTotal = \App\Models\PurchaseOrder::where('status', 'approved')
        ->whereBetween('created_at', [$thisMonth, $thisMonth->copy()->endOfMonth()])
        ->sum('total_value');

    // 5. Current Inventory Value (using quantity_on_hand)
    $inventoryValue = Product::where('is_active', true)
        ->selectRaw('SUM(quantity_on_hand * unit_price) as total_val')
        ->value('total_val') ?? 0;

    return [
        'monthly_po_value' => round($poTotal, 2),
        'current_inventory_value' => round((float)$inventoryValue, 2),
        'avg_monthly_po_cost' => $this->getAverageMonthlyPOCost(),
    ];
}
    /**
     * Get system health and performance metrics.
     */
    public function getSystemHealth(User $user): array
    {
        $totalAlerts = StockAlert::unresolved()->count();
        $criticalAlerts = StockAlert::unresolved()
            ->whereHas('product', fn ($q) => $q->outOfStock())
            ->count();

        return [
            'stock_alerts' => [
                'total_unresolved' => $totalAlerts,
                'critical_count' => $criticalAlerts,
                'warning_count' => $totalAlerts - $criticalAlerts,
            ],
            'data_integrity' => $this->checkDataIntegrity(),
            'last_backup' => 'Automated',
        ];
    }

    /**
     * Get user activity logs.
     */
    public function getUserActivity(User $user): array
    {
        $sevenDaysAgo = Carbon::now()->subDays(7);

        return [
            'recent_logins' => User::where('last_login_at', '>=', $sevenDaysAgo)
                ->select('id', 'name', 'email', 'role', 'last_login_at', 'last_login_ip')
                ->orderBy('last_login_at', 'desc')
                ->take(20)
                ->get(),
            'audit_trail' => AuditLog::where('created_at', '>=', $sevenDaysAgo)
                ->with('user')
                ->latest()
                ->take(50)
                ->get(),
        ];
    }

    /**
     * Get critical alerts.
     */
    private function getCriticalAlerts(): array
    {
        return StockAlert::unresolved()
            ->with('product.category')
            ->latest()
            ->take(10)
            ->get()
            ->map(function (StockAlert $alert) {
                return [
                    'id' => $alert->id,
                    'product' => $alert->product->name,
                    'severity' => $alert->product->outOfStock() ? 'CRITICAL' : 'WARNING',
                    'message' => $alert->message,
                    'created_at' => $alert->created_at,
                ];
            })
            ->toArray();
    }

    /**
     * Helper: Calculate inventory health percentage.
     */
    private function calculateInventoryHealth(int $lowStock, int $outOfStock, int $total): int
    {
        if ($total === 0) return 100;
        $healthyItems = $total - $lowStock - $outOfStock;
        return round(($healthyItems / $total) * 100);
    }

    /**
     * Helper: Get average monthly PO cost.
     */
    private function getAverageMonthlyPOCost(): float
    {
        $last6Months = collect(range(0, 5))->map(function ($i) {
            $month = Carbon::now()->subMonths($i);
            return PurchaseOrder::where('status', 'approved')
                ->whereBetween('created_at', [$month->startOfMonth(), $month->endOfMonth()])
                ->sum('total_value');
        });

        return round($last6Months->average(), 2);
    }

    /**
     * Helper: Check data integrity.
     */
    private function checkDataIntegrity(): array
    {
        $products = Product::active()->count();
        $transactions = DB::table('stock_transactions')->count();

        return [
            'status' => 'healthy',
            'total_records' => $products + $transactions,
            'products' => $products,
            'transactions' => $transactions,
        ];
    }

    /**
     * Helper: Humanize audit log actions.
     */
    private function humanizeAction(AuditLog $log): string
    {
        $action = str_replace('_', ' ', $log->action);
        $action = str_replace('.', ' · ', $action);
        return ucfirst($action);
    }
}
