<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyInventoryReport extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly array $stats,
        private readonly array $lowStock,
    ) {}

    public function via(object $notifiable): array { return ['mail']; }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Daily Inventory Report — ' . now()->toFormattedDateString())
            ->greeting("Good morning, {$notifiable->name}!")
            ->line('Here is your daily inventory summary:')
            ->line("Total Products: {$this->stats['total_products']}")
            ->line("Low Stock Items: {$this->stats['low_stock_count']}")
            ->line("Out of Stock Items: {$this->stats['out_of_stock_count']}")
            ->line("Total Stock Value: KES " . number_format($this->stats['total_stock_value'], 2))
            ->line("Pending Purchase Orders: {$this->stats['pending_po_count']}")
            ->line("Pending Requisitions: {$this->stats['pending_req_count']}");

        if (!empty($this->lowStock['items'])) {
            $mail->line('');
            $mail->line('⚠️ Items needing attention:');
            foreach (array_slice($this->lowStock['items'], 0, 5) as $item) {
                $mail->line("• {$item['name']} (SKU: {$item['sku']}) — Qty: {$item['quantity']}");
            }
        }

        return $mail->action('Open Dashboard', url('/dashboard'));
    }
}
