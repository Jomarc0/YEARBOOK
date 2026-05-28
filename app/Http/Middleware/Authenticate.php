<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        // API requests (axios sends Accept: application/json) get a
        // clean 401 JSON response instead of a redirect to /login
        return $request->expectsJson() ? null : '/login';
    }
}