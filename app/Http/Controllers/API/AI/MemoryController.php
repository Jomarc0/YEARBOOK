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
        $digest = $this->recommender->buildDigest($request->user());
        return response()->json(['data' => $digest]);
    }

    public function onThisDay(Request $request): JsonResponse
    {
        $card = $this->recommender->onThisDay($request->user());
        return response()->json(['data' => $card]);
    }
}