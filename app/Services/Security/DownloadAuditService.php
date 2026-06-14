<?php

declare(strict_types=1);

namespace App\Services\Security;

use App\Models\DownloadLog;
use Illuminate\Http\Request;

class DownloadAuditService
{
    public function record(Request $request, string $eventType, ?string $resourceType = null, ?int $resourceId = null, ?string $filename = null, array $metadata = []): void
    {
        $actor = $request->user();

        DownloadLog::create([
            'actor_type' => $actor ? $actor::class : null,
            'actor_id' => $actor?->id,
            'event_type' => $eventType,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'filename' => $filename,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1000),
            'metadata' => $metadata,
        ]);
    }
}
