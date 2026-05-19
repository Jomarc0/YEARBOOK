<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // 5MB max
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Please select a photo to upload.',
            'photo.image'    => 'The file must be an image.',
            'photo.mimes'    => 'Only JPEG, PNG, JPG, and WebP formats are allowed.',
            'photo.max'      => 'Photo size must not exceed 5MB.',
        ];
    }
}