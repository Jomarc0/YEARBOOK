<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseService
{
    public function sendToDevice(string $token, string $title, string $body, array $data = []): bool
    {
        $credentials = config('services.firebase.credentials');

        if (! $credentials || ! file_exists($credentials)) {
            Log::info('Firebase push skipped: service account credentials are not configured.');
            return false;
        }

        $messaging = (new Factory())
            ->withServiceAccount($credentials)
            ->createMessaging();

        $message = CloudMessage::withTarget('token', $token)
            ->withNotification(Notification::create($title, $body))
            ->withData(collect($data)->mapWithKeys(
                fn ($value, $key) => [(string) $key => is_scalar($value) ? (string) $value : json_encode($value)]
            )->all());

        $messaging->send($message);

        return true;
    }
}
