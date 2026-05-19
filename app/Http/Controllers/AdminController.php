<?php

namespace App\Http\Controllers;

use App\Contracts\FaceRecognition;
use App\Models\Album;
use App\Models\AuditLog;
use App\Models\Faculty;
use App\Models\Photo;
use App\Models\Section;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function __construct(
        private readonly FaceRecognition $faceRecognition,
    ) {
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->session()->get('is_admin'), 403);
    }

    private function adminViewData(Request $request): array
    {
        return [
            'adminUsername' => $request->session()->get('admin_name', 'Admin User'),
            'adminRole' => $request->session()->get('admin_role', 'Super Administrator'),
            'dashboardDate' => now()->format('l, F j, Y'),
        ];
    }

    public function dashboard(Request $request): View
    {
        $this->ensureAdmin($request);

        $totalStudents = User::count();
        $totalFaculty = Faculty::count();
        $totalPhotos = Photo::count();
        $totalSections = Section::count();
        $totalAlbums = Album::count();

        $enrollmentByYear = User::query()
            ->selectRaw('YEAR(created_at) as year, COUNT(*) as total')
            ->whereNotNull('created_at')
            ->groupBy(DB::raw('YEAR(created_at)'))
            ->orderBy('year')
            ->get();

        if ($enrollmentByYear->isEmpty()) {
            $currentYear = now()->year;
            $enrollmentByYear = collect(range($currentYear - 4, $currentYear))->map(
                fn ($year) => (object) ['year' => $year, 'total' => 0]
            );
        }

        $maxEnrollment = max(1, (int) $enrollmentByYear->max('total'));

        $recentActivity = collect()
            ->merge(
                User::latest()->take(3)->get()->map(fn ($user) => [
                    'title' => 'New Student Added',
                    'subject' => $user->name,
                    'sort_at' => optional($user->created_at)?->timestamp ?? 0,
                    'time' => optional($user->created_at)->diffForHumans() ?? 'Unknown time',
                    'color' => 'green',
                    'icon' => 'fa-user',
                ])
            )
            ->merge(
                Faculty::latest()->take(2)->get()->map(fn ($faculty) => [
                    'title' => 'Faculty Profile Added',
                    'subject' => $faculty->name,
                    'sort_at' => optional($faculty->created_at)?->timestamp ?? 0,
                    'time' => optional($faculty->created_at)->diffForHumans() ?? 'Unknown time',
                    'color' => 'blue',
                    'icon' => 'fa-user-tie',
                ])
            )
            ->merge(
                Photo::latest()->take(2)->get()->map(fn ($photo) => [
                    'title' => 'Gallery Photo Uploaded',
                    'subject' => $photo->caption ?: 'Untitled photo',
                    'sort_at' => optional($photo->created_at)?->timestamp ?? 0,
                    'time' => optional($photo->created_at)->diffForHumans() ?? 'Unknown time',
                    'color' => 'orange',
                    'icon' => 'fa-image',
                ])
            )
            ->sortByDesc('sort_at')
            ->take(5)
            ->values();

        return view('admin.app.dashboard', $this->adminViewData($request) + [
            'totalStudents' => $totalStudents,
            'totalFaculty' => $totalFaculty,
            'totalPhotos' => $totalPhotos,
            'totalSections' => $totalSections,
            'totalAlbums' => $totalAlbums,
            'maxEnrollment' => $maxEnrollment,
            'enrollmentByYear' => $enrollmentByYear,
            'recentActivity' => $recentActivity,
        ]);
    }

    public function students(Request $request): View
    {
        $this->ensureAdmin($request);

        $search = trim((string) $request->query('search', ''));
        $course = trim((string) $request->query('course', ''));

        $students = User::with('section')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('course', 'like', "%{$search}%")
                        ->orWhereHas('section', function ($sectionQuery) use ($search) {
                            $sectionQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('course', 'like', "%{$search}%");
                        });
                });
            })
            ->when($course !== '', function ($query) use ($course) {
                $query->where(function ($nested) use ($course) {
                    $nested->where('course', $course)
                        ->orWhereHas('section', function ($sectionQuery) use ($course) {
                            $sectionQuery->where('course', $course);
                        });
                });
            })
            ->orderBy('student_id')
            ->orderBy('name')
            ->paginate(5)
            ->withQueryString();

        $courses = Section::query()
            ->whereNotNull('course')
            ->where('course', '!=', '')
            ->distinct()
            ->orderBy('course')
            ->pluck('course');

        return view('admin.app.students', $this->adminViewData($request) + compact('students', 'courses', 'search', 'course'));
    }

    public function createStudent(Request $request): View
    {
        $this->ensureAdmin($request);

        return view('admin.app.student-create', $this->adminViewData($request));
    }

    public function storeStudent(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'student_id' => 'required|string|unique:users,student_id',
            'course' => 'nullable|string|max:255',
        ]);

        $student = User::create([
            'name' => $validated['first_name'].' '.$validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'student_id' => $validated['student_id'],
            'course' => $validated['course'] ?? null,
        ]);

        AuditLog::record($request, 'Create Student', 'Created student account for '.$student->email);

        return redirect()->route('admin.students')->with('success', 'Student account created successfully.');
    }

    public function faculty(Request $request): View
    {
        $this->ensureAdmin($request);

        $search = trim((string) $request->query('search', ''));

        $faculties = Faculty::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(6)
            ->withQueryString();

        return view('admin.app.faculty', $this->adminViewData($request) + compact('faculties', 'search'));
    }

    public function storeFaculty(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('faculty', 'public');
        }

        $faculty = Faculty::create($validated);
        AuditLog::record($request, 'Create Faculty', 'Added faculty member '.$faculty->name);

        return redirect()->route('admin.faculty')->with('success', 'Faculty member added successfully.');
    }

    public function updateFaculty(Request $request, Faculty $faculty): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($request->hasFile('image')) {
            if ($faculty->image) {
                Storage::disk('public')->delete($faculty->image);
            }
            $validated['image'] = $request->file('image')->store('faculty', 'public');
        }

        $faculty->update($validated);
        AuditLog::record($request, 'Update Faculty', 'Updated faculty member '.$faculty->name);

        return redirect()->route('admin.faculty')->with('success', 'Faculty member updated successfully.');
    }

    public function destroyFaculty(Request $request, Faculty $faculty): RedirectResponse
    {
        $this->ensureAdmin($request);

        $name = $faculty->name;

        if ($faculty->image) {
            Storage::disk('public')->delete($faculty->image);
        }

        $faculty->delete();
        AuditLog::record($request, 'Delete Faculty', 'Deleted faculty member '.$name, 'Warning');

        return redirect()->route('admin.faculty')->with('success', 'Faculty member deleted successfully.');
    }

    public function content(Request $request): View
    {
        $this->ensureAdmin($request);

        $albums = Album::withCount('photos')->latest('event_date')->paginate(5, ['*'], 'albums_page');
        $photos = Photo::with('album')->latest()->paginate(8, ['*'], 'photos_page');

        return view('admin.app.content', $this->adminViewData($request) + [
            'albums' => $albums,
            'photos' => $photos,
            'albumOptions' => Album::orderBy('title')->get(['id', 'title']),
            'faceRecognitionEnabled' => $this->faceRecognition->isEnabled(),
        ]);
    }

    public function storeAlbum(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'event_date' => 'required|date',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($request->hasFile('cover_image')) {
            $validated['cover_image'] = $request->file('cover_image')->store('albums', 'public');
        } else {
            $validated['cover_image'] = '';
        }

        $album = Album::create($validated);
        AuditLog::record($request, 'Create Album', 'Created album '.$album->title);

        return redirect()->route('admin.content')->with('success', 'Album created successfully.');
    }

    public function storePhoto(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'album_id' => 'required|exists:albums,id',
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:6144',
            'caption' => 'nullable|string|max:255',
        ]);

        $path = $request->file('photo')->store('gallery', 'public');

        $photo = Photo::create([
            'album_id' => $validated['album_id'],
            'file_path' => $path,
            'caption' => $validated['caption'] ?? null,
        ]);

        if ($this->faceRecognition->isEnabled()) {
            try {
                $photo->update([
                    'ai_metadata' => $this->faceRecognition->analyzePhoto('public', $path),
                ]);
            } catch (\Throwable $exception) {
                Log::warning('Unable to analyze uploaded gallery photo.', [
                    'photo_id' => $photo->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        $albumTitle = optional($photo->album)->title ?? 'album';
        AuditLog::record($request, 'Upload Photo', 'Uploaded photo to '.$albumTitle);

        return redirect()->route('admin.content')->with('success', 'Photo uploaded successfully.');
    }

    public function destroyAlbum(Request $request, Album $album): RedirectResponse
    {
        $this->ensureAdmin($request);

        $title = $album->title;

        foreach ($album->photos as $photo) {
            Storage::disk('public')->delete($photo->file_path);
        }

        if ($album->cover_image) {
            Storage::disk('public')->delete($album->cover_image);
        }

        $album->delete();
        AuditLog::record($request, 'Delete Album', 'Deleted album '.$title, 'Warning');

        return redirect()->route('admin.content')->with('success', 'Album deleted successfully.');
    }

    public function destroyPhoto(Request $request, Photo $photo): RedirectResponse
    {
        $this->ensureAdmin($request);

        $caption = $photo->caption ?: 'Untitled photo';
        Storage::disk('public')->delete($photo->file_path);
        $photo->delete();

        AuditLog::record($request, 'Delete Photo', 'Deleted photo '.$caption, 'Warning');

        return redirect()->route('admin.content')->with('success', 'Photo deleted successfully.');
    }

    public function auditLogs(Request $request): View
    {
        $this->ensureAdmin($request);

        $logs = AuditLog::query()->latest('logged_at')->paginate(12);

        return view('admin.app.audit-logs', $this->adminViewData($request) + compact('logs'));
    }

    public function settings(Request $request): View
    {
        $this->ensureAdmin($request);

        $settings = [
            'site_name' => Setting::getValue('site_name', 'Sinag-Bughaw Archive System'),
            'support_email' => Setting::getValue('support_email', 'admissions@nu-lipa.edu.ph'),
            'campus_address' => Setting::getValue('campus_address', 'Km. 75 JP Laurel Highway, Brgy. Marawoy, Lipa City'),
            'allow_registration' => Setting::getValue('allow_registration', '1') === '1',
            'gallery_items_per_page' => Setting::getValue('gallery_items_per_page', '12'),
            'face_recognition_enabled' => Setting::getValue('face_recognition_enabled', '1') === '1',
            'face_recognition_threshold' => Setting::getValue('face_recognition_threshold', '90'),
            'auto_face_detection' => Setting::getValue('auto_face_detection', '1') === '1',
        ];

        return view('admin.app.settings', $this->adminViewData($request) + compact('settings'));
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'support_email' => 'required|email|max:255',
            'campus_address' => 'required|string|max:500',
            'gallery_items_per_page' => 'required|integer|min:1|max:100',
            'face_recognition_threshold' => 'nullable|integer|min:50|max:99',
        ]);

        foreach ($validated as $key => $value) {
            Setting::putValue($key, $value);
        }

        Setting::putValue('allow_registration', $request->boolean('allow_registration'));
        Setting::putValue('face_recognition_enabled', $request->boolean('face_recognition_enabled', true));
        Setting::putValue('auto_face_detection', $request->boolean('auto_face_detection', true));

        AuditLog::record($request, 'Update Settings', 'Updated system settings');

        return redirect()->route('admin.settings')->with('success', 'Settings saved successfully.');
    }
}
