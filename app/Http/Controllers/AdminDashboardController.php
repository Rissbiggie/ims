<?php

namespace App\Http\Controllers;

use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function __construct(private readonly AdminDashboardService $service) {}

    /**
     * Get comprehensive dashboard data for admin users.
     * Shows system-wide overview, user activity, and critical metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $this->service->getDashboardData($user);

        return response()->json($data);
    }

    /**
     * Get user activity and audit logs.
     */
    public function userActivity(Request $request): JsonResponse
    {
        $user = $request->user();
        $activity = $this->service->getUserActivity($user);

        return response()->json($activity);
    }

    /**
     * Get system health and statistics.
     */
    public function systemHealth(Request $request): JsonResponse
    {
        $user = $request->user();
        $health = $this->service->getSystemHealth($user);

        return response()->json($health);
    }
}
