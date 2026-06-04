<?php

namespace App\Http\Middleware;

use App\Support\PlatformSettings;
use Closure;
use Illuminate\Http\Request;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next)
    {
        if (! PlatformSettings::bool('maintenance_mode')) {
            return $next($request);
        }

        if ($request->is('api/admin/*') || $request->is('api/admin')) {
            return $next($request);
        }

        if ($request->is('api/app-config')) {
            return $next($request);
        }

        return PlatformSettings::maintenanceResponse();
    }
}
