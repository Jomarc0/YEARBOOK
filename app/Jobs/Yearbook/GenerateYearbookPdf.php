<?php

namespace App\Jobs\Yearbook;

use App\Models\Batch;
use App\Models\User;
use App\Models\Yearbook;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * GenerateYearbookPdf
 * app/Jobs/Yearbook/GenerateYearbookPdf.php
 *
 * Queued job — generates the full yearbook PDF from a Blade view.
 * Triggered by POST /api/yearbooks/{batch}/generate (admin only).
 *
 * Queue: 'yearbook'  (long-running — use a dedicated worker)
 *   php artisan queue:work --queue=yearbook --timeout=600
 *
 * Install: composer require barryvdh/laravel-dompdf
 */
class GenerateYearbookPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Max attempts before job is marked failed */
    public int $tries = 3;

    /** Timeout in seconds (10 min — large batches take time) */
    public int $timeout = 600;

    /** Retry delays in seconds */
    public array $backoff = [60, 180, 300];

    public function __construct(
        public Yearbook $yearbook,
        public Batch    $batch,
    ) {
        $this->onQueue('yearbook');
    }

    public function handle(): void
    {
        // Guard against null models after SerializesModels deserialization
        // (happens if the record was deleted while the job was queued)
        if (! $this->batch || ! $this->yearbook) {
            Log::warning('GenerateYearbookPdf: batch or yearbook model missing after deserialization — job aborted.');
            return;
        }

        Log::info("GenerateYearbookPdf: Starting for batch {$this->batch->id}");

        // Collect data — reuse the same logic as YearbookController@pages
        $sections = $this->batch->sections()
            ->with([
                'students' => fn ($q) => $q
                    ->select('id', 'name', 'student_id', 'course', 'bio', 'profile_picture', 'section_id')
                    ->orderBy('name'),
            ])
            ->get();

        $faculty = User::where('role', 'faculty')->get(['id', 'name', 'profile_picture']);

        $meta = [
            'title'  => $this->yearbook->title ?? 'Senior Yearbook',
            'school' => config('app.school_name', 'National University Lipa'),
            'year'   => $this->batch->year ?? now()->year,
        ];

        // Render the Blade view → HTML → DOMPDF
        $html = view('pdf.yearbook', [
            'meta'     => $meta,
            'batch'    => $this->batch,
            'sections' => $sections,
            'faculty'  => $faculty,
            'yearbook' => $this->yearbook,
        ])->render();

        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled'    => true,
                'isRemoteEnabled'         => true,   // allow Cloudinary image URLs
                'defaultFont'             => 'serif',
                'isFontSubsettingEnabled' => true,
                'dpi'                     => 150,
                'defaultPaperSize'        => 'a4',
            ]);

        // Save to private storage (never public)
        $path = "yearbooks/generated/{$this->batch->year}-{$this->batch->id}.pdf";
        Storage::put($path, $pdf->output());

        // Update yearbook record
        $this->yearbook->update([
            'pdf_path'         => $path,
            'pdf_generated_at' => now(),
            'status'           => 'published',
        ]);

        Log::info("GenerateYearbookPdf: Done — saved to {$path}");
    }

    public function failed(Throwable $e): void
    {
        // Nullsafe operator handles the case where batch/yearbook was deleted
        Log::error("GenerateYearbookPdf failed for batch {$this->batch?->id}: {$e->getMessage()}");
        $this->yearbook?->update(['status' => 'failed']);
    }
}