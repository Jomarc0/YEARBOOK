<?php

namespace App\Jobs\Yearbook;

use App\Events\YearbookGenerated;
use App\Models\Batch;
use App\Models\Yearbook;
use App\Services\Yearbook\YearbookGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateYearbookPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int   $tries   = 3;
    public int   $timeout = 600;
    public array $backoff = [30, 120, 300];

    public function __construct(
        public Yearbook $yearbook,
        public Batch    $batch,
    ) {}

    /**
     * Execute the job.
     * FIX: Use Log facade instead of logger() helper — eliminates "Expected object, found null" warning
     */
    public function handle(YearbookGeneratorService $generator): void
    {
        Log::info("GenerateYearbookPdf: Starting for batch {$this->batch->id}");

        $pdfPath = $generator->generatePdf($this->yearbook, $this->batch);

        Log::info("GenerateYearbookPdf: PDF saved to {$pdfPath}");

        event(new YearbookGenerated($this->yearbook, $this->batch, $pdfPath));
    }

    /**
     * Handle a job failure.
     * FIX: Use Log facade instead of logger() helper
     */
    public function failed(Throwable $exception): void
    {
        Log::error("GenerateYearbookPdf: Failed for batch {$this->batch->id}", [
            'error' => $exception->getMessage(),
        ]);

        $this->yearbook->update(['status' => 'failed']);
    }
}