<?php

namespace App\Services;

use App\Contracts\FaceRecognition;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PythonFaceRecognitionService implements FaceRecognition
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.face_service.url', 'http://localhost:5001');
    }

    public function isEnabled(): bool
    {
        return filled($this->baseUrl);
    }

    public function indexStudent(User $user): array
    {
        if (blank($user->profile_picture)) {
            return ['indexed' => false, 'reason' => 'No profile picture'];
        }

        if (! Storage::disk('public')->exists($user->profile_picture)) {
            return ['indexed' => false, 'reason' => 'File not found'];
        }

        $b64 = base64_encode(Storage::disk('public')->get($user->profile_picture));

        $response = Http::timeout(30)->post("{$this->baseUrl}/index", [
            'user_id'   => $user->id,
            'name'      => $user->name,
            'image_b64' => $b64,
        ]);

        return $response->json() ?? ['indexed' => false, 'reason' => 'Service error'];
    }

    public function syncStudents(iterable $students): array
    {
        $payload = [];
        $skipped = 0;

        foreach ($students as $user) {
            if (blank($user->profile_picture) || ! Storage::disk('public')->exists($user->profile_picture)) {
                $skipped++;
                continue;
            }
            $payload[] = [
                'user_id'   => $user->id,
                'name'      => $user->name,
                'image_b64' => base64_encode(Storage::disk('public')->get($user->profile_picture)),
            ];
        }

        if (empty($payload)) {
            return ['indexed' => 0, 'skipped' => $skipped, 'errors' => []];
        }

        $response = Http::timeout(120)->post("{$this->baseUrl}/sync", [
            'students' => $payload,
        ]);

        $result             = $response->json() ?? [];
        $result['skipped']  = ($result['skipped'] ?? 0) + $skipped;
        $result['errors']   = [];

        return $result;
    }

    public function analyzePhoto(string $disk, string $path): array
    {
        if (! Storage::disk($disk)->exists($path)) {
            return ['status' => 'error', 'face_count' => 0, 'matches' => [], 'reason' => 'File not found'];
        }

        $b64 = base64_encode(Storage::disk($disk)->get($path));

        try {
            $response = Http::timeout(60)->post("{$this->baseUrl}/analyze", [
                'image_b64' => $b64,
                'threshold' => 0.6,
            ]);

            $data = $response->json() ?? [];

            return [
                'status'      => 'analyzed',
                'provider'    => 'python-face-recognition',
                'face_count'  => $data['face_count'] ?? 0,
                'faces'       => $data['matches'] ?? [],
                'matches'     => $data['matches'] ?? [],
                'limitations' => [],
            ];
        } catch (\Exception $e) {
            Log::warning('Face analyze failed: ' . $e->getMessage());
            return ['status' => 'error', 'face_count' => 0, 'matches' => [], 'reason' => $e->getMessage()];
        }
    }

    public function searchUploadedFace(UploadedFile $file, int $maxMatches = 5): array
    {
        $b64 = base64_encode(file_get_contents($file->getRealPath()));

        try {
            $response = Http::timeout(30)->post("{$this->baseUrl}/search", [
                'image_b64' => $b64,
                'threshold' => 0.6,
                'top_k'     => $maxMatches,
            ]);

            $data = $response->json() ?? [];

            return [
                'status'  => ! empty($data['matches']) ? 'matched' : 'no_matches',
                'matches' => $data['matches'] ?? [],
                'message' => empty($data['matches']) ? 'No close student matches were found.' : null,
            ];
        } catch (\Exception $e) {
            Log::warning('Face search failed: ' . $e->getMessage());
            return ['status' => 'error', 'matches' => [], 'message' => $e->getMessage()];
        }
    }
}