<?php

namespace App\Http\Controllers\API\Social;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendNewMessageEmail;
use App\Jobs\SendPushNotification;
use App\Models\Message;
use App\Models\User;
use App\Models\UserNotification;
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
            ->with([
                'sender:id,name,first_name,last_name,profile_picture,student_record_id',
                'sender.studentRecord:id,course,photo',
                'receiver:id,name,first_name,last_name,profile_picture,student_record_id',
                'receiver.studentRecord:id,course,photo',
            ])
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

    public function participant(Request $request, int $userId): JsonResponse
    {
        $user = $this->resolveParticipant($request, $userId);

        return response()->json([
            'id' => $user->id,
            'name' => $this->displayName($user),
            'profile_picture' => $user->profile_picture,
            'course' => $user->course,
        ]);
    }

    public function thread(Request $request, int $userId): JsonResponse
    {
        $myId = $request->user()->id;
        $participant = $this->resolveParticipant($request, $userId);
        $userId = $participant->id;

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
            $senderName = $this->displayName($request->user());

            SendPushNotification::dispatch(
                $request->receiver_id,
                $senderName,
                $request->body,
                [
                    'type' => 'chat',
                    'sender_id' => (string) $request->user()->id,
                    'conversation_user_id' => (string) $request->user()->id,
                    'message_id' => (string) $message->id,
                    'sender_name' => $senderName,
                    'sender_avatar' => $request->user()->profile_picture,
                    'action_url' => rtrim(config('app.frontend_url'), '/') . '/messages/' . $request->user()->id,
                ],
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
                    senderName:     $this->displayName($request->user()),
                    messagePreview: $request->body,
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Message email notification failed: ' . $e->getMessage());
        }

        return response()->json($message->load('sender:id,name,first_name,last_name,profile_picture,student_record_id'), 201);
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
                senderName: $this->displayName($request->user()),
                isTyping:   $request->boolean('is_typing'),
            ))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('UserTyping broadcast failed: ' . $e->getMessage());
        }

        return response()->json(['ok' => true]);
    }

    private function displayName(User $user): string
    {
        return trim((string) $user->name)
            ?: trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''))
            ?: $user->email
            ?: 'Someone';
    }

    private function resolveParticipant(Request $request, int $id): User
    {
        $user = User::with('studentRecord')->find($id);
        if ($user) {
            return $user;
        }

        $message = Message::where('id', $id)
            ->where(function ($query) use ($request) {
                $query->where('sender_id', $request->user()->id)
                    ->orWhere('receiver_id', $request->user()->id);
            })
            ->first();

        if (! $message) {
            $notification = UserNotification::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $data = $notification->data ?? [];
            $senderId = $data['conversation_user_id'] ?? $data['sender_id'] ?? null;

            if ($senderId && User::whereKey($senderId)->exists()) {
                return User::with('studentRecord')->findOrFail($senderId);
            }

            $message = Message::where('receiver_id', $request->user()->id)
                ->where('body', $notification->body)
                ->latest()
                ->firstOrFail();
        }

        $participantId = $message->sender_id === $request->user()->id
            ? $message->receiver_id
            : $message->sender_id;

        return User::with('studentRecord')->findOrFail($participantId);
    }
}
