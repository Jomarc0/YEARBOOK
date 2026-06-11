<?php

namespace App\Http\Requests\VoiceNote;

use Illuminate\Foundation\Http\FormRequest;

class SendVoiceNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'audio'            => 'required|file|mimes:mp3,wav,m4a,mp4,ogg,webm|max:20480',
            'recipient_id'     => 'required|integer|exists:users,id',
            'title'            => 'nullable|string|max:255',
            'duration_seconds' => 'nullable|integer|min:1|max:300',
        ];
    }

    public function messages(): array
    {
        return [
            'audio.required'        => 'Please attach an audio recording.',
            'audio.mimes'           => 'Audio must be MP3, WAV, M4A, MP4, OGG, or WebM.',
            'audio.max'             => 'Audio file must be under 20MB.',
            'recipient_id.required' => 'Please select a recipient.',
            'recipient_id.exists'   => 'That student does not exist.',
        ];
    }
}
