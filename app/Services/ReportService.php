<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockTransaction;
use App\Models\PurchaseOrder;
use App\Models\Requisition;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Current inventory valuation report.
     */
    public function inventoryValuation(): array
    {
        $products = Product::active()
            ->with(['stock', 'category', 'supplier'])
            ->get();

        $rows = $products->map(function (Product $p) {
            $qty = $p->current_quantity;
            return [
                'id'                => $p->id,
                'sku'               => $p->sku,
                'name'              => $p->name,
                'category'          => $p->category->name,
                'supplier'          => $p->supplier?->name ?? 'N/A',
                'quantity_on_hand'  => $qty,
                'unit_cost'         => $p->unit_price,
                'total_value'       => round($qty * $p->unit_price, 2),
                'stock_status'      => $p->stock_status,
            ];
        });

        return [
            'items'       => $rows,
            'total_value' => $rows->sum('total_value'),
            'generated_at'=> now()->toDateTimeString(),
        ];
    }

    /**
     * Stock movement report for a date range.
     */
    public function stockMovement(Carbon $from, Carbon $to, ?int $productId = null): array
    {
        $query = StockTransaction::with(['product.category', 'performedBy'])
            ->whereBetween('transaction_date', [$from->startOfDay(), $to->endOfDay()])
            ->orderBy('transaction_date', 'desc');

        if ($productId) {
            $query->where('product_id', $productId);
        }

        return [
            'transactions' => $query->get(),
            'summary' => [
                'total_in'  => (clone $query)->inbound()->sum(DB::raw('ABS(quantity_change)')),
                'total_out' => (clone $query)->outbound()->sum(DB::raw('ABS(quantity_change)')),
                'net_change'=> $query->sum('quantity_change'),
            ],
            'period' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
        ];
    }

    /**
     * Low stock report.
     */
    public function lowStockReport(): array
    {
        $products = Product::active()
            ->with(['stock', 'category', 'supplier'])
            ->where(function ($q) {
                $q->lowStock()->orWhere(fn ($q2) => $q2->outOfStock());
            })
            ->get();

        return [
            'items'        => $products->map(fn ($p) => [
                'id'             => $p->id,
                'sku'            => $p->sku,
                'name'           => $p->name,
                'category'       => $p->category->name,
                'supplier'       => $p->supplier?->name ?? 'N/A',
                'quantity'       => $p->current_quantity,
                'reorder_level'  => $p->reorder_level,
                'reorder_qty'    => $p->reorder_quantity,
                'status'         => $p->stock_status,
            ]),
            'generated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Supplier performance report.
     */
    public function supplierPerformance(Carbon $from, Carbon $to): array
    {
        return PurchaseOrder::with('supplier')
            ->whereBetween('order_date', [$from->toDateString(), $to->toDateString()])
            ->select('supplier_id',
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_value'),
                DB::raw('SUM(CASE WHEN status = "received" THEN 1 ELSE 0 END) as completed_orders'),
                DB::raw('AVG(DATEDIFF(actual_delivery_date, order_date)) as avg_lead_days')
            )
            ->groupBy('supplier_id')
            ->with('supplier')
            ->get()
            ->toArray();
    }

    /**
     * Dashboard summary statistics.
     */
  public function dashboardStats(): array
    {
        // 1. Basic Counts
        $totalProducts    = Product::active()->count();
        $lowStockCount    = Product::active()->lowStock()->count();
        $outOfStockCount  = Product::active()->outOfStock()->count();
        
        // 2. Financial Valuation
        $totalStockValue  = Product::active()
            ->get()
            ->sum(fn ($p) => $p->current_quantity * $p->unit_price);

        // 3. Workflow Status
        $pendingPOs    = PurchaseOrder::where('status', 'pending_approval')->count();
        $pendingReqs   = Requisition::where('status', 'pending')->count();

        // 4. Recent Activity (for the left panel)
        $recentTransactions = StockTransaction::with(['product', 'performedBy'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'product_name' => $t->product->name,
                'change' => $t->quantity_change,
                'type' => $t->quantity_change > 0 ? 'IN' : 'OUT',
                'user' => $t->performedBy->name ?? 'System',
                'date' => $t->created_at->diffForHumans(),
            ]);

        // 5. Unresolved Alerts (for the right panel)
        $unresolvedAlerts = Product::active()
            ->lowStock()
            ->limit(8)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'product_name' => $p->name,
                'current_stock' => $p->current_quantity,
                'threshold' => $p->low_stock_threshold,
            ]);

        return [
            'total_products'      => $totalProducts,
            'low_stock_count'     => $lowStockCount,
            'out_of_stock_count'  => $outOfStockCount,
            'total_stock_value'   => round($totalStockValue, 2),
            'pending_po_count'    => $pendingPOs,
            'pending_req_count'   => $pendingReqs,
            'recent_transactions' => $recentTransactions,
            'unresolved_alerts'   => $unresolvedAlerts,
        ];
    }

    /**
     * Monthly stock movement trend (last 12 months).
     */
   public function monthlyMovementTrend(): array
{
    return StockTransaction::select(
            DB::raw("strftime('%Y', transaction_date) as year"),
            DB::raw("strftime('%m', transaction_date) as month"),
            DB::raw('SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_in'),
            DB::raw('SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_out')
        )
        ->where('transaction_date', '>=', now()->subMonths(12))
        ->groupBy('year', 'month')
        ->orderBy('year')
        ->orderBy('month')
        ->get()
        ->toArray();
}
   
    public function topMovingProducts(int $limit = 10): array
{
    return StockTransaction::select(
            'product_id',
            DB::raw('SUM(ABS(quantity_change)) as total_movement')
        )
        ->with('product')
        ->groupBy('product_id')
        ->orderByDesc('total_movement')
        ->limit($limit)
        ->get()
        ->map(function ($row) {
            return [
                'product_id' => $row->product_id,
                'product_name' => $row->product->name,
                'sku' => $row->product->sku,
                'movement' => $row->total_movement,
            ];
        })
        ->toArray();
}

public function stockConsumptionForecast(): array
{
    $products = Product::active()->with('stock')->get();

    return $products->map(function ($p) {

        $monthlyUsage = StockTransaction::where('product_id', $p->id)
            ->where('quantity_change', '<', 0)
            ->where('transaction_date', '>=', now()->subMonths(3))
            ->sum(DB::raw('ABS(quantity_change)')) / 3;

        $monthsRemaining = $monthlyUsage > 0
            ? round($p->current_quantity / $monthlyUsage, 2)
            : null;

        return [
            'product_id' => $p->id,
            'name' => $p->name,
            'current_stock' => $p->current_quantity,
            'monthly_usage' => round($monthlyUsage, 2),
            'months_remaining' => $monthsRemaining,
        ];
    });
}

public function categoryDistribution(): array
{
    return Product::select(
            'category_id',
            DB::raw('SUM(unit_price * quantity_on_hand) as total_value')
        )
        ->with('category')
        ->groupBy('category_id')
        ->get()
        ->map(function ($row) {
            return [
                'category' => $row->category->name,
                'total_value' => round($row->total_value, 2),
            ];
        })
        ->toArray();
}

}