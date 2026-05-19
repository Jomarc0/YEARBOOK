<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DirectoryController;
use App\Http\Controllers\FaceRecognitionController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\StudentController;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

// Siguraduhin na '/live-search' ang URL dahil ito ang hinahanap ng browser mo
Route::get('/live-search', [SearchController::class, 'search'])->name('api.search');

Route::get('/api/live-search', [StudentController::class, 'apiSearch'])->name('api.students.search');

/*
|--------------------------------------------------------------------------
| SINAG-BUGHAW PROJECT: WEB & MOBILE ARCHIVE SYSTEM
|--------------------------------------------------------------------------
| System Version: 2.0 (Laravel-Based)
| Developer: Bryan Tesoroz & Team
| Date: April 2026
|--------------------------------------------------------------------------
*/

// =========================================================================
// 1. GLOBAL AUTHENTICATION ROUTES
// =========================================================================
Route::post('/login', [AuthController::class, 'login'])->name('login.process');
Route::post('/register', [AuthController::class, 'register'])->name('register.process');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// =========================================================================
// 2. WEB PORTAL (DESKTOP INTERFACE)
// =========================================================================

// Public / Landing Page
Route::get('/', function () {
    return view('web.landing');
})->name('landing');

Route::get('/admin/login', function () {
    return view('admin.app.login');
})->name('admin.login');

Route::post('/admin/login', function (Request $request) {
    $credentials = $request->validate([
        'username' => 'required|string',
        'password' => 'required|string',
    ]);

    $admin = Admin::where('username', $credentials['username'])
        ->where('is_active', true)
        ->first();

    if ($admin && Hash::check($credentials['password'], $admin->password)) {
        $request->session()->regenerate();
        $request->session()->put('is_admin', true);
        $request->session()->put('admin_id', $admin->id);
        $request->session()->put('admin_username', $admin->username);
        $request->session()->put('admin_name', $admin->name);
        $request->session()->put('admin_role', $admin->role);
        AuditLog::record($request, 'Admin Login', 'Admin logged in as '.$admin->username);

        return redirect()->route('admin.dashboard');
    }

    AuditLog::record($request, 'Failed Admin Login', 'Invalid admin login for '.$credentials['username'], 'Critical');

    return back()->withErrors([
        'username' => 'Invalid admin credentials.',
    ])->onlyInput('username');
})->name('admin.login.submit');

Route::get('/admin', [AdminController::class, 'dashboard'])->name('admin.dashboard');
Route::get('/admin/students', [AdminController::class, 'students'])->name('admin.students');
Route::get('/admin/students/create', [AdminController::class, 'createStudent'])->name('admin.students.create');
Route::post('/admin/students', [AdminController::class, 'storeStudent'])->name('admin.students.store');
Route::get('/admin/faculty', [AdminController::class, 'faculty'])->name('admin.faculty');
Route::post('/admin/faculty', [AdminController::class, 'storeFaculty'])->name('admin.faculty.store');
Route::put('/admin/faculty/{faculty}', [AdminController::class, 'updateFaculty'])->name('admin.faculty.update');
Route::delete('/admin/faculty/{faculty}', [AdminController::class, 'destroyFaculty'])->name('admin.faculty.destroy');
Route::get('/admin/content', [AdminController::class, 'content'])->name('admin.content');
Route::post('/admin/content/albums', [AdminController::class, 'storeAlbum'])->name('admin.content.albums.store');
Route::delete('/admin/content/albums/{album}', [AdminController::class, 'destroyAlbum'])->name('admin.content.albums.destroy');
Route::post('/admin/content/photos', [AdminController::class, 'storePhoto'])->name('admin.content.photos.store');
Route::post('/admin/content/faces/sync', [FaceRecognitionController::class, 'syncStudents'])->name('admin.content.faces.sync');
Route::delete('/admin/content/photos/{photo}', [AdminController::class, 'destroyPhoto'])->name('admin.content.photos.destroy');
Route::get('/admin/audit-logs', [AdminController::class, 'auditLogs'])->name('admin.audit-logs');
Route::get('/admin/settings', [AdminController::class, 'settings'])->name('admin.settings');
Route::post('/admin/settings', [AdminController::class, 'updateSettings'])->name('admin.settings.update');

