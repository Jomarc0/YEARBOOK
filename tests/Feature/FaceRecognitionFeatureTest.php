<?php

namespace Tests\Feature;

use App\Contracts\FaceRecognition;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Fakes\FakeFaceRecognition;
use Tests\TestCase;

class FaceRecognitionFeatureTest extends TestCase
{
    use RefreshDatabase;

    private function fakePng(string $name = 'image.png'): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0K1wAAAAASUVORK5CYII='
        );

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    public function test_gallery_face_search_returns_matching_student(): void
    {
        Storage::fake('public');
        $this->app->instance(FaceRecognition::class, new FakeFaceRecognition());

        $user = User::create([
            'name' => 'Jane Student',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'student_id' => '2026-0001',
            'course' => 'BS Computer Science',
        ]);

        $response = $this->actingAs($user)->post(route('gallery.face-search'), [
            'face_image' => $this->fakePng('search-face.png'),
        ]);

        $response->assertRedirect(route('gallery'));
        $response->assertSessionHas('faceSearchResults.matches.0.name', 'Jane Student');
        $response->assertSessionHas('faceSearchResults.matches.0.similarity', 98.8);
    }

    public function test_admin_can_sync_student_face_collection(): void
    {
        Storage::fake('public');
        $fakeFaceRecognition = new FakeFaceRecognition();
        $this->app->instance(FaceRecognition::class, $fakeFaceRecognition);

        Admin::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'password' => 'admin123',
            'role' => 'Super Administrator',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Jane Student',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'student_id' => '2026-0001',
            'course' => 'BS Computer Science',
            'profile_picture' => 'profile_pics/jane.png',
        ]);

        $response = $this
            ->withSession([
                'is_admin' => true,
                'admin_id' => 1,
                'admin_username' => 'admin',
                'admin_name' => 'Admin User',
                'admin_role' => 'Super Administrator',
            ])
            ->post(route('admin.content.faces.sync'));

        $response->assertRedirect(route('admin.content'));
        $response->assertSessionHas('success');
        $this->assertSame([1], $fakeFaceRecognition->indexedUserIds);
    }
}
