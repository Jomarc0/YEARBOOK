<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class YearbookController extends Controller
{
    public function exportStudentPdf(Request $request, int $userId)
    {
        $user = User::with(['section', 'achievements', 'taggedPhotos'])
            ->findOrFail($userId);

        $achievements = $user->achievements ?? collect();
        $photos       = ($user->taggedPhotos ?? collect())->take(6);

        $pdf = Pdf::loadView('pdf.student-profile', [
            'user'         => $user,
            'achievements' => $achievements,
            'photos'       => $photos,
        ])->setPaper('a4');

        return $pdf->download("profile-{$user->student_id}.pdf");
    }

    public function exportCertificate(Request $request)
    {
        $user = $request->user();

        $pdf = Pdf::loadView('pdf.graduation-certificate', [
            'user' => $user,
            'date' => now()->format('F j, Y'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download("certificate-{$user->name}.pdf");
    }

    /**
     * GET /api/yearbook/flipbook
     *
     * Returns all students for the FlipbookViewer.
     *
     * Fixes:
     *  1. Added section_id to select so the section relationship loads correctly
     *  2. Resolves profile_picture to full URL (Cloudinary or local storage)
     *     so FlipbookViewer <img> tags work without extra logic in the frontend
     */
    public function flipbookData()
    {
        $storageRoot = rtrim((string) config('app.url', 'http://127.0.0.1:8000'), '/');

        $students = User::with('section')
            ->where('role', 'student')
            ->whereNotNull('student_id')
            ->orderBy('name')
            ->get(['id', 'name', 'student_id', 'section_id', 'course', 'bio', 'profile_picture'])
            ->map(function ($user) use ($storageRoot) {
                $pic = $user->profile_picture;

                // Resolve to full URL — handles Cloudinary (absolute) and local paths
                if ($pic && ! str_starts_with($pic, 'http')) {
                    $pic = "{$storageRoot}/storage/{$pic}";
                }

                return [
                    'id'              => $user->id,
                    'name'            => $user->name,
                    'student_id'      => $user->student_id,
                    'course'          => $user->course,
                    'bio'             => $user->bio,
                    'profile_picture' => $pic,   // always null or a full URL
                    'section'         => $user->section ? [
                        'id'   => $user->section->id,
                        'name' => $user->section->name,
                    ] : null,
                ];
            });

        return response()->json($students);
    }
}