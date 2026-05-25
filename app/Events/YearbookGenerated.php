<?php

namespace App\Events;

use App\Models\Batch;
use App\Models\Yearbook;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class YearbookGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Yearbook $yearbook,
        public readonly Batch    $batch,
        public readonly string   $pdfPath,
    ) {}

    /**
     * Broadcast on a private channel scoped to the batch.
     * Frontend listens on: Echo.private(`yearbook.batch.{batchId}`)
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("yearbook.batch.{$this->batch->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'yearbook.generated';
    }

    public function broadcastWith(): array
    {
        return [
            'yearbook_id' => $this->yearbook->id,
            'batch_id'    => $this->batch->id,
            'batch_name'  => $this->batch->name,
            'pdf_path'    => $this->pdfPath,
            'message'     => "Yearbook PDF for {$this->batch->name} is ready.",
        ];
    }
}