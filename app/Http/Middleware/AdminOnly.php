<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Admin;

class AdminOnly
{
    public function handle(Request $request, Closure $next)
    {
        // The token must belong to an Admin model instance
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);

        if (!$accessToken || !($accessToken->tokenable instanceof Admin)) {
            return response()->json(['message' => 'Forbidden. Admin access only.'], 403);
        }

        return $next($request);
    }
}