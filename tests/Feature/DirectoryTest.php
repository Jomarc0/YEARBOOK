<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_directory_route_uses_search_filters(): void
    {
        User::create([
            'name' => 'Alice Cruz',
            'email' => 'alice@example.com',
            'password' => 'password123',
            'student_id' => '2026-1001',
            'course' => 'BS Computer Science',
        ]);

        User::create([
            'name' => 'Brian Santos',
            'email' => 'brian@example.com',
            'password' => 'password123',
            'student_id' => '2026-1002',
            'course' => 'BS Accountancy',
        ]);

        $user = User::first();

        $response = $this->actingAs($user)->get(route('directory', [
            'search' => 'Alice',
        ]));

        $response->assertOk();
        $response->assertSee('Alice Cruz');
        $response->assertDontSee('Brian Santos');
    }
}
