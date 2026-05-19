<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class YearbookController extends Controller
{
    public function exportStudentPdf(Request $request, int $userId)
    {
        // Load section + achievements + tagged photos for the PDF
        $user = User::with(['section', 'achievements', 'taggedPhotos'])
            ->findOrFail($userId);

        $pdf = Pdf::loadView('pdf.student-profile', [
            'user'         => $user,
            'achievements' => $user->achievements,
            'photos'       => $user->taggedPhotos->take(6),
        ])->setPaper('a4');

        return $pdf->download("profile-{$user->student_id}.pdf");
    }

    public function exportCertificate(Request $request)
    {
        $user = $request->user();
        $pdf  = Pdf::loadView('pdf.graduation-certificate', [
            'user' => $user,
            'date' => now()->format('F j, Y'),
        ])->setPaper('a4', 'landscape');
        return $pdf->download("certificate-{$user->name}.pdf");
    }

    public function flipbookData()
    {
        $students = User::with('section')
            ->whereNotNull('student_id')
            ->orderBy('name')
            ->get(['id', 'name', 'student_id', 'course', 'bio', 'profile_picture']);

        return response()->json($students);
    }
}