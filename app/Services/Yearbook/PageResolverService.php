<?php

namespace App\Services\Yearbook;

use App\Models\Batch;
use App\Models\User;

class PageResolverService
{
    private const PREAMBLE = 4; // cover + dedication + toc×2

    /**
     * Returns the page index where a student appears in their batch yearbook.
     */
    public function getPageIndex(int $userId, int $batchId): int
    {
        $batch = Batch::with(['sections.students' => function ($q) {
            $q->select('id', 'name', 'section_id')->orderBy('name');
        }])->findOrFail($batchId);

        $cursor = self::PREAMBLE;

        foreach ($batch->sections as $section) {
            $cursor += 2; // section-header left + right

            foreach ($section->students->chunk(4) as $chunk) {
                if ($chunk->contains('id', $userId)) {
                    return $cursor;
                }
                $cursor += 2; // student-grid + student-quotes
            }
        }

        return 0; // fallback → cover
    }

    /**
     * Returns the first student on a given yearbook page.
     */
    public function getUserAtPage(int $batchId, int $pageIndex): ?User
    {
        if ($pageIndex < self::PREAMBLE) {
            return null; // cover / dedication / toc
        }

        $batch = Batch::with(['sections.students' => function ($q) {
            $q->select('id', 'name', 'section_id')->orderBy('name');
        }])->find($batchId);

        if (!$batch) {
            return null;
        }

        $cursor = self::PREAMBLE;

        foreach ($batch->sections as $section) {
            $cursor += 2; // section-header spread

            foreach ($section->students->chunk(4) as $chunk) {
                if ($pageIndex === $cursor || $pageIndex === $cursor + 1) {
                    return User::with(['batchRecord', 'careerProfile'])
                        ->find($chunk->first()?->id);
                }
                $cursor += 2;
            }
        }

        return null;
    }
}