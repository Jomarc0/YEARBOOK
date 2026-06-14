<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $actor = $request->user();

        if ($actor instanceof Admin) {
            if (! $actor->is_active) {
                $request->user()?->currentAccessToken()?->delete();
                return response()->json(['message' => 'Admin account is inactive.'], 403);
            }
            if (Schema::hasColumn('admins', 'last_seen_at')) {
                $actor->forceFill(['last_seen_at' => now()])->saveQuietly();
            }
        }

        if ($actor instanceof User) {
            if (! empty($actor->suspended_at) || method_exists($actor, 'trashed') && $actor->trashed()) {
                $request->user()?->currentAccessToken()?->delete();
                return response()->json(['message' => 'Account is suspended or unavailable.'], 403);
            }
            if (Schema::hasColumn('users', 'last_seen_at')) {
                $actor->forceFill(['last_seen_at' => now()])->saveQuietly();
            }
        }

        return $next($request);
    }
}
