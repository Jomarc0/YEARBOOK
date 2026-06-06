<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Faculty;
use App\Models\Section;
use App\Models\Subscription;
use App\Models\User;
use App\Support\PlatformSettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Storage;

class YearbookPdfController extends Controller
{
    public function export(Request $request, int $batchId)
    {
        $batch = Batch::findOrFail($batchId);

        $faculties = Faculty::orderBy('name')
            ->get()
            ->map(fn ($faculty) => [
                'name' => $faculty->name,
                'title' => $faculty->title ?? 'Faculty',
                'department' => $faculty->department ?? '',
                'bio' => $faculty->bio ?? '',
                'email' => $faculty->email ?? '',
                'photo' => $this->resolveImageBase64($faculty->image ?? null),
            ])
            ->values()
            ->toArray();

        $facultyChunks = array_chunk($faculties, 4);

        $sections = Section::where('batch_id', $batchId)
            ->with(['students' => fn ($query) => $query->orderBy('last_name')->orderBy('first_name'), 'adviser'])
            ->get()
            ->map(function ($section) {
                $students = $section->students
                    ->map(fn ($student) => $this->mapStudentForPdf($student))
                    ->values()
                    ->toArray();

                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'course' => $section->course ?? $section->strand ?? '',
                    'adviser' => $section->adviser?->name ?? '',
                    'student_count' => count($students),
                    'students' => $students,
                    'studentChunks' => array_chunk($students, 2),
                ];
            })
            ->values()
            ->toArray();

        $settings = PlatformSettings::all();
        $schoolName = $settings['school_name'] ?? config('app.name', 'National University');
        $batchYear = $batch->year ?? now()->year;
        $yearbookTitle = $settings['yearbook_name'] ?? 'Sinag-Bughaw Yearbook';
        $classTheme = $settings['graduation_theme'] ?? 'Legacy in Motion';
        $academicYear = $settings['academic_year'] ?? null;
        $graduationDate = $settings['graduation_date'] ?? null;
        $logoBase64 = isset($settings['school_logo'])
            ? $this->resolveImageBase64($settings['school_logo'])
            : null;
        $logoBase64 ??= $this->resolvePublicImageBase64('images/NU_logo.png');
        $buildingBase64 = $this->resolvePublicImageBase64('images/NU-building.jpg');
        $galleryBase64 = $this->resolvePublicImageBase64('images/gallerynu.jpg');
        $facultyBase64 = $this->resolvePublicImageBase64('images/nufaculty.jpg');

        $students = collect($sections)->flatMap(fn ($section) => $section['students'])->values();
        $stats = [
            'total_graduates' => $students->count(),
            'sections' => count($sections),
            'honors_count' => $students->filter(fn ($student) => !empty($student['honors']))->count(),
            'achievement_count' => $students->filter(fn ($student) => !empty($student['achievements']))->count(),
            'organization_count' => $students->filter(fn ($student) => !empty($student['organizations']))->count(),
            'quote_count' => $students->filter(fn ($student) => !empty($student['quote']) || !empty($student['motto']))->count(),
            'courses' => $students->pluck('course')->filter()->countBy()->sortDesc()->toArray(),
            'honors' => $students->pluck('honors')->filter()->countBy()->sortDesc()->toArray(),
        ];

        $featured = [
            'achievements' => $this->featured($students, 'achievements', 8),
            'organizations' => $this->featured($students, 'organizations', 8),
            'memories' => $this->featured($students, 'fondest_memory', 6),
            'aspirations' => $this->featured($students, 'future_plans', 6),
            'quotes' => $this->featured($students, 'quote', 8),
        ];

        $toc = $this->buildPdfToc($sections, $faculties);

        $pdf = Pdf::loadView('pdf.yearbook-export', compact(
            'schoolName',
            'batchYear',
            'yearbookTitle',
            'classTheme',
            'academicYear',
            'graduationDate',
            'logoBase64',
            'buildingBase64',
            'galleryBase64',
            'facultyBase64',
            'facultyChunks',
            'faculties',
            'sections',
            'students',
            'stats',
            'featured',
            'toc'
        ))
            ->setPaper('A4', 'landscape')
            ->setOptions([
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Serif',
                'dpi' => 140,
                'isFontSubsettingEnabled' => true,
            ]);

        $filename = "yearbook-{$batchYear}.pdf";

