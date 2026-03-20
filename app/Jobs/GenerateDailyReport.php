<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\DailyInventoryReport;
use App\Services\ReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;

/**
 * Scheduled job: send daily inventory summary to managers and admins.
 */
class GenerateDailyReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(ReportService $reportService): void
    {
        $stats = $reportService->dashboardStats();
        $lowStock = $reportService->lowStockReport();

        $recipients = User::whereIn('role', ['admin', 'manager'])
            ->where('is_active', true)
            ->get();

        Notification::send($recipients, new DailyInventoryReport($stats, $lowStock));
    }
}
