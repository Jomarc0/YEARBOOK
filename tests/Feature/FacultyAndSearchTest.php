<?php

namespace Tests\Feature;

use App\Models\Faculty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacultyAndSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_faculty_page_renders_with_faculty_records(): void
    {
        $user = User::create([
            'name' => 'Alice Cruz',
            'email' => 'alice@example.com',
            'password' => 'password123',
        ]);

        Faculty::create([
            'name' => 'Prof. Maria Santos',
            'title' => 'Professor',
            'department' => 'Computer Studies',
        ]);

        $response = $this->actingAs($user)->get(route('faculty'));

        $response->assertOk();
        $response->assertSee('Prof. Maria Santos');
    }

    public function test_live_search_named_route_returns_students_and_faculty(): void
    {
        $user = User::create([
            'name' => 'Alice Cruz',
            'email' => 'alice@example.com',
            'password' => 'password123',
            'first_name' => 'Alice',
            'last_name' => 'Cruz',
        ]);

        Faculty::create([
            'name' => 'Prof. Maria Santos',
            'title' => 'Professor',
            'department' => 'Computer Studies',
        ]);

        User::create([
            'name' => 'Brian Santos',
            'email' => 'brian@example.com',
            'password' => 'password123',
            'student_id' => '2026-1002',
            'first_name' => 'Brian',
            'last_name' => 'Santos',
        ]);

        $response = $this
            ->actingAs($user)
            ->getJson(route('api.search', ['query' => 'Santos']));

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Prof. Maria Santos']);
        $response->assertJsonFragment(['name' => 'Brian Santos']);
    }
}
