<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        // Pure API project — never redirect, always return 401 JSON
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }

        // SPA catch-all — React handles the /login route on the frontend
        return '/login';
    }
}