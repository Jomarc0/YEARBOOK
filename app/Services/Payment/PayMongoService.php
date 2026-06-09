<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private string $baseUrl      = 'https://api.paymongo.com/v1';
    private string $secretKey;
    private string $webhookSecret;

    public function __construct()
    {
        $this->secretKey     = config('services.paymongo.secret_key')
            ?? throw new \RuntimeException('PAYMONGO_SECRET_KEY is not set in .env');

        $this->webhookSecret = config('services.paymongo.webhook_secret')
            ?? throw new \RuntimeException('PAYMONGO_WEBHOOK_SECRET is not set in .env');
    }

    public function createCheckoutSession(
        int    $amount,
        string $plan,
        int    $userId,
        string $userEmail,
        string $currency = 'PHP',
        ?string $successUrl = null,
        ?string $cancelUrl = null
    ): array {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173'); // ← frontend, not APP_URL

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/checkout_sessions", [
                'data' => [
                    'attributes' => [
                        'billing'              => ['email' => $userEmail],
                        'line_items'           => [[
                            'currency' => $currency,
                            'amount'   => $amount,
                            'name'     => 'Sinag-Bughaw Premium – ' . ucfirst($plan),
                            'quantity' => 1,
                        ]],
                        'payment_method_types' => ['card', 'gcash', 'paymaya'],
                        'metadata'             => [
                            'user_id' => $userId,
                            'plan'    => $plan,
                        ],
                        'success_url' => $successUrl ?: $frontendUrl . '/payment/success',
                        'cancel_url'  => $cancelUrl ?: $frontendUrl . '/payment/cancel',
                        'description' => 'Sinag-Bughaw Premium Access',
                    ],
                ],
            ]);

        return $response->json();
    }

    public function retrieveCheckoutSession(string $sessionId): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->get("{$this->baseUrl}/checkout_sessions/{$sessionId}");

        return $response->json();
    }

    public function verifyWebhookSignature(?string $signatureHeader, string $rawBody): bool
    {
        if (! $signatureHeader || ! $this->webhookSecret) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $part) {
            [$k, $v]   = explode('=', $part, 2);
            $parts[$k] = $v;
        }

        $timestamp = $parts['t']  ?? null;
        $hash      = $parts['te'] ?? null;

        if (! $timestamp || ! $hash) {
            return false;
        }

        $payload  = $timestamp . '.' . $rawBody;
        $expected = hash_hmac('sha256', $payload, $this->webhookSecret);

        return hash_equals($expected, $hash);
    }
}
