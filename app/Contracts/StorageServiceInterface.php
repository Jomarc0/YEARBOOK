<?php

declare(strict_types=1);

namespace App\Contracts;

use Illuminate\Http\UploadedFile;

/**
 * StorageServiceInterface
 *
 * Contract for all storage integrations (Cloudinary, S3, Firebase, etc.).
 * Depend on this interface — never on a concrete service — so the
 * underlying driver can be swapped in IntegrationServiceProvider
 * without touching any controller or service that uses storage.
 */
interface StorageServiceInterface
{
    /**
     * Upload a single photo/video file for a given user.
     *
     * @param  UploadedFile        $file    The file to upload.
     * @param  int                 $userId  Owner's user ID (used to scope folder and quota).
     * @param  string              $folder  Logical folder name (e.g. "gallery", "profile").
     * @param  array<string,mixed> $options Driver-specific overrides.
     *
     * @return array{
     *     success: bool,
     *     public_id: string,
     *     url: string,
     *     secure_url: string,
     *     resource_type: string,
     *     format: string,
     *     bytes: int,
     *     width: int|null,
     *     height: int|null,
     *     duration: float|null,
     *     created_at: string
     * }
     */
    public function uploadPhoto(
        UploadedFile $file,
        int $userId,
        string $folder = 'general',
        array $options = []
    ): array;

    /**
     * Upload multiple files in one request (premium bulk upload).
     *
     * @param  UploadedFile[]      $files
     * @param  int                 $userId
     * @param  string              $folder
     * @param  array<string,mixed> $options
     *
     * @return array<int, array{success: bool, public_id: string, secure_url: string, bytes: int, error?: string}>
     */
    public function uploadBulk(
        array $files,
        int $userId,
        string $folder = 'general',
        array $options = []
    ): array;

    /**
     * Permanently delete a stored asset by its public ID.
     *
     * @param  string $publicId      Cloudinary/storage public ID.
     * @param  string $resourceType  "image" | "video" | "raw".
     *
     * @return array{success: bool, public_id: string, result: string}
     */
    public function deletePhoto(string $publicId, string $resourceType = 'image'): array;

    /**
     * Generate a time-limited signed URL for a private/authenticated asset.
     *
     * @param  string $publicId   The asset's public ID.
     * @param  int    $ttl        Seconds until the URL expires.
     * @param  array<string,mixed> $transformations  Optional on-the-fly transformations.
     *
     * @return array{success: bool, signed_url: string, expires_at: string}
     */
    public function generateSignedUrl(
        string $publicId,
        int $ttl = 3600,
        array $transformations = []
    ): array;

    /**
     * Retrieve total bandwidth used by the account this billing period.
     *
     * @return array{
     *     success: bool,
     *     bandwidth_used_bytes: int,
     *     bandwidth_used_human: string,
     *     storage_used_bytes: int,
     *     storage_used_human: string,
     *     last_updated: string
     * }
     */
    public function getBandwidthUsage(): array;

    /**
     * Get the total bytes a user has stored across all their assets.
     *
     * @param  int $userId
     * @return int  Bytes used.
     */
    public function getUserStorageUsed(int $userId): int;
}