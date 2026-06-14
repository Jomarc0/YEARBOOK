<?php

namespace App\Providers;

use App\Contracts\FaceRecognition;
use App\Contracts\StorageServiceInterface;
use App\Models\Photo;
use App\Observers\PhotoObserver;
use App\Policies\PhotoPolicy;
use App\Services\AI\AwsRekognitionFaceRecognition;
use App\Services\Notification\BrevoMailService;
use App\Services\Storage\CloudinaryService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Face Recognition
        $this->app->singleton(FaceRecognition::class, function () {
            return new AwsRekognitionFaceRecognition([
                'key'        => config('services.rekognition.key'),
                'secret'     => config('services.rekognition.secret'),
                'region'     => config('services.rekognition.region'),
                'collection' => config('services.rekognition.collection'),
                'threshold'  => config('services.rekognition.threshold', 90),
            ]);
        });

        // Storage / Cloudinary 
        $this->app->singleton(StorageServiceInterface::class, function () {
            $cloudName = config('services.cloudinary.cloud_name')
                        ?? env('CLOUDINARY_CLOUD_NAME');
            $apiKey    = config('services.cloudinary.api_key')
                        ?? env('CLOUDINARY_API_KEY');
            $apiSecret = config('services.cloudinary.api_secret')
                        ?? env('CLOUDINARY_API_SECRET');

            if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
                return new \App\Services\Storage\LocalStorageService();
            }

            return new CloudinaryService();
        });

        // Brevo email API
        $this->app->singleton(BrevoMailService::class, fn() => new BrevoMailService());

        // WatermarkService (yearbook PDF watermarking) 
        if (class_exists(\App\Services\Yearbook\WatermarkService::class)) {
            $this->app->singleton(
                \App\Services\Yearbook\WatermarkService::class,
                \App\Services\Yearbook\WatermarkService::class,
            );
        }
    }

    public function boot(): void
    {
        Photo::observe(PhotoObserver::class);

        // Policies 
        Gate::policy(Photo::class, PhotoPolicy::class);
    }
}
