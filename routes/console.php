<?php

use App\Contracts\FaceRecognition;
use App\Jobs\AI\GenerateTranscript;
use App\Models\GraduationPhoto;
use App\Models\Photo;
use App\Models\Transcript;
use App\Models\User;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('faces:sync-students', function (FaceRecognition $faceRecognition) {
    if (! $faceRecognition->isEnabled()) {
        $this->error('Face recognition is not configured. Set your AWS Rekognition environment values first.');
        return;
    }

    $summary = $faceRecognition->syncStudents(
        User::with('studentRecord')
            ->where(function ($query) {
                $query->whereNotNull('profile_picture')
                    ->where('profile_picture', '!=', '');
            })
            ->orWhereHas('studentRecord', function ($query) {
                $query->whereNotNull('photo')
                    ->where('photo', '!=', '');
            })
            ->get()
    );

    $this->info('Indexed: ' . $summary['indexed']);
    $this->line('Skipped: ' . $summary['skipped']);

    if ($summary['errors'] !== []) {
        $this->warn('Errors: ' . count($summary['errors']));
    }
})->purpose('Index student profile photos into the Rekognition collection.');

// ── Re-upload authenticated Cloudinary photos as public ────────────────────
Artisan::command('transcripts:backfill-graduation {--dry-run}', function () {
    $transcriptCategories = ['videos', 'songs', 'mass', 'speeches'];
    $created = 0;
    $queued = 0;
    $skipped = 0;

    $media = GraduationPhoto::query()
        ->with('album')
        ->whereHas('album', fn ($query) => $query->whereIn('category', $transcriptCategories))
        ->where(function ($query) {
            $query->where('resource_type', 'video')
                ->orWhere('mime_type', 'like', 'video/%')
                ->orWhere('mime_type', 'like', 'audio/%')
                ->orWhere('file_path', 'regexp', '\\.(mp4|mov|webm|avi|mkv|mp3|wav|m4a|ogg|flac)(\\?.*)?$');
        })
        ->orderBy('id')
        ->get();

    $this->info("Found {$media->count()} graduation media file(s) eligible for transcripts.");

    foreach ($media as $item) {
        $album = $item->album;

        if (! $album || blank($item->file_path)) {
            $skipped++;
            continue;
        }

        $exists = Transcript::query()
            ->where('graduation_photo_id', $item->id)
            ->when($item->cloudinary_public_id, fn ($query) => $query->orWhere('public_id', $item->cloudinary_public_id))
            ->exists();

        if ($exists) {
            $skipped++;
            continue;
        }

        $this->line("Creating transcript for {$album->category} media #{$item->id}: {$album->title}");

        if ($this->option('dry-run')) {
            $created++;
            continue;
        }

        $transcript = Transcript::create([
            'title'               => $album->title,
            'audio_path'          => $item->file_path,
            'public_id'           => $item->cloudinary_public_id,
            'status'              => 'pending',
            'source'              => 'auto',
            'album_id'            => null,
            'graduation_photo_id' => $item->id,
            'uploaded_by'         => $album->user_id,
        ]);

        GenerateTranscript::dispatch($transcript);
        $created++;
        $queued++;
    }

    $this->info("Created: {$created}");
    $this->info("Queued: {$queued}");
    $this->info("Skipped: {$skipped}");
})->purpose('Create and queue missing transcripts for graduation video/audio uploads.');

Artisan::command('cloudinary:reupload-as-public', function () {
    Configuration::instance([
        'cloud' => [
            'cloud_name' => config('cloudinary.cloud_name'),
            'api_key'    => config('cloudinary.api_key'),
            'api_secret' => config('cloudinary.api_secret'),
        ],
        'url' => ['secure' => true],
    ]);

    $uploadApi = new UploadApi();

    $photos = Photo::where('is_profile_post', true)
        ->whereNotNull('public_id')
        ->where('file_path', 'like', '%/authenticated/%')
        ->get();

    $this->info("Found {$photos->count()} authenticated photo(s) to re-upload as public.");

    if ($photos->isEmpty()) {
        $this->info('Nothing to do — all photos are already public.');
        return;
    }

    $cloudName = config('cloudinary.cloud_name');
    $apiKey    = config('cloudinary.api_key');
    $apiSecret = config('cloudinary.api_secret');

    foreach ($photos as $photo) {
        try {
            $resourceType = $photo->ai_metadata['resource_type'] ?? 'image';
            $extension    = pathinfo($photo->public_id, PATHINFO_EXTENSION) ?: 'jpg';

            $timestamp  = now()->addMinutes(10)->timestamp;
            $publicId   = $photo->public_id;

            $downloadUrl = $photo->file_path;

            $this->line(" Downloading Photo #{$photo->id} from Cloudinary...");

            $ch = curl_init($downloadUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            $bytes    = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (! $bytes || $httpCode !== 200) {
                $this->error("Photo #{$photo->id} — download failed (HTTP {$httpCode}). Skipping.");
                continue;
            }

            $tmpPath = sys_get_temp_dir() . '/cld_' . $photo->id . '.' . $extension;
            file_put_contents($tmpPath, $bytes);

            $folder = implode('/', array_slice(explode('/', $publicId), 0, -1));

            $result = $uploadApi->upload($tmpPath, [
                'folder'          => $folder,
                'resource_type'   => $resourceType,
                'type'            => 'upload',
                'use_filename'    => false,
                'unique_filename' => true,
                'overwrite'       => false,
                'invalidate'      => true,
            ]);

            @unlink($tmpPath);

            if ($result instanceof \Traversable) {
                $resultArr = iterator_to_array($result);
            } else {
                $resultArr = (array) $result;
            }

            $newUrl      = $resultArr['secure_url'] ?? null;
            $newPublicId = $resultArr['public_id']  ?? null;

            if (! $newUrl) {
                $this->error("Photo #{$photo->id} — upload returned no URL.");
                continue;
            }

            try {
                $uploadApi->destroy($publicId, [
                    'resource_type' => $resourceType,
                    'type'          => 'authenticated',
                    'invalidate'    => true,
                ]);
            } catch (\Throwable $e) {
                $this->warn("Could not delete old asset for Photo #{$photo->id}: " . $e->getMessage());
            }

            $photo->update([
                'file_path' => $newUrl,
                'public_id' => $newPublicId,
            ]);

            $this->info("Photo #{$photo->id} → {$newUrl}");

        } catch (\Throwable $e) {
            $this->error("Photo #{$photo->id} failed: " . $e->getMessage());
        }
    }

    $this->info('Migration complete. Clearing cache...');
    Artisan::call('cache:clear');
    $this->info('All done!');
})->purpose('Re-upload authenticated Cloudinary profile photos as public (type=upload).');

// ── Memory Digest Scheduler ────────────────────────────────────────────────
Schedule::command('memories:send-digest')
    ->dailyAt('08:00')
    ->timezone('Asia/Manila')
    ->withoutOverlapping();
