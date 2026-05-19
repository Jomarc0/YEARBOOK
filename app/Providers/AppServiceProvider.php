<?php

namespace App\Providers;

use App\Contracts\FaceRecognition;
use App\Services\AwsRekognitionFaceRecognition;
use App\Services\PythonFaceRecognitionService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FaceRecognition::class, function () {
            $driver = config('services.face_recognition.driver', 'python');

            if ($driver === 'aws') {
                return new AwsRekognitionFaceRecognition([
                    'key'        => config('services.aws.key'),
                    'secret'     => config('services.aws.secret'),
                    'region'     => config('services.aws.region'),
                    'collection' => config('services.aws.rekognition_collection'),
                ]);
            }

            return new PythonFaceRecognitionService();
        });
    }

    public function boot(): void {}
}