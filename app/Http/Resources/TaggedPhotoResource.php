<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaggedPhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'photo_id'   => $this->photo_id,
            'similarity' => $this->similarity,
            'confidence' => $this->confidence,
            'source'     => $this->source,   // 'rekognition' | 'manual'
            'status'     => $this->status,
            'tagged_at'  => $this->created_at?->toIso8601String(),

            'user' => $this->whenLoaded('user', fn () => [
                'id'              => $this->user->id,
                'name'            => $this->user->name,
                'student_id'      => $this->user->student_id,
                'course'          => $this->user->course,
                'profile_picture' => $this->user->profile_picture,
            ]),
        ];
    }
}