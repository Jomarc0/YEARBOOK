<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User; // O 'Student' model depende sa table mo
use App\Models\Faculty;

class StudentController extends Controller
{
    /**
     * Handles API search requests for users (students and faculty).
     * This method is typically used by a frontend search bar to provide real-time suggestions.
     *
     * @param Request $request The incoming HTTP request, containing the search query.
     * @return \Illuminate\Support\Collection A collection of formatted user data (id, name, subtext, image).
     */
    public function apiSearch(Request $request)
{
    $query = $request->input('query');

    // Maghanap ng users (students o faculty) sa 'name' o 'student_id' column.
    // Limitahan sa 6 na resulta para sa mabilis na pagpapakita ng suggestions.
    $users = User::where('name', 'LIKE', "%{$query}%")
                ->orWhere('student_id', 'LIKE', "%{$query}%")
                ->take(6)
                ->get();

    // I-format ang bawat user para sa pagpapakita sa frontend.
    return $users->map(function ($u) {
        // Tukuyin ang subtext batay sa role ng user (faculty o student).
        $displaySubtext = ($u->role == 'faculty') 
            ? "Faculty • ({$u->teaching_start} - {$u->teaching_end})" 
            : ($u->course ?? 'Student');

        return [
            'id' => $u->id,
            'name' => $u->name,
            'subtext' => $displaySubtext,
            'image' => 'https://ui-avatars.com/api/?name='.urlencode($u->name)
        ];
    });
}
    /**
     * Handles general search requests for both students and faculty.
     * This method is typically used for a dedicated search page or a more comprehensive search.
     *
     * @param Request $request The incoming HTTP request, containing the search query.
     * @return \Illuminate\Http\JsonResponse A JSON response containing separate lists of students and faculties.
     */
public function search(Request $request)
{
    // Kunin ang search query mula sa request
    $query = $request->input('query');

    // 1. Maghanap sa Students (Users table)
    $students = User::where('role', 'student')
                    ->where('name', 'LIKE', "%{$query}%")
                    ->get();

    // 2. Maghanap sa Teachers (Faculties table)
    $faculties = Faculty::where('name', 'LIKE', "%{$query}%")
                        ->orWhere('department', 'LIKE', "%{$query}%")
                        ->get();

    // Isama silang dalawa sa response
    return response()->json([
        'students' => $students,
        'faculties' => $faculties
    ]);
}
}