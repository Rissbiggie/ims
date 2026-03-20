<?php

namespace App\Console;

use App\Jobs\GenerateDailyReport;
use App\Jobs\RunStockLevelCheck;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Run stock level check every hour
        $schedule->job(new RunStockLevelCheck)->hourly()
                 ->withoutOverlapping()
                 ->onFailure(function () {
                     \Log::error('RunStockLevelCheck job failed.');
                 });

        // Send daily report at 8:00 AM
        $schedule->job(new GenerateDailyReport)->dailyAt('08:00')
                 ->withoutOverlapping();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
