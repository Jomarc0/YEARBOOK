<?php
namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Jobs\SendPushNotification;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index()
    {
        return response()->json(Announcement::latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'    => 'required|string|max:255',
            'body'     => 'required|string',
            'type'     => 'nullable|in:general,event,graduation,alert',
            'send_push'=> 'boolean',
        ]);

        $announcement = Announcement::create([
            'title'      => $request->title,
            'body'       => $request->body,
            'type'       => $request->type ?? 'general',
            'send_push'  => $request->send_push ?? true,
            'created_by' => $request->user()->id,
        ]);

        // Send push to all users if enabled
        if ($announcement->send_push) {
            $userIds = \App\Models\User::whereNotNull('fcm_token')->pluck('id');
            foreach ($userIds as $userId) {
                SendPushNotification::dispatch(
                    $userId,
                    $announcement->title,
                    $announcement->body,
                    ['type' => 'announcement', 'id' => $announcement->id],
                    'announcement'
                );
            }
        }

        return response()->json($announcement, 201);
    }
}