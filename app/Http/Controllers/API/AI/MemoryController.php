<?php

namespace App\Http\Controllers\API\AI;

use App\Http\Controllers\Controller;
use App\Services\AI\MemoryRecommenderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemoryController extends Controller
{
    public function __construct(private MemoryRecommenderService $recommender) {}

    public function digest(Request $request): JsonResponse
    {
        if (! $request->user()) {
            return response()->json([
                'memories' => [],
                'items' => [],
                'recommendations' => [],
                'data' => [],
            ]);
        }

        $digest = $this->recommender->buildDigest($request->user());
        $memories = $digest['memories'] ?? [];

        return response()->json([
            'memories' => $memories,
            'items' => $memories,
            'recommendations' => $memories,
            'data' => $memories,
        ]);
    }

    public function onThisDay(Request $request): JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['data' => [
                'label' => 'On This Day',
                'uploaded' => [],
                'tagged' => [],
                'has_memories' => false,
            ]]);
        }

        $card = $this->recommender->onThisDay($request->user());
        return response()->json(['data' => $card]);
    }
}
