<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Jobs\SendPushNotification;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function conversations(Request $request)
        {
            $userId = $request->user()->id;

            $seen = [];
            $conversations = Message::query()
                ->where('sender_id', $userId)
                ->orWhere('receiver_id', $userId)
                ->with(['sender:id,name,profile_picture', 'receiver:id,name,profile_picture'])
                ->latest()
                ->get()
                ->filter(function ($message) use ($userId, &$seen) {
                    $otherId = $message->sender_id === $userId
                        ? $message->receiver_id
                        : $message->sender_id;

                    if (isset($seen[$otherId])) return false;
                    $seen[$otherId] = true;
                    return true;
                })
                ->map(function ($message) use ($userId) {
                    $other = $message->sender_id === $userId
                        ? $message->receiver
                        : $message->sender;

                    return [
                        'id'           => $message->id,
                        'body'         => $message->body,
                        'is_read'      => $message->is_read,
                        'created_at'   => $message->created_at->toISOString(),
                        'other_user'   => $other,
                        'unread_count' => Message::where('sender_id', $other->id)
                            ->where('receiver_id', $userId)
                            ->where('is_read', false)
                            ->count(),
                    ];
                })
                ->values();

            return response()->json($conversations);
        }

        // Add this new method — used for notification badge
        public function unreadCount(Request $request)
        {
            $count = Message::where('receiver_id', $request->user()->id)
                ->where('is_read', false)
                ->count();

            return response()->json(['unread_count' => $count]);
        }

    public function thread(Request $request, int $userId)
    {
        $myId = $request->user()->id;

        $messages = Message::query()
            ->where(fn($q) => $q->where('sender_id', $myId)->where('receiver_id', $userId))
            ->orWhere(fn($q) => $q->where('sender_id', $userId)->where('receiver_id', $myId))
            ->orderBy('created_at')
            ->paginate(50);

        Message::where('sender_id', $userId)
            ->where('receiver_id', $myId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json($messages);
    }

    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body'        => 'required|string|max:5000',
        ]);

        $message = Message::create([
            'sender_id'   => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body,
        ]);

        broadcast(new MessageSent($message))->toOthers();

        SendPushNotification::dispatch(
            $request->receiver_id,
            $request->user()->name,
            $request->body,
            ['type' => 'chat', 'sender_id' => $request->user()->id],
            'chat'
        );

        return response()->json($message->load('sender'), 201);
    }

    public function markRead(Request $request, int $id)
    {
        $message = Message::where('receiver_id', $request->user()->id)->findOrFail($id);
        $message->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read.']);
    }
}