<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Transforms a Cloudinary upload response array into a standardised API payload.
 *
 * Used for both single uploads and each item inside a bulk upload collection.
 */
class MediaResource extends JsonResource
{
    /**
     * @param  Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string,mixed> $resource */
        $resource = $this->resource;

        return [
            'public_id'     => $resource['public_id']     ?? null,
            'url'           => $resource['secure_url']    ?? null,
            'resource_type' => $resource['resource_type'] ?? 'image',
            'format'        => $resource['format']        ?? null,
            'size_bytes'    => $resource['bytes']         ?? 0,
            'width'         => $resource['width']         ?? null,
            'height'        => $resource['height']        ?? null,
            'duration'      => $resource['duration']      ?? null,
            'uploaded_at'   => $resource['created_at']   ?? null,
        ];
    }
}