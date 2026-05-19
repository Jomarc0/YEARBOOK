<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'student_id'      => $this->student_id,
            'name'            => $this->name,
            'course'          => $this->course,
            'year_level'      => $this->year_level,
            'bio'             => $this->bio,
            'profile_picture' => $this->profile_picture,
            'profile_picture_url' => $this->profile_picture_url,
            'section'         => $this->whenLoaded('section', fn() => [
                'id'         => $this->section->id,
                'name'       => $this->section->name ?? null,
                'batch_year' => $this->section->batch_year ?? null,
            ]),
        ];
    }
}