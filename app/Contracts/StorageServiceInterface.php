<?php

declare(strict_types=1);

namespace App\Contracts;

use Illuminate\Http\UploadedFile;

/**
 * StorageServiceInterface
 */
interface StorageServiceInterface
{
    /**
     * Upload a single photo/video file for a given user.
     */
    public function uploadPhoto(
        UploadedFile $file,
        int $userId,
        string $folder = 'general',
        array $options = []
    ): array;

    /**
     * Upload multiple files in one request (premium bulk upload).
     */
    public function uploadBulk(
        array $files,
        int $userId,
        string $folder = 'general',
        array $options = []
    ): array;

    /**
     * Permanently delete a stored asset by its public ID.
     */
    public function deletePhoto(string $publicId, string $resourceType = 'image'): array;

    /**
     * Generate a time-limited signed URL for a private/authenticated asset.
     */
    public function generateSignedUrl(
        string $publicId,
        int $ttl = 3600,
        array $transformations = []
    ): array;

    public function getBandwidthUsage(): array;

    public function getUserStorageUsed(int $userId): int;
}