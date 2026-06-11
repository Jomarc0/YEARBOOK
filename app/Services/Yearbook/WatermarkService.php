<?php

namespace App\Services\Yearbook;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WatermarkService
{
    public function apply(string $sourcePath, string $userName, int $userId): string
    {
        if (! Storage::exists($sourcePath)) {
            return $sourcePath;
        }

        $sourceBytes = Storage::get($sourcePath);
        $outputBytes = $this->mergePdfs($sourceBytes);

        $outputPath = 'yearbooks/watermarked/' . Str::uuid() . '.pdf';
        Storage::put($outputPath, $outputBytes);

        dispatch(function () use ($outputPath) {
            Storage::delete($outputPath);
        })->delay(now()->addMinutes(15));

        return $outputPath;
    }

    private function mergePdfs(string $sourceBytes): string
    {
        if (! class_exists(\setasign\Fpdi\Fpdi::class)) {
            Log::warning('WatermarkService: FPDI not installed. Run: composer require setasign/fpdi setasign/fpdf');
            return $sourceBytes;
        }

        $tmpSrc = tempnam(sys_get_temp_dir(), 'yb_src_') . '.pdf';
        file_put_contents($tmpSrc, $sourceBytes);

        try {
            $fpdi = $this->makePdf();
            $pageCount = $fpdi->setSourceFile($tmpSrc);

            for ($i = 1; $i <= $pageCount; $i++) {
                $fpdi->setSourceFile($tmpSrc);
                $tplId = $fpdi->importPage($i);
                $size = $fpdi->getTemplateSize($tplId);

                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $fpdi->AddPage($orientation, [$size['width'], $size['height']]);

                $fpdi->useTemplate($tplId, 0, 0, $size['width'], $size['height']);
                $this->drawWatermark($fpdi, (float) $size['width'], (float) $size['height']);
            }

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
        }
    }

    private function makePdf(): \setasign\Fpdi\Fpdi
    {
        return new class extends \setasign\Fpdi\Fpdi {
            protected array $extgstates = [];

            public function setAlpha(float $alpha, string $blendMode = 'Normal'): void
            {
                $graphicsState = $this->addExtGState([
                    'ca' => $alpha,
                    'CA' => $alpha,
                    'BM' => '/' . $blendMode,
                ]);
                $this->setExtGState($graphicsState);
            }

            protected function addExtGState(array $parameters): int
            {
                $this->extgstates[] = ['parms' => $parameters];
                return count($this->extgstates);
            }

            protected function setExtGState(int $graphicsState): void
            {
                $this->_out(sprintf('/GS%d gs', $graphicsState));
            }

            protected function _enddoc(): void
            {
                if (! empty($this->extgstates) && $this->PDFVersion < '1.4') {
                    $this->PDFVersion = '1.4';
                }

                parent::_enddoc();
            }

            protected function _putextgstates(): void
            {
                foreach ($this->extgstates as $index => $extgstate) {
                    $this->_newobj();
                    $this->extgstates[$index]['n'] = $this->n;
                    $this->_put('<</Type /ExtGState');

                    foreach ($extgstate['parms'] as $key => $value) {
                        $this->_put('/' . $key . ' ' . $value);
                    }

                    $this->_put('>>');
                    $this->_put('endobj');
                }
            }

            protected function _putresourcedict(): void
            {
                parent::_putresourcedict();

                if (empty($this->extgstates)) {
                    return;
                }

                $this->_put('/ExtGState <<');
                foreach ($this->extgstates as $index => $extgstate) {
                    $this->_put(sprintf('/GS%d %d 0 R', $index + 1, $extgstate['n']));
                }
                $this->_put('>>');
            }

            protected function _putresources(): void
            {
                $this->_putextgstates();
                parent::_putresources();
            }
        };
    }

    private function drawWatermark(\setasign\Fpdi\Fpdi $pdf, float $width, float $height): void
    {
        $fontSize = min(340, max(220, $width * 1.05));
        $text = 'NU';

        if (method_exists($pdf, 'setAlpha')) {
            $pdf->setAlpha(0.22);
        }

        $pdf->SetFont('Helvetica', 'B', $fontSize);
        $pdf->SetTextColor(253, 184, 19);
        $textWidth = $pdf->GetStringWidth($text);
        $x = max(0, ($width - $textWidth) / 2);
        $y = ($height / 2) + (($fontSize * 0.352778) / 3);
        $pdf->Text($x, $y, $text);

        if (method_exists($pdf, 'setAlpha')) {
            $pdf->setAlpha(1);
        }
    }
}
