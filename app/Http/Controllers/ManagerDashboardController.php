<?php

namespace App\Http\Controllers;

use App\Services\ManagerDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManagerDashboardController extends Controller
{
    public function __construct(private readonly ManagerDashboardService $service) {}

    /**
     * Get manager-focused dashboard data.
     * Focuses on procurement, approvals, and key business metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $this->service->getDashboardData($user);

        return response()->json($data);
    }

    /**
     * Get approval queue for manager.
     */
    public function approvalQueue(Request $request): JsonResponse
    {
        $user = $request->user();
        $queue = $this->service->getApprovalQueue($user);

        return response()->json($queue);
    }

    /**
     * Get procurement metrics and supplier performance.
     */
    public function procurementMetrics(Request $request): JsonResponse
    {
        $user = $request->user();
        $metrics = $this->service->getProcurementMetrics($user);

        return response()->json($metrics);
    }
}
