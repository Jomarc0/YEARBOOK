<?php

namespace App\Http\Controllers\API\Social;

use App\Events\UserPresenceUpdated;
use App\Http\Controllers\Controller;
use App\Models\UserPresence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PresenceController extends Controller
{
    /**
     * Called by frontend on mount (online) and beforeunload (offline).
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'is_online' => 'required|boolean',
        ]);

        $presence = UserPresence::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'is_online'    => $request->boolean('is_online'),
                'last_seen_at' => now(),
            ]
        );

        try {
            broadcast(new UserPresenceUpdated(
                userId:     $request->user()->id,
                isOnline:   $presence->is_online,
                lastSeenAt: $presence->last_seen_at->toISOString(),
            ));
        } catch (\Throwable $e) {
            Log::warning('UserPresenceUpdated broadcast failed: ' . $e->getMessage());
        }

        return response()->json(['ok' => true]);
    }
    /**
     * Bulk-fetch presence for a list of user IDs .
     */
    public function bulk(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids'   => 'required|array|max:100',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $presence = UserPresence::whereIn('user_id', $request->user_ids)
            ->get(['user_id', 'is_online', 'last_seen_at'])
            ->keyBy('user_id');

        return response()->json($presence);
    }
}