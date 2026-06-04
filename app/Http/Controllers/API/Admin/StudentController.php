<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\AuditLog;
use App\Models\Section;
use App\Models\Student;
use App\Services\Storage\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    use AuditsAdminActions;

    public function __construct(private CloudinaryService $cloudinary) {}

    // ── GET /api/admin/sections/{section}/students ─────────────────────────

    public function index(Request $request, Section $section): JsonResponse
    {
        $query = Student::where('section_id', $section->id)
            ->with('userAccount:id,student_record_id,email,email_verified,created_at');

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

        // Append has_registered flag to each student for the admin panel UI
        $students->getCollection()->transform(function (Student $student) {
            $student->append([]);   // clear default appends
            return array_merge($student->toArray(), [
                'has_registered' => ! is_null($student->userAccount),
                'registered_at'  => $student->userAccount?->created_at?->format('M d, Y'),
            ]);
        });

        return response()->json($students);
    }

    // ── POST /api/admin/sections/{section}/students ────────────────────────

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

        $this->audit(
            AuditLog::ACTION_USER_CREATED,
            "Added student '{$student->first_name} {$student->last_name}' (No. {$student->student_no}) to section '{$section->name}'.",
            AuditLog::STATUS_SUCCESS,
            null,
            $student->id,
            "student#{$student->id}",
        );

        return response()->json(['message' => 'Student added.', 'data' => $student], 201);
    }

    // ── PUT /api/admin/sections/{section}/students/{student} ──────────────

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

        // If a registered user is linked, invalidate their cached profile
        // so they see the updated yearbook data immediately.
        if ($student->userAccount) {
            cache()->forget('students.api.' . $student->userAccount->id . '.*');
        }

        $this->audit(
            AuditLog::ACTION_USER_UPDATED,
            "Updated student '{$student->first_name} {$student->last_name}' (No. {$student->student_no}) in section '{$section->name}'.",
            AuditLog::STATUS_SUCCESS,
            null,
            $student->id,
            "student#{$student->id}",
        );

        return response()->json(['message' => 'Student updated.', 'data' => $student->fresh()]);
    }

    // ── DELETE /api/admin/sections/{section}/students/{student} ───────────

    public function destroy(Section $section, Student $student): JsonResponse
    {
        $snapshot = "{$student->first_name} {$student->last_name} (No. {$student->student_no})";

        // If a user is linked, unlink them first so they become a browse account
        // rather than having a dangling FK.
        if ($student->userAccount) {
            $student->userAccount->update(['student_record_id' => null]);
        }

        $student->delete();

        $this->audit(
            AuditLog::ACTION_STUDENT_DELETED,
            "Moved student '{$snapshot}' from section '{$section->name}' to trash.",
            AuditLog::STATUS_WARNING,
            null,
            $student->id,
            "student#{$student->id}",
        );

        return response()->json(['message' => 'Student moved to trash.']);
    }

    // ── POST /api/admin/sections/{section}/students/import ────────────────

    public function import(Request $request, Section $section): JsonResponse
    {
        $request->validate(['students' => 'required|array', 'students.*' => 'array']);

        $imported = 0;
        $skipped  = 0;

        foreach ($request->students as $row) {
            $no = trim($row['student_no'] ?? '');
            if (! $no) { $skipped++; continue; }

            $student = Student::updateOrCreate(
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

            // If a user already registered with this student_no + name,
            // auto-link them to the newly imported record.
            $this->autoLinkUser($student);

            $imported++;
        }

        $this->audit(
            AuditLog::ACTION_IMPORT,
            "Bulk imported {$imported} student(s) into section '{$section->name}' ({$skipped} skipped).",
            AuditLog::STATUS_SUCCESS,
        );

        return response()->json([
            'message'  => "{$imported} students imported, {$skipped} skipped.",
            'imported' => $imported,
            'skipped'  => $skipped,
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * After importing a student, check if a user registered with matching
     * name + student_no but has no link yet (student_record_id IS NULL).
     * If found, link them automatically.
     */
    private function autoLinkUser(Student $student): void
    {
        \App\Models\User::whereNull('student_record_id')
            ->whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower(trim($student->first_name))])
            ->whereRaw('LOWER(TRIM(last_name)) = ?',  [strtolower(trim($student->last_name))])
            ->where(function ($q) use ($student) {
                // Match users who registered with this student_no
                // (stored as a string before the migration, now we match by name only
                //  since student_id column is dropped — this is a best-effort link)
                $q->whereNull('student_record_id');
            })
            ->update([
                'student_record_id' => $student->id,
                'section_id'        => $student->section_id,
                'batch_id'          => $student->batch_id,
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