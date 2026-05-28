<?php

namespace App\Http\Controllers\API\Analytics;

use App\Http\Controllers\Controller;
use App\Services\Analytics\EngagementAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private readonly EngagementAnalyticsService $analytics
    ) {}

    public function summary(): JsonResponse
    {
        return response()->json($this->analytics->summary());
    }

    public function topViewed(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->query('limit', 10), 50));
        return response()->json(['data' => $this->analytics->topViewed($limit)]);
    }

    public function trending(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->query('limit', 10), 50));
        return response()->json(['data' => $this->analytics->trending($limit)]);
    }

    public function myStats(Request $request): JsonResponse
    {
        return response()->json($this->analytics->myStats($request->user()));
    }

    public function myStatsTrend(Request $request): JsonResponse
    {
        $days = max(7, min((int) $request->query('days', 30), 90));
        return response()->json(['data' => $this->analytics->weeklyTrend($request->user()->id, $days)]);
    }

    public function batchmates(Request $request): JsonResponse
    {
        return response()->json($this->analytics->batchmateStats($request->user()));
    }

    public function platform(): JsonResponse
    {
        return response()->json($this->analytics->platformEngagement());
    }

    // ── Called by StudentProfileView on every genuine visit ──────────────────
    public function recordView(Request $request, int $userId): JsonResponse
    {
        $this->analytics->recordView(
            viewedUserId: $userId,
            viewerUserId: $request->user()?->id, // null for guests
            ipAddress:    $request->ip()
        );

        return response()->json(['recorded' => true]);
    }
}