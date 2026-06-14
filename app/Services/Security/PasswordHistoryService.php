<?php

declare(strict_types=1);

namespace App\Services\Security;

use App\Models\PasswordHistory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PasswordHistoryService
{
    public function assertNotRecentlyUsed(User $user, string $plainPassword, int $historyLimit = 5): void
    {
        $hashes = collect([$user->password])
            ->merge(
                PasswordHistory::where('user_id', $user->id)
                    ->latest()
                    ->limit($historyLimit)
                    ->pluck('password')
            )
            ->filter();

        foreach ($hashes as $hash) {
            if (Hash::check($plainPassword, $hash)) {
                throw ValidationException::withMessages([
                    'password' => ['You cannot reuse your current or recent passwords.'],
                ]);
            }
        }
    }

    public function remember(User $user, ?string $previousHash, int $historyLimit = 5): void
    {
        if ($previousHash) {
            PasswordHistory::create([
                'user_id' => $user->id,
                'password' => $previousHash,
            ]);
        }

        $idsToKeep = PasswordHistory::where('user_id', $user->id)
            ->latest()
            ->limit($historyLimit)
            ->pluck('id');

        PasswordHistory::where('user_id', $user->id)
            ->whereNotIn('id', $idsToKeep)
            ->delete();
    }
}
