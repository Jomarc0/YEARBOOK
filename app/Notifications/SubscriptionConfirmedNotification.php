<?php

namespace App\Notifications;

use App\Jobs\Notification\SendSubscriptionConfirmedEmail;
use App\Jobs\SendPushNotification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SubscriptionConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string  $planName,
        public string  $expiryDate,
        public ?string $actionUrl = null,
    ) {}

    public function via(object $notifiable): array
    {
        return [];
    }

    /**
     * Usage:
     *   SubscriptionConfirmedNotification::dispatchFor($user, $planName, $expiryDate, $actionUrl);
     */
    public static function dispatchFor(
        User    $user,
        string  $planName,
        string  $expiryDate,
        ?string $actionUrl = null,
    ): void {
        // 1. In-app + FCM push
        SendPushNotification::dispatch(
            userId: $user->id,
            title:  '🎉 Subscription Activated!',
            body:   "Your {$planName} plan is now active until {$expiryDate}.",
            data:   [
                'type'        => 'subscription_confirmed',
                'plan_name'   => $planName,
                'expiry_date' => $expiryDate,
                'action_url'  => $actionUrl ?? '',
            ],
            type: 'subscription_confirmed',
        );

        // 2. Email
        if ($user->email) {
            SendSubscriptionConfirmedEmail::dispatch(
                email:      $user->email,
                name:       $user->name ?? $user->email,
                planName:   $planName,
                expiryDate: $expiryDate,
                actionUrl:  $actionUrl,
            );
        }
    }
}