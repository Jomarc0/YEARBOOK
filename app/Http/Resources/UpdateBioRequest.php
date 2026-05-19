<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth already enforced via Sanctum middleware
    }

    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'bio.max' => 'Your quote must not exceed 255 characters.',
        ];
    }
}