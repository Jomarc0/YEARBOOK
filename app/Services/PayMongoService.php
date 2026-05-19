<?php

namespace App\Services;

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

    /**
     * Create a hosted CheckoutSession.
     * The user is redirected to checkout.paymongo.com — no JS SDK needed.
     */
    public function createCheckoutSession(
        int    $amount,
        string $plan,
        int    $userId,
        string $userEmail,
        string $currency = 'PHP'
    ): array {
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
                        'success_url'          => config('app.url') . '/payment/success',
                        'cancel_url'           => config('app.url') . '/payment/cancel',
                        'description'          => 'Sinag-Bughaw Premium Access',
                    ],
                ],
            ]);

        return $response->json();
    }

    /**
     * Verify that a webhook request genuinely came from PayMongo.
     * PayMongo sends a HMAC-SHA256 signature in the Paymongo-Signature header.
     */
    public function verifyWebhookSignature(?string $signatureHeader, string $rawBody): bool
    {
        if (! $signatureHeader || ! $this->webhookSecret) {
            return false;
        }

        // Header format: "t=<timestamp>,te=<hash>,li=<hash>"
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