<?php
namespace App\Services;

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class CloudinaryService
{
    public function uploadProfilePicture(string $filePath, int $userId): array
    {
        $result = Cloudinary::upload($filePath, [
            'folder'         => 'yearbook/profiles',
            'public_id'      => "student_{$userId}",
            'overwrite'      => true,
            'transformation' => ['width' => 500, 'height' => 500, 'crop' => 'fill', 'gravity' => 'face'],
        ]);
        return ['public_id' => $result->getPublicId(), 'secure_url' => $result->getSecurePath()];
    }

    public function uploadPhoto(string $filePath, string $folder = 'yearbook/photos'): array
    {
        $result = Cloudinary::upload($filePath, [
            'folder'         => $folder,
            'transformation' => ['quality' => 'auto', 'fetch_format' => 'auto'],
        ]);
        return ['public_id' => $result->getPublicId(), 'secure_url' => $result->getSecurePath()];
    }

    public function uploadAudio(string $filePath, int $userId): array
    {
        $result = Cloudinary::uploadVideo($filePath, [
            'folder'        => 'yearbook/voice-notes',
            'resource_type' => 'video',
            'public_id'     => "voice_{$userId}_" . time(),
        ]);
        return ['public_id' => $result->getPublicId(), 'secure_url' => $result->getSecurePath()];
    }

    public function uploadVideo(string $filePath, string $folder = 'yearbook/videos'): array
    {
        $result = Cloudinary::uploadVideo($filePath, [
            'folder'        => $folder,
            'resource_type' => 'video',
            'eager'         => [['format' => 'mp4', 'quality' => 'auto']],
        ]);
        return ['public_id' => $result->getPublicId(), 'secure_url' => $result->getSecurePath()];
    }

    public function delete(string $publicId): bool
    {
        return Cloudinary::destroy($publicId)['result'] === 'ok';
    }
}