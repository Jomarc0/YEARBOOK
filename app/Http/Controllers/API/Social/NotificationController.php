<?php

namespace App\Http\Controllers\API\Social;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Notifications\DatabaseNotification;
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
        $custom = UserNotification::where('user_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (UserNotification $notification) => [
            'id' => 'custom:' . $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'body' => $notification->body,
            'data' => $notification->data,
            'is_read' => $notification->is_read,
            'read_at' => $notification->is_read ? $notification->updated_at?->toIso8601String() : null,
            'created_at' => $notification->created_at?->toIso8601String(),
        ]);

        $database = DatabaseNotification::query()
            ->where('notifiable_type', get_class($request->user()))
            ->where('notifiable_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(function (DatabaseNotification $notification) {
                $data = $notification->data ?? [];

                return [
                    'id' => 'database:' . $notification->id,
                    'type' => $data['type'] ?? class_basename($notification->type),
                    'title' => $data['title'] ?? $data['message'] ?? 'Notification',
                    'body' => $data['body'] ?? $data['message'] ?? '',
                    'data' => $data,
                    'is_read' => filled($notification->read_at),
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at?->toIso8601String(),
                ];
            });

        $items = $custom
            ->concat($database)
            ->sortByDesc('created_at')
            ->values()
            ->take(20);

        return response()->json([
            'data' => $items,
            'current_page' => 1,
            'last_page' => 1,
            'total' => $items->count(),
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        if (str_starts_with($id, 'database:')) {
            DatabaseNotification::query()
                ->where('notifiable_type', get_class($request->user()))
                ->where('notifiable_id', $request->user()->id)
                ->where('id', substr($id, strlen('database:')))
                ->firstOrFail()
                ->markAsRead();
        } else {
            $customId = str_starts_with($id, 'custom:')
                ? substr($id, strlen('custom:'))
                : $id;

            UserNotification::where('user_id', $request->user()->id)
                ->findOrFail($customId)
                ->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAll(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        DatabaseNotification::query()
            ->where('notifiable_type', get_class($request->user()))
            ->where('notifiable_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
