<?php

namespace App\Http\Controllers;

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
}
