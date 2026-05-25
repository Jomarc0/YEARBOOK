<?php

namespace App\Services\Storage;

use App\Contracts\StorageServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LocalStorageService implements StorageServiceInterface
{
    /**
     * Convert a storage path to a public URL.
     * Works on all Laravel versions.
     */
    private function toUrl(string $path): string
    {
        return asset('storage/' . ltrim($path, '/'));
    }

    public function uploadPhoto(
        UploadedFile $file,
        int $userId,
        string $folder = 'general',
        array $options = []
    ): array {
        $path = $file->store("{$folder}/{$userId}", 'public');
        $url  = $this->toUrl($path);

        return [
            'success'       => true,
            'public_id'     => $path,
            'url'           => $url,
            'secure_url'    => $url,
            'resource_type' => 'image',
            'format'        => $file->getClientOriginalExtension(),
            'bytes'         => $file->getSize(),
            'width'         => null,
            'height'        => null,
            'duration'      => null,
            'created_at'    => now()->toISOString(),
        ];
    }

    public function uploadBulk(
        array $files,
        int $userId,
        string $folder = 'general',
        array $options = []
    ): array {
        return array_map(
            fn($file) => $this->uploadPhoto($file, $userId, $folder, $options),
            $files
        );
    }

    public function deletePhoto(string $publicId, string $resourceType = 'image'): array
    {
        $deleted = Storage::disk('public')->delete($publicId);

        return [
            'success'   => $deleted,
            'public_id' => $publicId,
            'result'    => $deleted ? 'ok' : 'not_found',
        ];
    }

    public function generateSignedUrl(
        string $publicId,
        int $ttl = 3600,
        array $transformations = []
    ): array {
        return [
            'success'    => true,
            'signed_url' => $this->toUrl($publicId),
            'expires_at' => now()->addSeconds($ttl)->toISOString(),
        ];
    }

    public function getBandwidthUsage(): array
    {
        return [
            'success'              => true,
            'bandwidth_used_bytes' => 0,
            'bandwidth_used_human' => '0 B',
            'storage_used_bytes'   => 0,
            'storage_used_human'   => '0 B',
            'last_updated'         => now()->toISOString(),
        ];
    }

    public function getUserStorageUsed(int $userId): int
    {
        return 0;
    }
}