<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Product $product,
        private readonly string $alertType,
        private readonly int $currentQuantity,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = match($this->alertType) {
            'out_of_stock' => 'OUT OF STOCK',
            'low_stock'    => 'LOW STOCK WARNING',
            'overstock'    => 'OVERSTOCK WARNING',
            default        => 'STOCK ALERT',
        };

        return (new MailMessage)
            ->subject("IMS Alert: {$label} — {$this->product->name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$label}: {$this->product->name} (SKU: {$this->product->sku})")
            ->line("Current Quantity: {$this->currentQuantity}")
            ->line("Reorder Level: {$this->product->reorder_level}")
            ->action('View Product', url("/products/{$this->product->id}"))
            ->line('Please take appropriate action.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'             => $this->alertType,
            'product_id'       => $this->product->id,
            'product_name'     => $this->product->name,
            'product_sku'      => $this->product->sku,
            'current_quantity' => $this->currentQuantity,
            'reorder_level'    => $this->product->reorder_level,
        ];
    }
}
