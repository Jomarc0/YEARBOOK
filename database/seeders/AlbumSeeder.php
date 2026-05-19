<?php

namespace Database\Seeders;

use App\Models\Album;
use App\Models\Photo;
use Illuminate\Database\Seeder;

class AlbumSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Graduation Album
        $grad = Album::create([
            'title' => 'NU Lipa Graduation 2025',
            'description' => 'The first batch of Sinag-Bughaw pioneers.',
            'cover_image' => 'covers/grad_cover.jpg',
            'event_date' => '2025-04-15',
        ]);

        // Magdagdag tayo ng dummy photos sa loob ng Graduation
        Photo::create([
            'album_id' => $grad->id,
            'file_path' => 'photos/grad_1.jpg',
            'caption' => 'Batch Photo',
        ]);

        // 2. Create Sports Fest Album
        Album::create([
            'title' => 'University Week 2026',
            'description' => 'Highlights from the Intramurals.',
            'cover_image' => 'covers/sports_cover.jpg',
            'event_date' => '2026-02-10',
        ]);
    }
}
