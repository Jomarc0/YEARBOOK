<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
use App\Services\Storage\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function index(Request $request, Section $section): JsonResponse
    {
        $query = Student::where('section_id', $section->id);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name',  'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('student_no', 'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%");
            });
        }

        $students = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($request->get('per_page', 200));

        return response()->json($students);
    }

    public function store(Request $request, Section $section): JsonResponse
    {
        $validated = $request->validate($this->rules());

        if ($request->hasFile('photo')) {
            $result = $this->cloudinary->uploadPhoto(
                file:   $request->file('photo'),
                userId: Auth::id(),
                folder: 'students/photos',
            );

            $validated['photo']           = $result['secure_url'];
            $validated['photo_public_id'] = $result['public_id'];
        }

        $student = Student::create([
            ...$validated,
            'section_id' => $section->id,
            'batch_id'   => $section->batch_id,
        ]);

        return response()->json(['message' => 'Student added.', 'data' => $student], 201);
    }

    public function update(Request $request, Section $section, Student $student): JsonResponse
    {
        $validated = $request->validate($this->rules($student->id));

        if ($request->hasFile('photo')) {
            if ($student->photo_public_id) {
                $this->cloudinary->deletePhoto($student->photo_public_id);
            }

            $result = $this->cloudinary->uploadPhoto(
                file:   $request->file('photo'),
                userId: Auth::id(),
                folder: 'students/photos',
            );

            $validated['photo']           = $result['secure_url'];
            $validated['photo_public_id'] = $result['public_id'];
        }

        $student->update($validated);

        return response()->json(['message' => 'Student updated.', 'data' => $student->fresh()]);
    }

    public function destroy(Section $section, Student $student): JsonResponse
    {
        if ($student->photo_public_id) {
            $this->cloudinary->deletePhoto($student->photo_public_id);
        }

        $student->delete();

        return response()->json(['message' => 'Student removed.']);
    }

    public function import(Request $request, Section $section): JsonResponse
    {
        $request->validate(['students' => 'required|array', 'students.*' => 'array']);

        $imported = 0;
        $skipped  = 0;

        foreach ($request->students as $row) {
            $no = trim($row['student_no'] ?? '');
            if (!$no) { $skipped++; continue; }

            Student::updateOrCreate(
                ['student_no' => $no],
                [
                    'first_name'  => trim($row['first_name']  ?? ''),
                    'last_name'   => trim($row['last_name']   ?? ''),
                    'middle_name' => trim($row['middle_name'] ?? '') ?: null,
                    'email'       => trim($row['email']       ?? '') ?: null,
                    'honors'      => trim($row['honors']      ?? '') ?: null,
                    'section_id'  => $section->id,
                    'batch_id'    => $section->batch_id,
                ]
            );
            $imported++;
        }

        return response()->json([
            'message'  => "{$imported} students imported, {$skipped} skipped.",
            'imported' => $imported,
            'skipped'  => $skipped,
        ]);
    }

    private function rules(int $ignoreId = null): array
    {
        return [
            'first_name'            => 'required|string|max:255',
            'last_name'             => 'required|string|max:255',
            'middle_name'           => 'nullable|string|max:255',
            'student_no'            => 'required|string|max:50|unique:students,student_no' . ($ignoreId ? ",{$ignoreId}" : ''),
            'email'                 => 'nullable|email|max:255',
            'photo'                 => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'birthday'              => 'nullable|date',
            'hometown'              => 'nullable|string|max:255',
            'nickname'              => 'nullable|string|max:255',
            'honors'                => 'nullable|string|max:255',
            'organizations'         => 'nullable|string',
            'motto'                 => 'nullable|string|max:500',
            'student_quote'         => 'nullable|string|max:500',
            'fondest_memory'        => 'nullable|string',
            'ambition'              => 'nullable|string|max:255',
            'future_plans'          => 'nullable|string',
            'message_to_batchmates' => 'nullable|string',
            'message_to_parents'    => 'nullable|string',
            'most_likely_to'        => 'nullable|string|max:255',
            'achievements'          => 'nullable|string',
            'facebook_url'          => 'nullable|url|max:255',
            'instagram_url'         => 'nullable|url|max:255',
            'linkedin_url'          => 'nullable|url|max:255',
            'github_url'            => 'nullable|url|max:255',
        ];
    }
}