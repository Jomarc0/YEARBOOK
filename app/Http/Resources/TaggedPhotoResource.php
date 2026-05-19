<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaggedPhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'photo_url'   => $this->photo_url,
            'caption'     => $this->caption,
            'status'      => $this->status,
            'uploaded_by' => $this->whenLoaded('uploader', fn() => [
                'id'   => $this->uploader->id,
                'name' => $this->uploader->name,
            ]),
            'created_at'  => $this->created_at->diffForHumans(),
        ];
    }
}