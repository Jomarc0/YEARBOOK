<?php

namespace App\Http\Middleware;

use App\Models\Subscription;
use App\Support\PlatformSettings;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // ← ADD THIS

class CheckSubscriptionAccess
{
    public function handle(Request $request, Closure $next)
    {
        if (! PlatformSettings::bool('enable_premium_subscription')) {
            $request->attributes->set('viewer_is_subscribed', true);

            return $next($request);
        }

        $user = $request->user();

        $isSubscribed = false;

        if ($user) {
            $sub = Subscription::where('user_id', $user->id)->latest()->first();

            Log::info('Subscription debug', [
                'user_id'    => $user->id,
                'sub_found'  => $sub ? true : false,
                'tier'       => $sub?->tier,
                'status'     => $sub?->status,
                'expires_at' => $sub?->expires_at,
                'isPremium'  => $sub?->isPremium(),
                'isActive'   => $sub?->isActive(),
            ]);

            $isSubscribed = $sub && $sub->isPremium();
        }

        $request->attributes->set('viewer_is_subscribed', $isSubscribed);

        return $next($request);
    }
}