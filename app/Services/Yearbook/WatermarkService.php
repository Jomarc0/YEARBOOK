<?php

namespace App\Services\Yearbook;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * WatermarkService
 * app/Services/Yearbook/WatermarkService.php
 *
 * Applies a per-user diagonal watermark to every page of a generated PDF.
 *
 * Strategy:
 *   1. Read the source PDF from Storage.
 *   2. Build a transparent watermark overlay page using DOMPDF.
 *   3. Merge the overlay onto every page using FPDI (if installed).
 *      Falls back gracefully to returning the source PDF unmodified
 *      if FPDI is not available — so the app never crashes.
 *   4. Save the watermarked PDF to a temp path, schedule deletion
 *      after 15 minutes, and return the temp path for streaming.
 *
 * Install:
 *   composer require barryvdh/laravel-dompdf
 *   composer require setasign/fpdi          ← for page-level merge
 *
 * Usage (already called in YearbookController@download):
 *   $path = $this->watermark->apply(
 *       sourcePath: $yearbook->pdf_path,
 *       userName:   $user->name,
 *       userId:     $user->id,
 *   );
 */
class WatermarkService
{
    /**
     * Apply a diagonal repeating watermark to every page of the PDF.
     *
     * @param  string $sourcePath  Storage-relative path to the source PDF
     * @param  string $userName    Authenticated user's full name
     * @param  int    $userId      Authenticated user's DB id
     * @return string              Storage-relative path to the watermarked copy
     */
    public function apply(string $sourcePath, string $userName, int $userId): string
    {
        // If source doesn't exist just return it — controller handles 404
        if (! Storage::exists($sourcePath)) {
            return $sourcePath;
        }

        $watermarkText = "{$userName} · #{$userId} · " . now()->format('M d, Y H:i');

        $sourceBytes  = Storage::get($sourcePath);
        $overlayBytes = $this->buildOverlayPdf($watermarkText);

        // Try FPDI merge; fall back to source-only
        $outputBytes = $this->mergePdfs($sourceBytes, $overlayBytes);

        // Save to a private temp path
        $outputPath = 'yearbooks/watermarked/' . Str::uuid() . '.pdf';
        Storage::put($outputPath, $outputBytes);

        // Auto-delete after 15 minutes — users download immediately
        dispatch(function () use ($outputPath) {
            Storage::delete($outputPath);
        })->delay(now()->addMinutes(15));

        return $outputPath;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Build a transparent single-page watermark overlay using DOMPDF.
     * The page is A4 portrait; text repeats in a diagonal tile pattern.
     */
    private function buildOverlayPdf(string $text): string
    {
        $escaped = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
        $tiles   = $this->repeatTile($escaped, 20);

        $html = <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { margin: 0; size: A4; }
            * { box-sizing: border-box; }
            body {
              margin: 0; padding: 0;
              width: 210mm; height: 297mm;
              overflow: hidden; position: relative;
            }
            .watermark-layer {
              position: absolute;
              top: -40mm; left: -40mm;
              width: 320mm; height: 400mm;
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              opacity: 0.07;
              transform: rotate(-35deg);
              transform-origin: center center;
              pointer-events: none;
            }
            .wm-text {
              font-family: Helvetica, Arial, sans-serif;
              font-size: 10pt;
              color: #000000;
              white-space: nowrap;
              padding: 14mm 6mm;
              letter-spacing: 0.04em;
            }
          </style>
        </head>
        <body>
          <div class="watermark-layer">{$tiles}</div>
        </body>
        </html>
        HTML;

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'helvetica',
                'dpi'                  => 96,
            ])
            ->output();
    }

    /** Repeat the watermark span N times for full-page tiling. */
    private function repeatTile(string $text, int $count): string
    {
        $span = "<span class=\"wm-text\">{$text}</span>";
        return str_repeat($span, $count);
    }

    /**
     * Merge watermark overlay onto every page of the source PDF.
     *
     * Requires: composer require setasign/fpdi setasign/fpdf
     *
     * setasign/fpdi alone has no Output() — it must extend FPDF or TCPDF.
     * We use the FPDF pairing (setasign/fpdi + setasign/fpdf) which is
     * lightweight and has no conflicts with barryvdh/laravel-dompdf.
     *
     * Output is captured via Output('S') on the FPDF-backed instance,
     * which returns the PDF as a raw string.
     */
    private function mergePdfs(string $sourceBytes, string $overlayBytes): string
    {
        if (! class_exists(\setasign\Fpdi\Fpdi::class)) {
            Log::warning('WatermarkService: FPDI not installed. Watermark skipped. Run: composer require setasign/fpdi setasign/fpdf');
            return $sourceBytes;
        }

        $tmpSrc = tempnam(sys_get_temp_dir(), 'yb_src_') . '.pdf';
        $tmpWm  = tempnam(sys_get_temp_dir(), 'yb_wm_')  . '.pdf';

        file_put_contents($tmpSrc, $sourceBytes);
        file_put_contents($tmpWm,  $overlayBytes);

        try {
            // setasign\Fpdi\Fpdi extends setasign\Fpdf\Fpdf when
            // setasign/fpdf is installed — Output('S') is then available.
            $fpdi      = new \setasign\Fpdi\Fpdi();
            $pageCount = $fpdi->setSourceFile($tmpSrc);

            for ($i = 1; $i <= $pageCount; $i++) {
                $tplId = $fpdi->importPage($i);
                $size  = $fpdi->getTemplateSize($tplId);

                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $fpdi->AddPage($orientation, [$size['width'], $size['height']]);

                // Draw original page content
                $fpdi->useTemplate($tplId, 0, 0, $size['width'], $size['height']);

                // Overlay the watermark page
                $fpdi->setSourceFile($tmpWm);
                $wmTpl = $fpdi->importPage(1);
                $fpdi->useTemplate($wmTpl, 0, 0, $size['width'], $size['height']);

                // Reset source pointer for next iteration
                $fpdi->setSourceFile($tmpSrc);
            }

            // 'S' = return as string (available because FPDI extends FPDF here)
            $result = $fpdi->Output('S');

            if (! is_string($result) || strlen($result) === 0) {
                Log::warning('WatermarkService: Output() returned empty, falling back to source.');
                return $sourceBytes;
            }

            return $result;

        } catch (\Throwable $e) {
            Log::error('WatermarkService merge failed: ' . $e->getMessage());
            return $sourceBytes;
        } finally {
            @unlink($tmpSrc);
            @unlink($tmpWm);
        }
    }
}