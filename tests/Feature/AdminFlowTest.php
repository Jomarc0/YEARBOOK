<?php

namespace Tests\Feature;

use App\Contracts\FaceRecognition;
use App\Models\Admin;
use App\Models\Album;
use App\Models\Faculty;
use App\Models\Photo;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Fakes\FakeFaceRecognition;

class AdminFlowTest extends TestCase
{
    use RefreshDatabase;

    private function fakePng(string $name = 'image.png'): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0K1wAAAAASUVORK5CYII='
        );

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    public function test_admin_can_log_in_and_reach_dashboard(): void
    {
        Admin::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'Super Administrator',
            'is_active' => true,
        ]);

        $response = $this->post('/admin/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertTrue(session()->get('is_admin'));
    }

    public function test_admin_can_create_student_without_leaving_admin_panel(): void
    {
        Admin::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'Super Administrator',
            'is_active' => true,
        ]);

        $this->withSession([
            'is_admin' => true,
            'admin_name' => 'Admin User',
            'admin_role' => 'Super Administrator',
        ]);

        $response = $this->post(route('admin.students.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'student_id' => '2026-0001',
            'course' => 'BS Computer Science',
        ]);

        $response->assertRedirect(route('admin.students'));
        $response->assertSessionHas('success', 'Student account created successfully.');

        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'student_id' => '2026-0001',
            'course' => 'BS Computer Science',
        ]);
    }

    public function test_admin_can_manage_faculty_records(): void
    {
        Storage::fake('public');

        Admin::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'Super Administrator',
            'is_active' => true,
        ]);

        $this->withSession([
            'is_admin' => true,
            'admin_id' => 1,
            'admin_username' => 'admin',
            'admin_name' => 'Admin User',
            'admin_role' => 'Super Administrator',
        ]);

        $response = $this->post(route('admin.faculty.store'), [
            'name' => 'Dr. Maria Santos',
            'title' => 'Dean',
            'department' => 'College of Computing',
            'bio' => 'Faculty lead for the archive.',
            'image' => $this->fakePng('faculty.png'),
        ]);

        $response->assertRedirect(route('admin.faculty'));
        $this->assertDatabaseHas('faculties', [
            'name' => 'Dr. Maria Santos',
            'title' => 'Dean',
        ]);

        $faculty = Faculty::firstOrFail();

        $update = $this->put(route('admin.faculty.update', $faculty), [
            'name' => 'Dr. Maria Santos',
            'title' => 'Executive Dean',
            'department' => 'College of Computing',
            'bio' => 'Updated bio.',
        ]);

        $update->assertRedirect(route('admin.faculty'));
        $this->assertDatabaseHas('faculties', [
            'id' => $faculty->id,
            'title' => 'Executive Dean',
        ]);
    }

    public function test_admin_can_manage_gallery_content_and_settings(): void
    {
        Storage::fake('public');
        $this->app->instance(FaceRecognition::class, new FakeFaceRecognition());

        Admin::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'Super Administrator',
            'is_active' => true,
        ]);

        $this->withSession([
            'is_admin' => true,
            'admin_id' => 1,
            'admin_username' => 'admin',
            'admin_name' => 'Admin User',
            'admin_role' => 'Super Administrator',
        ]);

        $albumResponse = $this->post(route('admin.content.albums.store'), [
            'title' => 'Graduation 2026',
            'description' => 'Graduation memories',
            'event_date' => '2026-04-01',
            'cover_image' => $this->fakePng('cover.png'),
        ]);

        $albumResponse->assertRedirect(route('admin.content'));
        $album = Album::firstOrFail();

        $photoResponse = $this->post(route('admin.content.photos.store'), [
            'album_id' => $album->id,
            'caption' => 'Batch photo',
            'photo' => $this->fakePng('batch.png'),
        ]);

        $photoResponse->assertRedirect(route('admin.content'));
        $this->assertDatabaseHas('photos', [
            'album_id' => $album->id,
            'caption' => 'Batch photo',
        ]);
        $this->assertSame(1, (int) data_get(Photo::first(), 'ai_metadata.face_count'));

        $settingsResponse = $this->post(route('admin.settings.update'), [
            'site_name' => 'Sinag-Bughaw',
            'support_email' => 'support@example.com',
            'campus_address' => 'Lipa City',
            'gallery_items_per_page' => 9,
            'allow_registration' => '1',
        ]);

        $settingsResponse->assertRedirect(route('admin.settings'));
        $this->assertSame('Sinag-Bughaw', Setting::getValue('site_name'));
        $this->assertSame('9', Setting::getValue('gallery_items_per_page'));
    }
}
