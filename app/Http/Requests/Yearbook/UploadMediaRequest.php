<?php

declare(strict_types=1);

namespace App\Http\Requests\Yearbook;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates single and bulk media uploads.
 */
class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Single upload
            'file'          => ['sometimes', 'file', 'max:102400'],  // 100 MB HTTP cap
            'folder'        => ['sometimes', 'string', 'max:100', 'alpha_dash'],

            //  Bulk upload
            'files'         => ['sometimes', 'array', 'min:1', 'max:50'],
            'files.*'       => ['file', 'max:102400'],
            'bulk_folder'   => ['sometimes', 'string', 'max:100', 'alpha_dash'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.max'      => 'The uploaded file may not be larger than 100 MB.',
            'files.max'     => 'You may not upload more than 50 files at once.',
            'files.*.max'   => 'Each file may not be larger than 100 MB.',
        ];
    }
}