<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
        $middleware->alias([
            'premium'             => \App\Http\Middleware\CheckPremium::class,
            'consent'             => \App\Http\Middleware\CheckConsent::class,
            'visibility'          => \App\Http\Middleware\CheckProfileVisibility::class,
            'content.security'    => \App\Http\Middleware\ContentSecurityMiddleware::class,
            'subscription.access' => \App\Http\Middleware\CheckSubscriptionAccess::class,
        ]);
    })
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (
        \Illuminate\Auth\AuthenticationException $e,
        \Illuminate\Http\Request $request
    ) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    });

    $exceptions->render(function (
        \Symfony\Component\Routing\Exception\RouteNotFoundException $e,
        \Illuminate\Http\Request $request
    ) {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
    });
})->create();