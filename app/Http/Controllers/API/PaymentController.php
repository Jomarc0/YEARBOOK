<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{

    public function createIntent(Request $request)
    {
        $request->validate(['plan' => 'required|in:monthly,yearly']);

        $amount = match ($request->plan) {
            'monthly' => 19900,
            'yearly'  => 149900,
        };

        $result = app(PayMongoService::class)->createCheckoutSession(
            amount:    $amount,
            plan:      $request->plan,
            userId:    $request->user()->id,
            userEmail: $request->user()->email,
        );

        // Temporary — remove after debugging
        Log::info('PayMongo response', $result);

        $checkoutUrl = data_get($result, 'data.attributes.checkout_url');

        if (! $checkoutUrl) {
            return response()->json([
                'message' => 'Could not create checkout session.',
                'paymongo_error' => data_get($result, 'errors.0.detail') ?? $result,
            ], 422);
        }

        return response()->json([
            'checkout_url' => $checkoutUrl,
            'session_id'   => data_get($result, 'data.id'),
        ]);
    }

    public function webhook(Request $request)
    {
        // Temporarily disabled for debugging
        // $signature = $request->header('Paymongo-Signature');
        // if (! app(PayMongoService::class)->verifyWebhookSignature($signature, $request->getContent())) {
        //     Log::warning('PayMongo webhook: invalid signature');
        //     return response()->json(['error' => 'Invalid signature'], 401);
        // }

        Log::info('Webhook received', $request->all());

        $event = $request->json('data.attributes.type');

        if ($event === 'checkout_session.payment.paid') {
            $attributes = $request->json('data.attributes.data.attributes');
            $meta       = $attributes['metadata'] ?? [];
            $userId     = $meta['user_id'] ?? null;
            $plan       = $meta['plan']    ?? 'monthly';
            $intentId   = $attributes['payment_intent_id'] ?? null;
            $amountPaid = $attributes['amount'] ?? null;

            if (! $userId) {
                Log::warning('PayMongo webhook: missing user_id in metadata');
                return response()->json(['received' => true]);
            }

            Subscription::updateOrCreate(
                ['user_id' => $userId],
                [
                    'plan'                        => $plan,
                    'status'                      => 'active',
                    'paymongo_payment_intent_id'  => $intentId,
                    'amount_paid'                 => $amountPaid,
                    'expires_at'                  => $plan === 'yearly'
                        ? now()->addYear()
                        : now()->addMonth(),
                ]
            );
        }

        return response()->json(['received' => true]);
    }
    public function history(Request $request)
    {
        return response()->json(
            Subscription::where('user_id', $request->user()->id)->latest()->get()
        );
    }

    public function subscriptionStatus(Request $request)
    {
        $sub = Subscription::where('user_id', $request->user()->id)->latest()->first();

        return response()->json([
            'is_premium' => $sub?->isActive() ?? false,
            'plan'       => $sub?->plan       ?? 'free',
            'expires_at' => $sub?->expires_at,
        ]);
    }
}