        return $request->query('preview') === '1'
            ? $pdf->stream($filename)
            : $pdf->download($filename);
    }

    public function mobileExport(Request $request, int $batchId)
    {
        $token = $request->query('token');

        if (! $token) {
            abort(401, 'Missing token.');
        }

        $accessToken = PersonalAccessToken::findToken($token);
        $user = $accessToken?->tokenable;

        if (! $user instanceof User) {
            abort(401, 'Invalid token.');
        }

        if (PlatformSettings::bool('enable_premium_subscription')) {
            $subscription = Subscription::where('user_id', $user->id)->latest()->first();

            if (! $subscription?->isPremium()) {
                abort(402, 'A premium subscription is required to access this feature.');
            }
        }

        $request->setUserResolver(fn () => $user);

        return $this->export($request, $batchId);
    }

    public function flipbookData(Request $request, int $batchId)
    {
        $batch = Batch::findOrFail($batchId);

        $faculty = Faculty::orderBy('name')
            ->get()
            ->map(fn ($faculty) => [
                'id' => $faculty->id,
                'name' => $faculty->name,
                'department' => $faculty->department ?? '',
                'position' => $faculty->title ?? 'Faculty',
                'photo' => $faculty->image ? $this->resolveImageUrl($faculty->image) : null,
                'email' => $faculty->email ?? null,
                'years' => null,
            ]);

        $sections = Section::where('batch_id', $batchId)
            ->with(['students' => fn ($query) => $query->orderBy('last_name')->orderBy('first_name')])
            ->get()
            ->map(function ($section) {
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'course' => $section->course ?? '',
                    'students' => $section->students->map(fn ($student) => [
                        'id' => $student->id,
                        'name' => trim("{$student->first_name} {$student->last_name}"),
                        'student_id' => $student->student_no ?? '',
                        'quote' => $student->student_quote ?? $student->motto ?? '',
                        'photo' => $student->photo ? $this->resolveImageUrl($student->photo) : null,
                        'achievements' => $student->achievements ?? '',
                    ])->values(),
                ];
            });

        $settings = PlatformSettings::all();

        return response()->json([
            'batch' => [
                'id' => $batch->id,
                'year' => $batch->year ?? now()->year,
                'name' => $batch->name ?? "Batch {$batch->year}",
            ],
            'school' => [
                'name' => $settings['school_name'] ?? config('app.name'),
                'logo' => isset($settings['school_logo'])
                    ? $this->resolveImageUrl($settings['school_logo'])
                    : null,
            ],
            'faculty' => $faculty,
            'sections' => $sections,
        ]);
    }

    private function mapStudentForPdf($student): array
    {
        return [
            'name' => trim("{$student->first_name} {$student->last_name}"),
            'student_id' => $student->student_no ?? '',
            'email' => $student->email ?? '',
            'course' => $student->course ?? '',
            'honors' => $student->honors ?? '',
            'nickname' => $student->nickname ?? '',
            'hometown' => $student->hometown ?? '',
            'motto' => $student->motto ?? '',
            'quote' => $student->student_quote ?? '',
            'organizations' => $student->organizations ?? '',
            'achievements' => $student->achievements ?? '',
            'fondest_memory' => $student->fondest_memory ?? '',
            'ambition' => $student->ambition ?? '',
            'future_plans' => $student->future_plans ?? '',
            'message_to_batchmates' => $student->message_to_batchmates ?? '',
            'message_to_parents' => $student->message_to_parents ?? '',
            'most_likely_to' => $student->most_likely_to ?? '',
            'photo' => $this->resolveImageBase64($student->photo ?? null),
        ];
    }

    private function featured($students, string $field, int $limit): array
    {
        return collect($students)
            ->filter(fn ($student) => !empty($student[$field]))
            ->take($limit)
            ->values()
            ->toArray();
    }

    private function buildPdfToc(array $sections, array $faculties): array
    {
        $toc = [
            'Cover',
            'Table of Contents',
            'Welcome Messages',
            'Program Overview',
            'Class Statistics',
            'Achievements',
            'Organizations',
            'Memories',
            'Future Aspirations',
        ];

        foreach ($sections as $section) {
            $toc[] = $section['name'];
        }

        if (count($faculties) > 0) {
            $toc[] = 'Faculty';
        }

        $toc[] = 'Graduate Directory';
        $toc[] = 'Closing';

        return $toc;
    }

    private function resolveImageBase64(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            try {
                $contents = @file_get_contents($path);
                if (!$contents) {
                    return null;
                }

                return 'data:' . $this->guessMime($path) . ';base64,' . base64_encode($contents);
            } catch (\Throwable) {
                return null;
            }
        }

        $clean = ltrim(preg_replace('#^(storage|public)/#', '', $path), '/');

        if (Storage::disk('public')->exists($clean)) {
            $contents = Storage::disk('public')->get($clean);

            return 'data:' . $this->guessMime($clean) . ';base64,' . base64_encode($contents);
        }

        $publicPath = public_path(ltrim($path, '/'));
        if (is_file($publicPath)) {
            return 'data:' . $this->guessMime($publicPath) . ';base64,' . base64_encode(file_get_contents($publicPath));
        }

        $cloudName = config('cloudinary.cloud_name');
        if ($cloudName) {
            $url = "https://res.cloudinary.com/{$cloudName}/image/upload/{$path}";
            $contents = @file_get_contents($url);
            if ($contents) {
                return 'data:' . $this->guessMime($url) . ';base64,' . base64_encode($contents);
            }
        }

        return null;
    }

    private function resolvePublicImageBase64(string $path): ?string
    {
        $fullPath = public_path(ltrim($path, '/'));

        if (!is_file($fullPath)) {
            return null;
        }

        return 'data:' . $this->guessMime($fullPath) . ';base64,' . base64_encode(file_get_contents($fullPath));
    }

    private function resolveImageUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        $clean = ltrim(preg_replace('#^(storage|public)/#', '', $path), '/');

        if (Storage::disk('public')->exists($clean)) {
            $baseUrl = rtrim(config('filesystems.disks.public.url', url('/storage')), '/');

            return "{$baseUrl}/{$clean}";
        }

        return null;
    }

    private function guessMime(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };
    }
}
