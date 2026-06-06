<?php

namespace App\Http\Middleware;

use App\Models\Subscription;
use App\Support\PlatformSettings;
use Closure;
use Illuminate\Http\Request;

class CheckSubscriptionAccess
{
    public function handle(Request $request, Closure $next)
    {
        if (! PlatformSettings::bool('enable_premium_subscription')) {
            $request->attributes->set('viewer_is_subscribed', true);
            $request->attributes->set('viewer_is_premium', true);
            $request->attributes->set('viewer_tier', 'premium');

            return $next($request);
        }

        $user = $request->user();
        $isSubscribed = false;
        $isPremium = false;
        $tier = 'free';

        if ($user) {
            $sub = Subscription::where('user_id', $user->id)->latest()->first();
            $isSubscribed = (bool) $sub?->isStandard();
            $isPremium = (bool) $sub?->isPremium();
            $tier = $sub?->isActive() ? ($sub->tier ?? 'free') : 'free';
        }

        $request->attributes->set('viewer_is_subscribed', $isSubscribed);
        $request->attributes->set('viewer_is_premium', $isPremium);
        $request->attributes->set('viewer_tier', $tier);

        return $next($request);
    }
}
