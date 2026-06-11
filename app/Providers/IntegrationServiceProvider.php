<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\FaceRecognition;
use App\Contracts\StorageServiceInterface;
use App\Contracts\TranscriptionServiceInterface;
use App\Services\AI\AwsRekognitionFaceRecognition;
use App\Services\AI\TranscriptionService;
use App\Services\Storage\CloudinaryService;
use Illuminate\Support\ServiceProvider;

class IntegrationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Storage 
        $this->app->singleton(
            StorageServiceInterface::class,
            CloudinaryService::class
        );

        //Face Recognition ─
        $this->app->singleton(
            FaceRecognition::class,
            fn () => new AwsRekognitionFaceRecognition([
                'key'    => config('services.aws.key',    env('AWS_ACCESS_KEY_ID')),
                'secret' => config('services.aws.secret', env('AWS_SECRET_ACCESS_KEY')),
                'region' => config('services.aws.region', env('AWS_DEFAULT_REGION', 'ap-southeast-2')),
                'collection' => env('AWS_REKOGNITION_COLLECTION', 'nu-lipa-yearbook'),
            ])
        );
        // Transcription (Groq Whisper) 
        $this->app->singleton(
            TranscriptionServiceInterface::class,
            TranscriptionService::class
        );
        
    }

    public function boot(): void {}
}