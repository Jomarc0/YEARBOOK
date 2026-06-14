<?php

declare(strict_types=1);

namespace App\Http\Requests\Yearbook;

use Illuminate\Foundation\Http\FormRequest;

/**

 * Validates bulk photo uploads.
 * The hard per-tier file count limit  50 premium
 */
class BulkUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'album_id'  => ['required', 'integer', 'exists:albums,id'],
            'caption'   => ['nullable', 'string', 'max:255'],
            'visibility'=> ['nullable', 'in:public,batchmates,friends,private'],
            'photos'    => ['required', 'array', 'min:1', 'max:50'],
            'photos.*'  => ['file', 'mimes:jpeg,png,webp,gif,heic', 'max:51200'], // 50 MB HTTP cap
        ];
    }

    public function messages(): array
    {
        return [
            'photos.required'  => 'Please select at least one photo to upload.',
            'photos.max'       => 'You may not upload more than 50 photos at once.',
            'photos.*.mimes'   => 'Only JPEG, PNG, WebP, GIF, and HEIC photos are accepted.',
            'photos.*.max'     => 'Each photo may not exceed 50 MB.',
        ];
    }
}
