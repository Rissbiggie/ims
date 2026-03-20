<?php

namespace App\Notifications;

use App\Models\Requisition;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequisitionIssued extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Requisition $req) {}

    public function via(object $notifiable): array { return ['mail', 'database']; }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Requisition #{$this->req->requisition_number} Issued")
            ->line("All items for your requisition #{$this->req->requisition_number} have been issued.")
            ->action('View Requisition', url("/requisitions/{$this->req->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return ['type' => 'requisition_issued', 'req_id' => $this->req->id];
    }
}
