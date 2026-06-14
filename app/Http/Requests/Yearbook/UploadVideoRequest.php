<?php

declare(strict_types=1);

namespace App\Http\Requests\Yearbook;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates HD video uploads.
 * Per-tier video size limits premium: 2 GB
 */
class UploadVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'album_id' => ['required', 'integer', 'exists:albums,id'],
            'video'    => ['required', 'file', 'mimes:mp4,mov,avi,webm', 'max:2097152'], // 2 GB HTTP cap
            'caption'  => ['nullable', 'string', 'max:255'],
            'visibility' => ['nullable', 'in:public,batchmates,friends,private'],
        ];
    }

    public function messages(): array
    {
        return [
            'video.required' => 'Please select a video file to upload.',
            'video.mimes'    => 'Only MP4, MOV, AVI, and WebM videos are accepted.',
            'video.max'      => 'Video may not exceed 2 GB.',
        ];
    }
}
