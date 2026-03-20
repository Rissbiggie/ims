<?php

namespace App\Notifications;

use App\Models\Requisition;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequisitionApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Requisition $req) {}

    public function via(object $notifiable): array { return ['mail', 'database']; }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Requisition #{$this->req->requisition_number} Approved")
            ->line("Your requisition #{$this->req->requisition_number} has been approved.")
            ->line("Items will be issued to your department shortly.")
            ->action('View Requisition', url("/requisitions/{$this->req->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return ['type' => 'requisition_approved', 'req_id' => $this->req->id,
                'requisition_number' => $this->req->requisition_number];
    }
}
