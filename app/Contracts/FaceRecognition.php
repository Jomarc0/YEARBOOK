<?php

namespace App\Contracts;

use App\Models\User;
use Illuminate\Http\UploadedFile;

interface FaceRecognition
{
    public function isEnabled(): bool;

    public function indexStudent(User $user): array;

    public function syncStudents(iterable $students): array;

    public function analyzePhoto(string $disk, string $path): array;

    public function searchUploadedFace(UploadedFile $file, int $maxMatches = 5): array;
}