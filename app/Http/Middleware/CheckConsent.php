<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckConsent
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && ! $user->consent_accepted) {
            return response()->json([
                'message'       => 'You must accept the Privacy Policy to continue.',
                'requires_consent' => true,
            ], 403);
        }

        return $next($request);
    }
}