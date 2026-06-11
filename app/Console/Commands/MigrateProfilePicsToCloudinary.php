<?php

namespace App\Console\Commands;

use App\Contracts\StorageServiceInterface;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateProfilePicsToCloudinary extends Command
{
    protected $signature   = 'migrate:profile-pics-to-cloudinary';
    protected $description = 'Upload all local profile_pics to Cloudinary and update DB URLs';

    public function handle(StorageServiceInterface $storage): void
    {
        $users = User::whereNotNull('profile_picture')
            ->where('profile_picture', 'not like', 'http%') 
            ->get();

        $this->info("Found {$users->count()} users with local profile pictures.");
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        $success = 0;
        $failed  = 0;

        foreach ($users as $user) {
            try {
                $localPath = storage_path('app/public/' . $user->profile_picture);

                if (!file_exists($localPath)) {
                    $this->newLine();
                    $this->warn("  Skipped {$user->name} — file not found: {$localPath}");
                    $failed++;
                    $bar->advance();
                    continue;
                }

                // Create a temporary UploadedFile-like object
                $tmpFile = new \Illuminate\Http\UploadedFile(
                    $localPath,
                    basename($localPath),
                    mime_content_type($localPath),
                    null,
                    true // mark as already uploaded 
                );

                // Upload to Cloudinary
                $result = $storage->uploadPhoto(
                    file:   $tmpFile,
                    userId: $user->id,
                    folder: 'profile_pics',
                );

                // Update DB with Cloudinary URL
                $user->update([
                    'profile_picture'           => $result['secure_url'],
                    'profile_picture_public_id' => $result['public_id'] ?? null,
                ]);

                // Delete old local file
                Storage::disk('public')->delete($user->getRawOriginal('profile_picture'));

                $success++;
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("  Failed for {$user->name}: {$e->getMessage()}");
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Done! Migrated: {$success}, Failed: {$failed}");
    }
}