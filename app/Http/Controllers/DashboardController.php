<?php

namespace App\Http\Controllers;

use App\Models\StockAlert;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function index(Request $request): JsonResponse
    {
        $stats  = $this->reportService->dashboardStats();
        $alerts = StockAlert::unresolved()
            ->with('product.category')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            ...$stats,
            'unresolved_alerts' => $alerts,
        ]);
    }
}
