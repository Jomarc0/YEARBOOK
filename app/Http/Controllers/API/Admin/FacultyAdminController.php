<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\AuditLog;
use App\Models\Faculty;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\Request;

class FacultyAdminController extends Controller
{
    use AuditsAdminActions;

    private Cloudinary $cloudinary;

    public function __construct()
    {
        Configuration::instance([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key'    => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ],
            'url' => ['secure' => true],
        ]);

        $this->cloudinary = new Cloudinary();
    }

    // GET /api/admin/faculty
    public function index(Request $request)
    {
        $query = Faculty::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name',       'like', "%{$search}%")
                  ->orWhere('title',      'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 4);
        $faculty = $query->orderBy('name')->paginate($perPage);
        $faculty->getCollection()->transform(fn ($f) => $this->formatRecord($f));

        return response()->json($faculty);
    }

    // POST /api/admin/faculty
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'title'      => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'bio'        => 'nullable|string',
            'image'      => 'nullable|image|max:4096',
            'email'      => 'nullable|email|max:255',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadToCloudinary(
                $request->file('image')->getRealPath(),
                'faculty'
            );
        }

        $faculty = Faculty::create($data);

        $this->audit(
            AuditLog::ACTION_FACULTY_ADDED,
            "Added faculty member '{$faculty->name}' ({$faculty->department}) ID #{$faculty->id}.",
            AuditLog::STATUS_SUCCESS,
            null,
            $faculty->id,
            "faculty#{$faculty->id}",
        );

        return response()->json($this->formatRecord($faculty), 201);
    }

    // PUT /api/admin/faculty/{id}
    public function update(Request $request, int $id)
    {
        $faculty = Faculty::findOrFail($id);

        $data = $request->validate([
            'name'       => 'sometimes|required|string|max:255',
            'title'      => 'sometimes|required|string|max:255',
            'department' => 'sometimes|required|string|max:255',
            'bio'        => 'nullable|string',
            'image'      => 'nullable|image|max:4096',
            'email'      => 'nullable|email|max:255',
        ]);

        if ($request->hasFile('image')) {
            if ($faculty->image && ! str_starts_with($faculty->image, 'http')) {
                $this->deleteFromCloudinary($faculty->image);
            }
            $data['image'] = $this->uploadToCloudinary(
                $request->file('image')->getRealPath(),
                'faculty'
            );
        }

        $faculty->update($data);

        $this->audit(
            AuditLog::ACTION_USER_UPDATED,
            "Updated faculty member '{$faculty->name}' ID #{$faculty->id}. Fields: " . implode(', ', array_keys($data)),
            AuditLog::STATUS_SUCCESS,
            null,
            $faculty->id,
            "faculty#{$faculty->id}",
        );

        return response()->json($this->formatRecord($faculty));
    }

    // DELETE /api/admin/faculty/{id}
    public function destroy(int $id)
    {
        $faculty = Faculty::findOrFail($id);
        $snapshot = "{$faculty->name} (ID #{$id})";

        $faculty->delete();

        $this->audit(
            AuditLog::ACTION_FACULTY_REMOVED,
            "Moved faculty member '{$snapshot}' to trash.",
            AuditLog::STATUS_WARNING,
            null,
            $id,
            "faculty#{$id}",
        );

        return response()->json(['message' => 'Faculty member moved to trash.']);
    }

    // POST /api/admin/faculty/import-csv
    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:4096',
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if (! $handle) {
            return response()->json(['message' => 'Unable to read CSV file.'], 422);
        }

        $headers = fgetcsv($handle);
        $imported = 0;
        $skipped = 0;
        $errors = [];

        if (! is_array($headers)) {
            fclose($handle);
            return response()->json(['imported' => 0, 'skipped' => 0, 'errors' => ['CSV header row is missing.']], 422);
        }

        $headers = array_map(fn ($h) => strtolower(trim((string) $h)), $headers);

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, array_pad($row, count($headers), null));
            if (! is_array($data)) {
                $skipped++;
                $errors[] = 'Skipped row with invalid column count.';
                continue;
            }

            $name = trim((string) ($data['name'] ?? ''));
            if ($name === '') {
                $skipped++;
                continue;
            }

            $email = trim((string) ($data['email'] ?? ''));
            if ($email !== '' && Faculty::where('email', $email)->exists()) {
                $skipped++;
                continue;
            }

            Faculty::create([
                'name'       => $name,
                'title'      => trim((string) ($data['title'] ?? 'Faculty')),
                'department' => trim((string) ($data['department'] ?? 'General')),
                'email'      => $email !== '' ? $email : null,
                'bio'        => trim((string) ($data['bio'] ?? '')) ?: null,
            ]);

            $imported++;
        }

        fclose($handle);

        return response()->json([
            'imported' => $imported,
            'skipped'  => $skipped,
            'errors'   => $errors,
        ]);
    }

    // Private helpers
    private function formatRecord(Faculty $f): array
    {
        return [
            'id'         => $f->id,
            'name'       => $f->name,
            'title'      => $f->title,
            'department' => $f->department,
            'bio'        => $f->bio,
            'photo'      => $this->resolveImageUrl($f->image),
            'email'      => $f->email,
        ];
    }

    private function uploadToCloudinary(string $filePath, string $folder): string
    {
        $result = $this->cloudinary->uploadApi()->upload($filePath, [
            'folder'         => $folder,
            'resource_type'  => 'image',
            'transformation' => [
                ['width' => 400, 'height' => 400, 'crop' => 'fill', 'gravity' => 'face'],
            ],
        ]);

        return $result['public_id'];
    }

    private function deleteFromCloudinary(string $publicId): void
    {
        try {
            $this->cloudinary->uploadApi()->destroy($publicId);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('FacultyAdminController: Cloudinary delete failed', [
                'public_id' => $publicId,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    private function resolveImageUrl(?string $image): ?string
    {
        if (blank($image)) return null;

        if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
            return $image;
        }

        try {
            return (string) $this->cloudinary->image($image)->toUrl();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('FacultyAdminController: could not resolve image URL', [
                'image' => $image,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
