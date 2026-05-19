<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateTranscript;
use App\Models\Transcript;
use Illuminate\Http\Request;

class TranscriptController extends Controller
{
    public function index()
    {
        return response()->json(
            Transcript::where('status', 'done')->latest()->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimes:mp3,wav,m4a,ogg|max:51200',
            'title' => 'required|string|max:255',
        ]);

        $path = $request->file('audio')->store('transcripts', 'public');

        $transcript = Transcript::create([
            'title'       => $request->title,
            'audio_path'  => $path,
            'status'      => 'pending',
            'uploaded_by' => $request->user()->id,
        ]);

        GenerateTranscript::dispatch($transcript);

        return response()->json([
            'message'    => 'Audio uploaded. Transcription queued.',
            'transcript' => $transcript,
        ], 202);
    }

    public function show(Transcript $transcript)
    {
        return response()->json($transcript);
    }
}