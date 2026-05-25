<?php

namespace App\Services\Yearbook;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use setasign\Fpdi\Fpdi;

class WatermarkService
{
    public function apply(string $sourcePath, string $userName, int $userId): string
    {
        $watermarkText = "{$userName} · #{$userId} · Downloaded " . now()->format('M d, Y');

        $sourceBytes  = Storage::get($sourcePath);
        $overlayHtml  = $this->buildOverlayHtml($watermarkText);
        $overlayPdf   = Pdf::loadHTML($overlayHtml)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'helvetica',
            ])
            ->output();

        $watermarkedBytes = $this->mergePdfs($sourceBytes, $overlayPdf);

        $outputPath = 'yearbooks/watermarked/' . Str::uuid() . '.pdf';
        Storage::put($outputPath, $watermarkedBytes);

        dispatch(function () use ($outputPath) {
            Storage::delete($outputPath);
        })->delay(now()->addMinutes(10));

        return $outputPath;
    }

    protected function buildOverlayHtml(string $text): string
    {
        $escaped = htmlspecialchars($text);

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 0; }
                body { margin:0; padding:0; width:210mm; height:297mm; position:relative; overflow:hidden; }
                .watermark-layer {
                    position:absolute; top:0; left:0; width:100%; height:100%;
                    display:flex; flex-wrap:wrap; align-items:center; justify-content:center;
                    opacity:0.08; pointer-events:none;
                }
                .watermark-text {
                    font-family:helvetica,sans-serif; font-size:11pt; color:#000;
                    white-space:nowrap; transform:rotate(-35deg); margin:28mm 4mm; letter-spacing:0.05em;
                }
            </style>
        </head>
        <body>
            <div class="watermark-layer">
                {$this->repeatWatermarkText($escaped, 18)}
            </div>
        </body>
        </html>
        HTML;
    }

    protected function repeatWatermarkText(string $text, int $count): string
    {
        $html = '';
        for ($i = 0; $i < $count; $i++) {
            $html .= "<span class=\"watermark-text\">{$text}</span>";
        }
        return $html;
    }

    protected function mergePdfs(string $sourceBytes, string $overlayBytes): string
    {
        // FIX: Use class constant instead of string — IDE now knows the type
        if (! class_exists(Fpdi::class)) {
            // FIX: Log facade instead of logger() helper — no "null" warning
            Log::warning(
                'WatermarkService: FPDI not installed — watermark skipped. ' .
                'Run: composer require setasign/fpdi'
            );
            return $sourceBytes;
        }

        $tmpSource  = tempnam(sys_get_temp_dir(), 'yb_src_') . '.pdf';
        $tmpOverlay = tempnam(sys_get_temp_dir(), 'yb_wm_')  . '.pdf';

        file_put_contents($tmpSource,  $sourceBytes);
        file_put_contents($tmpOverlay, $overlayBytes);

        try {
            // FIX: Typed as Fpdi directly — IDE now knows Output() exists
            $fpdi      = new Fpdi();
            $pageCount = $fpdi->setSourceFile($tmpSource);

            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $fpdi->importPage($i);
                $size       = $fpdi->getTemplateSize($templateId);

                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($templateId);

                $fpdi->setSourceFile($tmpOverlay);
                $wmTemplate = $fpdi->importPage(1);
                $fpdi->useTemplate($wmTemplate, 0, 0, $size['width'], $size['height']);

                $fpdi->setSourceFile($tmpSource);
            }

            $output = $fpdi->Output('S');

        } finally {
            @unlink($tmpSource);
            @unlink($tmpOverlay);
        }

        return $output;
    }
}