Route::post('/admin/logout', function (Request $request) {
    AuditLog::record(
        $request,
        'Admin Logout',
        'Admin logged out '.($request->session()->get('admin_username') ?? 'unknown')
    );

    $request->session()->forget(['is_admin', 'admin_id', 'admin_username', 'admin_name', 'admin_role']);
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect()->route('admin.login');
})->name('admin.logout');

// Guest Only (Login/Register Forms)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
});

// Protected Web Routes (Requires Login)
Route::middleware('auth')->group(function () {

    // Main User Dashboard
    Route::get('/dashboard', function () {
        return view('web.dashboard');
    })->name('dashboard');

    // --- Student Directory ---
    Route::get('/directory', [DirectoryController::class, 'index'])->name('directory');

    // --- Student Profiles ---
    Route::get('/profile/{id}', function ($id) {
        $user = User::findOrFail($id);

        return view('web.profile', compact('user'));
    })->name('profile.view');

    // --- Faculty & Staff Management ---
    // FIXED: Added specific name 'faculty' to match your UI sidebar/navbar
    Route::get('/faculty', [FacultyController::class, 'index'])->name('faculty');
    Route::get('/faculty/{id}', [FacultyController::class, 'show'])->name('faculty.profile');

    // --- Digital Gallery & Albums ---
    Route::get('/gallery', [GalleryController::class, 'index'])->name('gallery');
    Route::post('/gallery/face-search', [FaceRecognitionController::class, 'search'])->name('gallery.face-search');
    Route::get('/gallery/{id}', [GalleryController::class, 'show'])->name('gallery.show');

    // --- ACADEMIC SECTIONS (FIXED FOR UI SYNC) ---
    // Binigyan natin ng shortcut name na 'sections' para hindi na mag-error yung links mo
    Route::get('/sections', [SectionController::class, 'index'])->name('sections');
    Route::get('/sections/view/{id}', [SectionController::class, 'show'])->name('sections.show');

    // --- PERSONAL PROFILE SETTINGS ---
    Route::get('/profile', function () {
        return view('web.profile');
    })->name('profile');

    // Profile Update Actions
    Route::post('/profile/update-photo', [ProfileController::class, 'updatePhoto'])->name('profile.update.photo');
    Route::post('/profile/update-bio', [ProfileController::class, 'updateBio'])->name('profile.update.bio');

});

// =========================================================================
// 3. MOBILE APPLICATION API/WEB-VIEW ROUTES
// =========================================================================
Route::prefix('app')->group(function () {

    // Mobile Landing
    Route::get('/', function () {
        return view('app.welcome');
    })->name('app.welcome');

    // Mobile Guest Access
    Route::middleware('guest')->group(function () {
        Route::get('/register', function () {
            return view('app.register');
        })->name('app.register');

        Route::get('/login', function () {
            return view('app.login');
        })->name('app.login');
    });

    // Mobile Protected Features
    Route::middleware('auth')->group(function () {

        Route::get('/dashboard', function () {
            return view('app.dashboard');
        })->name('app.dashboard');

        Route::get('/directory', function () {
            $students = User::all();

            return view('app.directory', compact('students'));
        })->name('app.directory');

        // Mobile Gallery Integration
        Route::get('/gallery', [GalleryController::class, 'index'])->name('app.gallery');
        Route::get('/gallery/{id}', [GalleryController::class, 'show'])->name('app.gallery.show');

        // Mobile Section Exploration
        Route::get('/sections', [SectionController::class, 'index'])->name('app.sections.index');
        Route::get('/sections/{id}', [SectionController::class, 'show'])->name('app.sections.show');

        // Mobile Profile Management
        Route::get('/profile', function () {
            return view('app.profile');
        })->name('app.profile');

        Route::get('/faculty', [FacultyController::class, 'index'])->name('app.faculty');

        Route::get('/achievements', function () {
            return view('app.achievements');
        })->name('app.achievements');

        // Mobile API Updates
        Route::post('/profile/update-bio', [ProfileController::class, 'updateBio'])->name('app.profile.update.bio');
        Route::post('/profile/update-photo', [ProfileController::class, 'updatePhoto'])->name('app.profile.update.photo');

    });
});
