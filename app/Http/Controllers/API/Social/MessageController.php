<?php

namespace App\Http\Controllers\API\Social;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendNewMessageEmail;
use App\Jobs\SendPushNotification;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    // ── Conversations list ────────────────────────────────────────────────────

    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $seen   = [];

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

                if (!$otherId)              return false;
                if (isset($seen[$otherId])) return false;

                $seen[$otherId] = true;
                return true;
            })
            ->map(function ($message) use ($userId) {
                $other = $message->sender_id === $userId
                    ? $message->receiver
                    : $message->sender;

                if (!$other) return null;

                return [
                    'id'           => $message->id,
                    'body'         => $message->body,
                    'is_read'      => $message->is_read,
                    'sender_id'    => $message->sender_id,
                    'receiver_id'  => $message->receiver_id,
                    'created_at'   => $message->created_at->toISOString(),
                    'sender'       => $message->sender,
                    'receiver'     => $message->receiver,
                    'other_user'   => $other,
                    'unread_count' => Message::where('sender_id', $other->id)
                        ->where('receiver_id', $userId)
                        ->where('is_read', false)
                        ->count(),
                ];
            })
            ->filter()
            ->values();

        return response()->json($conversations);
    }

    // ── Unread badge count ────────────────────────────────────────────────────

    public function unreadCount(Request $request): JsonResponse
    {
        $count = Message::unreadFor($request->user()->id)->count();
        return response()->json(['unread_count' => $count]);
    }

    // ── Thread ────────────────────────────────────────────────────────────────

    public function thread(Request $request, int $userId): JsonResponse
    {
        $myId = $request->user()->id;

        $messages = Message::thread($myId, $userId)
            ->with('sender:id,name,profile_picture')
            ->orderBy('created_at')
            ->paginate(50);

        Message::where('sender_id', $userId)
            ->where('receiver_id', $myId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json($messages);
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    public function send(Request $request): JsonResponse
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

        // ── Broadcast (realtime) ──────────────────────────────────────────────
        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('MessageSent broadcast failed: ' . $e->getMessage());
        }

        // ── Push notification ─────────────────────────────────────────────────
        try {
            SendPushNotification::dispatch(
                $request->receiver_id,
                $request->user()->name,
                $request->body,
                ['type' => 'chat', 'sender_id' => $request->user()->id],
                'chat'
            );
        } catch (\Throwable $e) {
            Log::warning('Push notification failed: ' . $e->getMessage());
        }

        // ── Email notification ────────────────────────────────────────────────
        try {
            $receiver = User::find($request->receiver_id);
            if ($receiver?->email) {
                SendNewMessageEmail::dispatch(
                    email:          $receiver->email,
                    name:           $receiver->name ?? $receiver->email,
                    senderName:     $request->user()->name,
                    messagePreview: $request->body,
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Message email notification failed: ' . $e->getMessage());
        }

        return response()->json($message->load('sender:id,name,profile_picture'), 201);
    }

    // ── Mark read ─────────────────────────────────────────────────────────────

    public function markRead(Request $request, int $id): JsonResponse
    {
        $message = Message::where('receiver_id', $request->user()->id)->findOrFail($id);

        $message->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Marked as read.']);
    }

    // ── Typing indicator ──────────────────────────────────────────────────────

    public function typing(Request $request): JsonResponse
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'is_typing'   => 'required|boolean',
        ]);

        try {
            broadcast(new UserTyping(
                senderId:   $request->user()->id,
                receiverId: $request->receiver_id,
                senderName: $request->user()->name,
                isTyping:   $request->boolean('is_typing'),
            ))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('UserTyping broadcast failed: ' . $e->getMessage());
        }

        return response()->json(['ok' => true]);
    }
}