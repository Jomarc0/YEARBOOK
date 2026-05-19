<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VoiceNote;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class VoiceNoteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            VoiceNote::where('user_id', $request->user()->id)->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
            'title' => 'nullable|string|max:255',
        ]);

        $cloudinary = app(CloudinaryService::class);
        $result     = $cloudinary->uploadAudio(
            $request->file('audio')->getRealPath(),
            $request->user()->id
        );

        $note = VoiceNote::create([
            'user_id'              => $request->user()->id,
            'title'                => $request->title ?? 'Voice Memory',
            'audio_url'            => $result['secure_url'],
            'cloudinary_public_id' => $result['public_id'],
        ]);

        return response()->json($note, 201);
    }

    public function destroy(Request $request, int $id)
    {
        $note = VoiceNote::where('user_id', $request->user()->id)->findOrFail($id);
        $note->delete();
        return response()->json(['message' => 'Voice note deleted.']);
    }
}