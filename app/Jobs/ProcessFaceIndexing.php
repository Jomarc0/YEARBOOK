<?php

namespace App\Jobs;

use App\Contracts\FaceRecognition;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessFaceIndexing implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;
    public int $tries   = 3;

    public function __construct(public User $user) {}

    public function handle(FaceRecognition $faceRecognition): void
    {
        if (! $faceRecognition->isEnabled()) return;

        $result = $faceRecognition->indexStudent($this->user);
        Log::info('Face indexing', ['user_id' => $this->user->id, 'result' => $result]);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("Face indexing failed for user {$this->user->id}: " . $e->getMessage());
    }
}