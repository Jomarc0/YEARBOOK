<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RequireSuperAdmin applied ONLY on top of AdminOnly.
 */
class RequireSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isSuperAdmin()) {
            return response()->json([
                'message' => 'Access denied. Super admin privileges required.',
            ], 403);
        }

        return $next($request);
    }
}