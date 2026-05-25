<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\MemoryReminderNotification;
use App\Services\AI\MemoryRecommenderService;
use Illuminate\Console\Command;

class SendMemoryDigest extends Command
{
    protected $signature   = 'memories:send-digest';
    protected $description = 'Send daily memory digest notifications to all students';

    public function handle(MemoryRecommenderService $recommender): void
    {
        $this->info('Building memory digests...');

        // Only notify students who accepted consent
        User::where('role', 'student')
            ->where('consent_accepted', true)
            ->chunkById(100, function ($users) use ($recommender) {
                foreach ($users as $user) {
                    $digest = $recommender->buildDigest($user);

                    // Skip silently if there's nothing to show
                    $hasContent = ! empty($digest['on_this_day']['uploaded'])
                               || ! empty($digest['on_this_day']['tagged'])
                               || ! empty($digest['tagged_photos']['photos'])
                               || ! empty($digest['graduation']['photos']);

                    if (! $hasContent) continue;

                    $user->notify(new MemoryReminderNotification($digest));
                }
            });

        $this->info('Memory digests sent.');
    }
}