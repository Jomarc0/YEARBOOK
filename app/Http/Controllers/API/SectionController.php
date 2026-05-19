<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\User;

class SectionController extends Controller
{
    public function index()
    {
        $sections = Section::withCount('students')
            ->with(['students' => function ($query) {
                $query->select('id', 'name', 'profile_picture', 'section_id')
                      ->take(5);
            }])
            ->get();

        return response()->json($sections);
    }

    public function show(int $id)
    {
        $section = Section::with(['students' => function ($query) {
            $query->orderBy('name');
        }])->findOrFail($id);

        $students = User::where('section_id', $id)
                        ->orderBy('name')
                        ->paginate(30);

        return response()->json([
            'section'  => $section,
            'students' => $students,
        ]);
    }
}