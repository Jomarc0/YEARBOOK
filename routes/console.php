<?php

use App\Contracts\FaceRecognition;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('faces:sync-students', function (FaceRecognition $faceRecognition) {
    if (! $faceRecognition->isEnabled()) {
        $this->error('Face recognition is not configured. Set your AWS Rekognition environment values first.');

        return;
    }

    $summary = $faceRecognition->syncStudents(
        User::query()->whereNotNull('profile_picture')->where('profile_picture', '!=', '')->get()
    );

    $this->info('Indexed: '.$summary['indexed']);
    $this->line('Skipped: '.$summary['skipped']);

    if ($summary['errors'] !== []) {
        $this->warn('Errors: '.count($summary['errors']));
    }
})->purpose('Index student profile photos into the Rekognition collection.');
