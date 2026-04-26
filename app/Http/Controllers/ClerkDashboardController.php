<?php

namespace App\Http\Controllers;

use App\Services\ClerkDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClerkDashboardController extends Controller
{
    public function __construct(private readonly ClerkDashboardService $service) {}

    /**
     * Get clerk-focused dashboard data.
     * Focuses on today's tasks, stock operations, and pending requisitions.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $this->service->getDashboardData($user);

        return response()->json($data);
    }

    /**
     * Get today's tasks for the clerk.
     */
    public function todaysTasks(Request $request): JsonResponse
    {
        $user = $request->user();
        $tasks = $this->service->getTodaysTasks($user);

        return response()->json($tasks);
    }

    /**
     * Get stock operations pending this clerk's action.
     */
    public function pendingOperations(Request $request): JsonResponse
    {
        $user = $request->user();
        $operations = $this->service->getPendingOperations($user);

        return response()->json($operations);
    }
}
