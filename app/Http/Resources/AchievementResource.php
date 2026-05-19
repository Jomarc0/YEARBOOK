<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AchievementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'subtitle'     => $this->subtitle,
            'type'         => $this->type,
            'date_awarded' => $this->date_awarded?->format('M d, Y'),
        ];
    }
}