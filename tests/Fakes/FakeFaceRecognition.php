<?php

namespace Tests\Fakes;

use App\Contracts\FaceRecognition;
use App\Models\User;
use Illuminate\Http\UploadedFile;

class FakeFaceRecognition implements FaceRecognition
{
    public array $indexedUserIds = [];

    public function isEnabled(): bool
    {
        return true;
    }

    public function indexStudent(User $user): array
    {
        $this->indexedUserIds[] = $user->id;

        return [
            'indexed' => true,
            'external_image_id' => 'student:'.$user->id,
        ];
    }

    public function syncStudents(iterable $students): array
    {
        $count = 0;

        foreach ($students as $student) {
            $this->indexStudent($student);
            $count++;
        }

        return [
            'indexed' => $count,
            'skipped' => 0,
            'errors' => [],
        ];
    }

    public function analyzePhoto(string $disk, string $path): array
    {
        $student = User::query()->whereNotNull('student_id')->first();

        return [
            'status' => 'analyzed',
            'provider' => 'fake',
            'face_count' => 1,
            'faces' => [[
                'confidence' => 99.5,
                'bounding_box' => [
                    'width' => 0.2,
                    'height' => 0.2,
                    'left' => 0.3,
                    'top' => 0.2,
                ],
            ]],
            'matches' => $student ? [[
                'user_id' => $student->id,
                'name' => $student->name,
                'student_id' => $student->student_id,
                'course' => $student->course,
                'profile_picture' => $student->profile_picture,
                'similarity' => 98.8,
                'confidence' => 99.1,
                'external_image_id' => 'student:'.$student->id,
            ]] : [],
            'limitations' => [],
        ];
    }

    public function searchUploadedFace(UploadedFile $file, int $maxMatches = 5): array
    {
        $student = User::query()->whereNotNull('student_id')->first();

        return [
            'status' => $student ? 'matched' : 'no_matches',
            'matches' => $student ? [[
                'user_id' => $student->id,
                'name' => $student->name,
                'student_id' => $student->student_id,
                'course' => $student->course,
                'profile_picture' => $student->profile_picture,
                'similarity' => 98.8,
                'confidence' => 99.1,
                'external_image_id' => 'student:'.$student->id,
            ]] : [],
            'message' => $student ? null : 'No close student matches were found.',
        ];
    }
}
