<?php

namespace App\Services;

use App\Contracts\FaceRecognition;
use App\Models\User;
use Aws\Exception\AwsException;
use Aws\Rekognition\RekognitionClient;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class AwsRekognitionFaceRecognition implements FaceRecognition
{
    public function __construct(
        private readonly array $config,
    ) {
    }

    public function isEnabled(): bool
    {
        return class_exists(RekognitionClient::class)
            && filled($this->config['key'] ?? null)
            && filled($this->config['secret'] ?? null)
            && filled($this->config['region'] ?? null)
            && filled($this->config['collection'] ?? null);
    }

    public function indexStudent(User $user): array
    {
        if (! $this->isEnabled()) {
            return [
                'indexed' => false,
                'reason' => 'Face recognition is not configured.',
            ];
        }

        if (blank($user->profile_picture) || ! Storage::disk('public')->exists($user->profile_picture)) {
            return [
                'indexed' => false,
                'reason' => 'Student does not have a profile picture to index.',
            ];
        }

        $result = $this->client()->indexFaces([
            'CollectionId' => $this->collectionId(),
            'ExternalImageId' => $this->externalImageId($user),
            'Image' => [
                'Bytes' => $this->readDiskBytes('public', $user->profile_picture),
            ],
            'DetectionAttributes' => ['DEFAULT'],
            'MaxFaces' => 1,
            'QualityFilter' => 'AUTO',
        ]);

        return [
            'indexed' => count($result['FaceRecords'] ?? []) > 0,
            'face_records' => count($result['FaceRecords'] ?? []),
            'unindexed_faces' => count($result['UnindexedFaces'] ?? []),
            'external_image_id' => $this->externalImageId($user),
        ];
    }

    public function syncStudents(iterable $students): array
    {
        // Create collection if it doesn't exist
        $this->ensureCollectionExists();

        $summary = [
            'indexed' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        foreach ($students as $student) {
            try {
                $result = $this->indexStudent($student);

                if ($result['indexed'] ?? false) {
                    $summary['indexed']++;
                } else {
                    $summary['skipped']++;
                }
            } catch (\Throwable $exception) {
                $summary['errors'][] = [
                    'user_id' => $student->id,
                    'message' => $exception->getMessage(),
                ];
            }
        }

        return $summary;
    }

    public function analyzePhoto(string $disk, string $path): array
    {
        if (! $this->isEnabled()) {
            return [
                'status' => 'disabled',
                'face_count' => 0,
                'faces' => [],
                'matches' => [],
                'limitations' => ['Face recognition is not configured.'],
            ];
        }

        $bytes = $this->readDiskBytes($disk, $path);
        $faceDetails = $this->client()->detectFaces([
            'Image' => ['Bytes' => $bytes],
            'Attributes' => ['DEFAULT'],
        ]);

        $faces = collect($faceDetails['FaceDetails'] ?? [])
            ->map(fn (array $face) => [
                'confidence' => round((float) ($face['Confidence'] ?? 0), 2),
                'bounding_box' => [
                    'width' => (float) data_get($face, 'BoundingBox.Width', 0),
                    'height' => (float) data_get($face, 'BoundingBox.Height', 0),
                    'left' => (float) data_get($face, 'BoundingBox.Left', 0),
                    'top' => (float) data_get($face, 'BoundingBox.Top', 0),
                ],
            ])
            ->values()
            ->all();

        $matches = [];
        $limitations = [];

        if (count($faces) > 0) {
            $searchResult = $this->searchBytes($bytes, 3);
            $matches = $searchResult['matches'];

            if (count($faces) > 1) {
                $limitations[] = 'Only the largest detected face can be matched automatically in this environment.';
            }
        }

        return [
            'status' => 'analyzed',
            'provider' => 'aws-rekognition',
            'analyzed_at' => now()->toIso8601String(),
            'face_count' => count($faces),
            'faces' => $faces,
            'matches' => $matches,
            'limitations' => $limitations,
        ];
    }

    public function searchUploadedFace(UploadedFile $file, int $maxMatches = 5, ?float $threshold = null): array
    {
        if (! $this->isEnabled()) {
            return [
                'status' => 'disabled',
                'matches' => [],
                'message' => 'Face recognition is not configured yet.',
            ];
        }

        // Ensure collection exists before searching
        $this->ensureCollectionExists();

        return $this->searchBytes(
            file_get_contents($file->getRealPath()) ?: '',
            $maxMatches,
            $threshold
        );
    }

    public function analyzeUploadedImage(UploadedFile $file): array
    {
        if (! $this->isEnabled()) {
            return [
                'status' => 'disabled',
                'faces' => [],
                'message' => 'Face recognition is not configured yet.',
            ];
        }

        $bytes = file_get_contents($file->getRealPath()) ?: '';

        if ($bytes === '') {
            throw new InvalidArgumentException('The uploaded image could not be read.');
        }

        try {
            $result = $this->client()->detectFaces([
                'Image' => ['Bytes' => $bytes],
                'Attributes' => ['ALL'],
            ]);

            $faces = collect($result['FaceDetails'] ?? [])
                ->map(function (array $face, int $index) {
                    return [
                        'face_id' => $index + 1,
                        'confidence' => (float) data_get($face, 'Confidence', 0),
                        'bounding_box' => [
                            'left' => (float) data_get($face, 'BoundingBox.Left', 0),
                            'top' => (float) data_get($face, 'BoundingBox.Top', 0),
                            'width' => (float) data_get($face, 'BoundingBox.Width', 0),
                            'height' => (float) data_get($face, 'BoundingBox.Height', 0),
                        ],
                        'age_range' => [
                            'low' => (int) data_get($face, 'AgeRange.Low', 0),
                            'high' => (int) data_get($face, 'AgeRange.High', 0),
                        ],
                        'gender' => data_get($face, 'Gender.Value', 'Unknown'),
                        'emotions' => collect(data_get($face, 'Emotions', []))
                            ->sortByDesc('Confidence')
                            ->take(3)
                            ->map(fn ($emotion) => [
                                'type' => $emotion['Type'],
                                'confidence' => (float) $emotion['Confidence'],
                            ])
                            ->values()
                            ->all(),
                        'pose' => [
                            'pitch' => (float) data_get($face, 'Pose.Pitch', 0),
                            'roll' => (float) data_get($face, 'Pose.Roll', 0),
                            'yaw' => (float) data_get($face, 'Pose.Yaw', 0),
                        ],
                        'quality' => [
                            'brightness' => (float) data_get($face, 'Quality.Brightness', 0),
                            'sharpness' => (float) data_get($face, 'Quality.Sharpness', 0),
                        ],
                    ];
                })
                ->filter(fn ($face) => $face['confidence'] >= 80) // Only high-confidence detections
                ->values()
                ->all();

            return [
                'status' => 'analyzed',
                'provider' => 'aws-rekognition',
                'analyzed_at' => now()->toIso8601String(),
                'face_count' => count($faces),
                'faces' => $faces,
                'message' => count($faces) > 0 ? null : 'No faces detected in the uploaded image.',
            ];
        } catch (AwsException $exception) {
            return [
                'status' => 'error',
                'faces' => [],
                'message' => $exception->getAwsErrorMessage() ?: $exception->getMessage(),
            ];
        }
    }

    private function searchBytes(string $bytes, int $maxMatches, ?float $threshold = null): array
    {
        if ($bytes === '') {
            throw new InvalidArgumentException('The uploaded image could not be read.');
        }

        $threshold = $threshold ?? (float) ($this->config['threshold'] ?? 90);

        try {
            $result = $this->client()->searchFacesByImage([
                'CollectionId' => $this->collectionId(),
                'Image' => ['Bytes' => $bytes],
                'FaceMatchThreshold' => $threshold,
                'MaxFaces' => $maxMatches,
                'QualityFilter' => 'AUTO',
            ]);
        } catch (AwsException $exception) {
            $message = $exception->getAwsErrorMessage() ?: $exception->getMessage();

            return [
                'status' => str_contains(strtolower($message), 'no face') ? 'no_face' : 'error',
                'matches' => [],
                'message' => $message,
            ];
        }

        $matches = collect($result['FaceMatches'] ?? [])
            ->map(function (array $match) {
                $externalImageId = data_get($match, 'Face.ExternalImageId');
                $user = $this->resolveUserFromExternalImageId($externalImageId);

                return [
                    'user_id' => $user?->id,
                    'name' => $user?->name ?? 'Unknown student',
                    'student_id' => $user?->student_id,
                    'course' => $user?->course,
                    'profile_picture' => $user?->profile_picture,
                    'similarity' => round((float) ($match['Similarity'] ?? 0), 2),
                    'confidence' => round((float) data_get($match, 'Face.Confidence', 0), 2),
                    'external_image_id' => $externalImageId,
                ];
            })
            ->filter(fn (array $match) => filled($match['user_id']))
            ->values()
            ->all();

        return [
            'status' => count($matches) > 0 ? 'matched' : 'no_matches',
            'matches' => $matches,
            'message' => count($matches) > 0 ? null : 'No close student matches were found.',
        ];
    }

    private function resolveUserFromExternalImageId(?string $externalImageId): ?User
    {
        if (! is_string($externalImageId) || ! str_starts_with($externalImageId, 'student:')) {
            return null;
        }

        $userId = (int) substr($externalImageId, strlen('student:'));

        return User::find($userId);
    }

    private function readDiskBytes(string $disk, string $path): string
    {
        $contents = Storage::disk($disk)->get($path);

        if ($contents === false) {
            throw new InvalidArgumentException("Unable to read image bytes from [{$disk}:{$path}].");
        }

        return $contents;
    }

    private function client(): RekognitionClient
    {
        return new RekognitionClient([
            'version' => 'latest',
            'region' => $this->config['region'],
            'credentials' => [
                'key' => $this->config['key'],
                'secret' => $this->config['secret'],
            ],
        ]);
    }

    private function collectionId(): string
    {
        return (string) $this->config['collection'];
    }

    private function ensureCollectionExists(): void
    {
        try {
            $this->client()->describeCollection([
                'CollectionId' => $this->collectionId(),
            ]);
        } catch (AwsException $e) {
            if ($e->getAwsErrorCode() === 'ResourceNotFoundException') {
                // Collection doesn't exist, create it
                $this->client()->createCollection([
                    'CollectionId' => $this->collectionId(),
                    'Tags' => [
                        'Application' => 'Sinag-Bughaw',
                        'Institution' => 'NU Lipa',
                    ],
                ]);
            } else {
                throw $e;
            }
        }
    }

    private function externalImageId(User $user): string
    {
        return 'student:'.$user->id;
    }
}
