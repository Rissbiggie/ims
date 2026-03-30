<?php

namespace App\Http\Controllers;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $service) {}

    public function inventoryValuation(): JsonResponse
    {
        return response()->json($this->service->inventoryValuation());
    }

    public function stockMovement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from'       => ['required', 'date'],
            'to'         => ['required', 'date', 'after_or_equal:from'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
        ]);

        return response()->json(
            $this->service->stockMovement(
                Carbon::parse($data['from']),
                Carbon::parse($data['to']),
                $data['product_id'] ?? null
            )
        );
    }

    public function lowStock(): JsonResponse
    {
        return response()->json($this->service->lowStockReport());
    }

    public function supplierPerformance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to'   => ['required', 'date'],
        ]);

        return response()->json(
            $this->service->supplierPerformance(
                Carbon::parse($data['from']),
                Carbon::parse($data['to'])
            )
        );
    }

public function monthlyTrend(): JsonResponse
    {
        return response()->json($this->service->monthlyMovementTrend());
    }


    public function topProducts(ReportService $service)
{
    return response()->json($service->topMovingProducts());
}



public function forecast(ReportService $service)
{
    return response()->json($service->stockConsumptionForecast());
}



public function categoryDistribution(ReportService $service)
{
    return response()->json($service->categoryDistribution());
}
/**
 * Export the Stock Movement report to PDF.
 */
public function exportMovementPdf(Request $request)
{
    $request->validate([
        'from' => 'required|date',
        'to'   => 'required|date',
    ]);

    $from = Carbon::parse($request->from);
    $to = Carbon::parse($request->to);

    // Get data from your existing service
    $reportData = $this->service->stockMovement($from, $to);

    // Pass data to the blade view we created earlier
    $pdf = Pdf::loadView('reports.stock_movement_pdf', [
        'transactions' => $reportData['transactions'],
        'summary'      => $reportData['summary'],
        'period'       => $reportData['period'],
    ]);

    // Set paper to A4 and orientation to portrait or landscape
    $pdf->setPaper('a4', 'portrait');

    return $pdf->download("stock-movement-{$request->from}-to-{$request->to}.pdf");
}

/**
 * Export the current Inventory Valuation to PDF.
 */
public function exportValuationPdf()
{
    $data = $this->service->inventoryValuation();

    $pdf = Pdf::loadView('reports.inventory_valuation_pdf', [
        'items'        => $data['items'],
        'total_value'  => $data['total_value'],
        'generated_at' => $data['generated_at']
    ]);

    return $pdf->stream("inventory-valuation-" . now()->format('Y-m-d') . ".pdf");
}
}
