<?php

namespace App\Notifications;

use App\Models\PurchaseOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseOrderApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly PurchaseOrder $po) {}

    public function via(object $notifiable): array { return ['mail', 'database']; }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Purchase Order #{$this->po->order_number} Approved")
            ->line("Your purchase order #{$this->po->order_number} has been approved.")
            ->line("Supplier: {$this->po->supplier->name}")
            ->line("Total: KES " . number_format($this->po->total_amount, 2))
            ->action('View Order', url("/purchase-orders/{$this->po->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return ['type' => 'purchase_order_approved', 'po_id' => $this->po->id,
                'order_number' => $this->po->order_number];
    }
}

// ────────────────────────────────────────────────────────────────────────────

/*namespace App\Notifications;

use App\Models\PurchaseOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;*/

class PurchaseOrderReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly PurchaseOrder $po) {}

    public function via(object $notifiable): array { return ['mail', 'database']; }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Purchase Order #{$this->po->order_number} Fully Received")
            ->line("All items for PO #{$this->po->order_number} have been received.")
            ->action('View Order', url("/purchase-orders/{$this->po->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return ['type' => 'purchase_order_received', 'po_id' => $this->po->id];
    }
}
