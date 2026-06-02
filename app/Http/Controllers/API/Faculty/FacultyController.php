<?php

namespace App\Http\Controllers\API\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
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

    // -------------------------------------------------------------------------

    public function index()
    {
        return response()->json(Faculty::orderBy('name')->paginate(20));
    }

    // -------------------------------------------------------------------------

    public function byDepartment(Request $request)
    {
        $search = $request->query('search');

        $faculty = Faculty::query()
            ->when($search, fn($q) => $q
                ->where('name',       'like', "%{$search}%")
                ->orWhere('title',      'like', "%{$search}%")
                ->orWhere('department', 'like', "%{$search}%")
            )
            ->orderBy('department')
            ->orderBy('name')
            ->get();

        $groups = $faculty
            ->groupBy('department')
            ->map(fn($members, $dept) => [
                'id'            => $dept,
                'name'          => $dept,
                'code'          => null,
                'color'         => null,
                'description'   => null,
                'faculty_count' => $members->count(),
                'faculty'       => $members->map(fn($f) => [
                    'id'         => $f->id,
                    'name'       => $f->name,
                    'position'   => $f->title,        // alias `title` → `position`
                    'department' => $f->department,
                    'bio'        => $f->bio,
                    'email'      => $f->email,
                    'image_url'  => $this->resolveImageUrl($f->image),
                ])->values(),
            ])
            ->values();

        return response()->json(['data' => $groups]);
    }

    // -------------------------------------------------------------------------

    public function show(int $id)
    {
        $f = Faculty::findOrFail($id);

        return response()->json([
            'id'         => $f->id,
            'name'       => $f->name,
            'position'   => $f->title,
            'department' => $f->department,
            'bio'        => $f->bio,
            'email'      => $f->email,
            'image_url'  => $this->resolveImageUrl($f->image),
        ]);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Turn whatever is stored in the `image` column into a full HTTPS URL.
     *
     * Three cases the DB might contain:
     *   1. null / empty          → return null (frontend falls back to ui-avatars)
     *   2. already a full URL    → return as-is
     *   3. a Cloudinary public_id (e.g. "faculty/maria_santos" or
     *      "production/free/users/1/faculty/maria_santos") → build via SDK
     */
    private function resolveImageUrl(?string $image): ?string
    {
        if (blank($image)) {
            return null;
        }

        // Already a full URL — nothing to do
        if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
            return $image;
        }

        // Build a Cloudinary delivery URL from the public_id.
        // The SDK reads the cloud_name / api_key / api_secret we set in __construct().
        try {
            return (string) $this->cloudinary
                ->image($image)
                ->toUrl();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('FacultyController: could not resolve image URL', [
                'image' => $image,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}