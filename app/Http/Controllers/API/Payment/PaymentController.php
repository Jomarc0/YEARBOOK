<?php

namespace App\Http\Controllers\API\Payment;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Services\Payment\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private array $plans = [
        'standard_monthly' => ['tier' => 'standard', 'amount' => 9900,   'duration' => 'month'],
        'standard_yearly'  => ['tier' => 'standard', 'amount' => 79900,  'duration' => 'year' ],
        'premium_monthly'  => ['tier' => 'premium',  'amount' => 19900,  'duration' => 'month'],
        'premium_yearly'   => ['tier' => 'premium',  'amount' => 149900, 'duration' => 'year' ],
    ];

    public function createIntent(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:standard_monthly,standard_yearly,premium_monthly,premium_yearly',
        ]);

        $planKey = $request->plan;
        $plan    = $this->plans[$planKey];

        $result = app(PayMongoService::class)->createCheckoutSession(
            amount:    $plan['amount'],
            plan:      $planKey,
            userId:    $request->user()->id,
            userEmail: $request->user()->email,
        );

        Log::info('PayMongo response', $result);

        $checkoutUrl = data_get($result, 'data.attributes.checkout_url');

        if (! $checkoutUrl) {
            return response()->json([
                'message'        => 'Could not create checkout session.',
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
        Log::info('Webhook RAW payload', $request->all()); // ← temporary, remove after debugging

        $type = $request->json('data.attributes.type');

        if ($type === 'checkout_session.payment.paid') {

            $sessionAttributes = $request->json('data.attributes.data.attributes');
            $meta              = $sessionAttributes['metadata']          ?? [];
            $userId            = $meta['user_id']                        ?? null;
            $planKey           = $meta['plan']                           ?? 'standard_monthly';
            $intentId          = $sessionAttributes['payment_intent_id'] ?? null;
            $amountPaid        = $sessionAttributes['amount_due']        ?? null;

            Log::info('Parsed webhook data', [
                'user_id'   => $userId,
                'plan'      => $planKey,
                'intent_id' => $intentId,
                'amount'    => $amountPaid,
            ]);

            if (! $userId) {
                Log::warning('PayMongo webhook: missing user_id in metadata');
                return response()->json(['received' => true]);
            }

            $plan = $this->plans[$planKey] ?? $this->plans['standard_monthly'];

            Subscription::updateOrCreate(
                ['user_id' => $userId],
                [
                    'plan'                       => $planKey,
                    'tier'                       => $plan['tier'],
                    'status'                     => 'active',
                    'paymongo_payment_intent_id' => $intentId,
                    'amount_paid'                => $amountPaid,
                    'expires_at'                 => $plan['duration'] === 'year'
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
            'is_active'   => $sub?->isActive()  ?? false,
            'is_standard' => $sub?->isStandard() ?? false,
            'is_premium'  => $sub?->isPremium()  ?? false,
            'tier'        => $sub?->tier         ?? 'free',
            'plan'        => $sub?->plan         ?? null,
            'expires_at'  => $sub?->expires_at,
        ]);
    }
}