<?php

declare(strict_types=1);

namespace App\Services\Storage;

use App\Contracts\StorageServiceInterface;
use App\Exceptions\StorageLimitExceededException;
use App\Exceptions\StorageUploadException;
use App\Models\Subscription;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Api\Admin\AdminApi;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;


class CloudinaryService implements StorageServiceInterface
{
    private Cloudinary $cloudinary;
    private UploadApi  $uploadApi;
    private AdminApi   $adminApi;

    private const STORAGE_CACHE_TTL   = 300;
    private const BANDWIDTH_CACHE_TTL = 600;

    // Constructor

    public function __construct()
    {
        Configuration::instance([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key'    => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);

        $this->cloudinary = new Cloudinary();
        $this->uploadApi  = new UploadApi();
        $this->adminApi   = new AdminApi();
    }


    // uploadPhoto()
    /**
     * Upload any file (image, video, audio, PDF) to Cloudinary.
     */
    public function uploadPhoto(
        UploadedFile $file,
        int          $userId,
        string       $folder  = 'general',
        array        $options = []
    ): array {
        $tier       = $this->resolveUserTier($userId);
        $tierConfig = $this->getTierConfig($tier);

        if (empty($options['skip_mime_check'])) {
            $this->assertMimeTypeAllowed($file, $tierConfig);
        }

        if (empty($options['skip_size_check'])) {
            $this->assertFileSizeAllowed($file, $tierConfig);
        }

        if (empty($options['skip_quota_check'])) {
            $this->assertStorageQuota($userId, $file->getSize(), $tierConfig);
        }

        // Strip internal-only flags before passing to Cloudinary
        $cloudinaryOptions = array_diff_key($options, array_flip([
            'skip_mime_check',
            'skip_size_check',
            'skip_quota_check',
        ]));

        $transformation = $this->resolveTransformations($file, $tierConfig);

        $baseOptions = [
            'folder'          => $this->buildFolder($userId, $folder, $tierConfig),
            'resource_type'   => $this->resolveResourceType($file),
            'use_filename'    => false,
            'unique_filename' => true,
            'overwrite'       => false,
            'type'            => 'upload',
            'image_metadata'  => false,
            'tags'            => [$tier, "user_{$userId}"],
        ];

        // Only add transformation key if it's a non-empty array
        // Passing null or empty array to Cloudinary causes array_merge errors
        if (is_array($transformation) && count($transformation) > 0) {
            $baseOptions['transformation'] = $transformation;
        }

        $uploadOptions = array_merge($baseOptions, $cloudinaryOptions);

        try {
            $result = $this->uploadApi->upload($file->getRealPath(), $uploadOptions);

            $this->bustStorageCache($userId);

            Log::info('CloudinaryService@uploadPhoto: success', [
                'user_id'   => $userId,
                'tier'      => $this->tierLabel($tier),
                'public_id' => $result['public_id'],
                'bytes'     => $result['bytes'],
                'folder'    => $folder,
            ]);

            return $this->buildUploadResponse($result);

        } catch (Throwable $e) {
            Log::error('CloudinaryService@uploadPhoto: failed', [
                'user_id' => $userId,
                'folder'  => $folder,
                'mime'    => $file->getMimeType(),
                'error'   => $e->getMessage(),
            ]);

            throw new StorageUploadException(
                message:  'Upload failed: ' . $e->getMessage(),
                previous: $e
            );
        }
    }

    // uploadBulk()

    public function uploadBulk(
        array  $files,
        int    $userId,
        string $folder  = 'general',
        array  $options = []
    ): array {
        $tier       = $this->resolveUserTier($userId);
        $tierConfig = $this->getTierConfig($tier);
        $bulkLimit  = (int) $tierConfig['bulk_upload_limit'];

        if (count($files) > $bulkLimit) {
            throw new StorageUploadException(
                "Bulk upload limit for the {$tier} tier is {$bulkLimit} files. "
                . count($files) . ' files were provided.'
            );
        }

        $results = [];

        foreach ($files as $index => $file) {
            try {
                $results[$index] = $this->uploadPhoto($file, $userId, $folder, $options);
            } catch (Throwable $e) {
                Log::warning('CloudinaryService@uploadBulk: single file failed', [
                    'user_id' => $userId,
                    'index'   => $index,
                    'error'   => $e->getMessage(),
                ]);

                $results[$index] = [
                    'success'    => false,
                    'public_id'  => '',
                    'secure_url' => '',
                    'bytes'      => 0,
                    'error'      => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    // deletePhoto()

    public function deletePhoto(string $publicId, string $resourceType = 'image'): array
    {
        try {
            $result = $this->uploadApi->destroy($publicId, [
                'resource_type' => $resourceType,
                'type'          => 'upload',
                'invalidate'    => true,
            ]);

            $success = ($result['result'] === 'ok');

            Log::info('CloudinaryService@deletePhoto', [
                'public_id'     => $publicId,
                'resource_type' => $resourceType,
                'success'       => $success,
            ]);

            return [
                'success'   => $success,
                'public_id' => $publicId,
                'result'    => $result['result'],
            ];

        } catch (Throwable $e) {
            Log::error('CloudinaryService@deletePhoto: failed', [
                'public_id' => $publicId,
                'error'     => $e->getMessage(),
            ]);

            throw new StorageUploadException(
                message:  "Failed to delete asset [{$publicId}]: " . $e->getMessage(),
                previous: $e
            );
        }
    }


    // delete()  — generic delete used by VoiceNoteController and others

    public function delete(string $publicId, string $resourceType = 'video'): array
    {
        return $this->deletePhoto($publicId, $resourceType);
    }

    // generateSignedUrl()
    public function generateSignedUrl(
        string $publicId,
        int    $ttl             = 0,
        array  $transformations = []
    ): array {
        $ttl = $ttl > 0 ? $ttl : (int) config('cloudinary.signed_url_ttl', 3600);

        try {
            $expiresAt = now()->addSeconds($ttl);

            $url = $this->cloudinary->image($publicId)->toUrl([
                'type'           => 'upload',
                'sign_url'       => true,
                'expires_at'     => $expiresAt->timestamp,
                'transformation' => $transformations ?: null,
            ]);

            Log::info('CloudinaryService@generateSignedUrl', [
                'public_id'  => $publicId,
                'expires_at' => $expiresAt->toIso8601String(),
            ]);

            return [
                'success'    => true,
                'signed_url' => (string) $url,
                'expires_at' => $expiresAt->toIso8601String(),
            ];

        } catch (Throwable $e) {
            Log::error('CloudinaryService@generateSignedUrl: failed', [
                'public_id' => $publicId,
                'error'     => $e->getMessage(),
            ]);

            throw new StorageUploadException(
                message:  "Signed URL generation failed for [{$publicId}]: " . $e->getMessage(),
                previous: $e
            );
        }
    }

    // getBandwidthUsage()

    public function getBandwidthUsage(): array
    {
        return Cache::remember('cloudinary:bandwidth_usage', self::BANDWIDTH_CACHE_TTL, function () {
            try {
                $usage = $this->adminApi->usage();

                return [
                    'success'              => true,
                    'bandwidth_used_bytes' => (int) ($usage['bandwidth']['used']  ?? 0),
                    'bandwidth_used_human' => $this->formatBytes((int) ($usage['bandwidth']['used'] ?? 0)),
                    'storage_used_bytes'   => (int) ($usage['storage']['used']   ?? 0),
                    'storage_used_human'   => $this->formatBytes((int) ($usage['storage']['used'] ?? 0)),
                    'last_updated'         => now()->toIso8601String(),
                ];

            } catch (Throwable $e) {
                Log::error('CloudinaryService@getBandwidthUsage: failed', [
                    'error' => $e->getMessage(),
                ]);

                throw new StorageUploadException(
                    message:  'Failed to retrieve bandwidth usage: ' . $e->getMessage(),
                    previous: $e
                );
            }
        });
    }

    // getUserStorageUsed()

    public function getUserStorageUsed(int $userId): int
    {
        $cacheKey = "cloudinary:storage_used:{$userId}";

        return Cache::remember($cacheKey, self::STORAGE_CACHE_TTL, function () use ($userId) {
            try {
                $resources = $this->adminApi->assets([
                    'type'        => 'upload',
                    'tags'        => true,
                    'max_results' => 500,
                    'prefix'      => "users/{$userId}/",
                ]);

                return (int) collect($resources['resources'] ?? [])
                    ->sum('bytes');

            } catch (Throwable $e) {
                Log::warning('CloudinaryService@getUserStorageUsed: failed, returning 0', [
                    'user_id' => $userId,
                    'error'   => $e->getMessage(),
                ]);

                return 0;
            }
        });
    }


    // uploadAudio()

    /**
     * Upload an audio file to Cloudinary.
     * Cloudinary requires resource_type = 'video' for all audio files.
     * The 25 MB cap matches the Groq free-tier transcription limit.
     */
    public function uploadAudio(
        UploadedFile $file,
        int          $userId,
        string       $context = 'voice_notes'
    ): array {
        $maxBytes = 25 * 1024 * 1024; // 25 MB — Groq free-tier limit
        if ($file->getSize() > $maxBytes) {
            throw new StorageUploadException(
                'Audio file ' . $this->formatBytes($file->getSize()) .
                ' exceeds the 25 MB limit.'
            );
        }

        $env = app()->environment();

        [$folder, $tags] = match ($context) {
            'transcripts' => [
                "{$env}/transcripts/users/{$userId}",
                ["user_{$userId}", 'audio', 'transcript'],
            ],
            default => [
                "{$env}/voice-notes/users/{$userId}",
                ["user_{$userId}", 'audio', 'voice_note'],
            ],
        };

        $uploadOptions = [
            'folder'          => $folder,
            'resource_type'   => 'video',   
            'type'            => 'upload',
            'use_filename'    => false,
            'unique_filename' => true,
            'overwrite'       => false,
            'tags'            => $tags,
        ];

        try {
            $result = $this->uploadApi->upload($file->getRealPath(), $uploadOptions);

            $this->bustStorageCache($userId);

            Log::info('CloudinaryService@uploadAudio: success', [
                'user_id'   => $userId,
                'context'   => $context,
                'public_id' => $result['public_id'] ?? '',
                'bytes'     => $result['bytes']     ?? 0,
            ]);

            return $this->buildUploadResponse($result);

        } catch (Throwable $e) {
            Log::error('CloudinaryService@uploadAudio: failed', [
                'user_id' => $userId,
                'context' => $context,
                'error'   => $e->getMessage(),
            ]);

            throw new StorageUploadException(
                message:  'Audio upload failed: ' . $e->getMessage(),
                previous: $e
            );
        }
    }


    // PRIVATE HELPERS


    private function resolveUserTier(int $userId): string
    {
        $subscription = Subscription::where('user_id', $userId)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest('created_at')
            ->first();

        if (! $subscription) {
            return 'free';
        }

        $plan = strtolower(trim($subscription->plan ?? ''));
        $tier = strtolower(trim($subscription->tier ?? ''));

        return match (true) {
            $tier === 'premium'  => 'premium',
            $tier === 'standard' => 'premium_standard',
            default              => 'free',
        };
    }

    private function tierLabel(string $configKey): string
    {
        return match ($configKey) {
            'premium'          => 'Premium HD',
            'premium_standard' => 'Premium Standard',
            default            => 'Free',
        };
    }

    private function getTierConfig(string $tier): array
    {
        $tierConfig = config("cloudinary.tiers.{$tier}");

        if (! is_array($tierConfig)) {
            $tierConfig = config('cloudinary.tiers.free');
        }

        if (! is_array($tierConfig)) {
            return [
                'storage_limit_bytes'  => 500 * 1024 * 1024,
                'max_file_size_bytes'  => 5   * 1024 * 1024,
                'max_video_size_bytes' => 50  * 1024 * 1024,
                'hd_enabled'           => false,
                'bulk_upload_limit'    => 5,
                'folder_prefix'        => 'free',
                'allowed_mime_types'   => [
                    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
                    'video/mp4', 'video/quicktime', 'video/webm',
                    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
                    'application/pdf',
                ],
                'transformations' => [[
                    'quality'      => 'auto:low',
                    'fetch_format' => 'auto',
                    'width'        => 1280,
                    'height'       => 1280,
                    'crop'         => 'limit',
                ]],
            ];
        }

        return $tierConfig;
    }

    private function assertMimeTypeAllowed(UploadedFile $file, array $tierConfig): void
    {
        $allowed = (array) $tierConfig['allowed_mime_types'];
        $mime    = $file->getMimeType();

        if (! in_array($mime, $allowed, true)) {
            throw new StorageUploadException(
                "File type [{$mime}] is not allowed on your current plan. "
                . 'Upgrade to premium for additional file type support.'
            );
        }
    }

    private function assertFileSizeAllowed(UploadedFile $file, array $tierConfig): void
    {
        $isVideo = str_starts_with((string) $file->getMimeType(), 'video/');
        $limit   = $isVideo
            ? (int) $tierConfig['max_video_size_bytes']
            : (int) $tierConfig['max_file_size_bytes'];

        if ($file->getSize() > $limit) {
            throw new StorageUploadException(
                'File size ' . $this->formatBytes($file->getSize())
                . " exceeds the {$this->formatBytes($limit)} limit for your plan."
            );
        }
    }

    private function assertStorageQuota(int $userId, int $fileSizeBytes, array $tierConfig): void
    {
        $limit = (int) $tierConfig['storage_limit_bytes'];
        $used  = $this->getUserStorageUsed($userId);

        if (($used + $fileSizeBytes) > $limit) {
            throw new StorageLimitExceededException(
                limitBytes: $limit,
                usedBytes:  $used,
                fileBytes:  $fileSizeBytes,
            );
        }
    }

    private function buildFolder(int $userId, string $folder, array $tierConfig): string
    {
        $env    = app()->environment();
        $prefix = $tierConfig['folder_prefix'];

        return "{$env}/{$prefix}/users/{$userId}/{$folder}";
    }

    private function resolveResourceType(UploadedFile $file): string
    {
        $mime = (string) $file->getMimeType();

        return match (true) {
            str_starts_with($mime, 'video/') => 'video',
            str_starts_with($mime, 'audio/') => 'video',  // Cloudinary uses 'video' for audio
            str_starts_with($mime, 'image/') => 'image',
            default                          => 'raw',    // PDFs and other docs
        };
    }

    /**
     * Only apply image transformations for actual image uploads.
     * Videos, audio, and raw files (PDFs) must NOT have image transformations.
     * Returns null for non-image files to prevent array_merge errors.
     */
    private function resolveTransformations(UploadedFile $file, array $tierConfig): ?array
    {
        $mime = (string) $file->getMimeType();

        if (str_starts_with($mime, 'image/')) {
            $transformations = $tierConfig['transformations'] ?? null;
            return is_array($transformations) ? $transformations : null;
        }

        return null;
    }

    private function bustStorageCache(int $userId): void
    {
        Cache::forget("cloudinary:storage_used:{$userId}");
    }

    private function buildUploadResponse(mixed $result): array
    {
        if ($result instanceof \Traversable) {
            $data = iterator_to_array($result);
        } elseif (is_array($result)) {
            $data = $result;
        } else {
            $data = json_decode(json_encode($result), true) ?? [];
        }

        return [
            'success'       => true,
            'public_id'     => $data['public_id']     ?? '',
            'url'           => $data['url']            ?? '',
            'secure_url'    => $data['secure_url']     ?? '',
            'resource_type' => $data['resource_type']  ?? 'image',
            'format'        => $data['format']         ?? '',
            'bytes'         => (int)   ($data['bytes']    ?? 0),
            'width'         => isset($data['width'])    ? (int)   $data['width']    : null,
            'height'        => isset($data['height'])   ? (int)   $data['height']   : null,
            'duration'      => isset($data['duration']) ? (float) $data['duration'] : null,
            'created_at'    => $data['created_at']     ?? now()->toIso8601String(),
        ];
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i     = 0;
        $value = (float) $bytes;

        while ($value >= 1024 && $i < count($units) - 1) {
            $value /= 1024;
            $i++;
        }

        return round($value, 2) . ' ' . $units[$i];
    }
}