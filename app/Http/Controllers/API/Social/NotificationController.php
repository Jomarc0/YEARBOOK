<?php

namespace App\Http\Controllers\API\Social;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function registerToken(Request $request)
    {
        $request->validate(['fcm_token' => 'required|string|max:512']);
        $request->user()->update(['fcm_token' => $request->fcm_token]);
        return response()->json(['message' => 'FCM token registered.']);
    }

    public function index(Request $request)
    {
        return response()->json(
            UserNotification::where('user_id', $request->user()->id)->latest()->paginate(20)
        );
    }

    public function markRead(Request $request, int $id)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->findOrFail($id)
            ->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read.']);
    }
}