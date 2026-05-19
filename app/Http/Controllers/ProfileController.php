<?php

namespace App\Http\Controllers;

use App\Contracts\FaceRecognition;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function __construct(
        private readonly FaceRecognition $faceRecognition,
    ) {
    }

    /**
     * Update the user's profile photo.
     */
    public function updatePhoto(Request $request)
    {
        // 1. Validation - Siguraduhin na image talaga ang ina-upload
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        /** @var User $user */
        $user = Auth::user();

        // 2. Cleanup - Burahin ang lumang picture sa storage kung meron man
        if ($user->profile_picture) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // 3. Store - I-save yung bagong file sa 'storage/app/public/profile_pics'
        $path = $request->file('profile_picture')->store('profile_pics', 'public');

        // 4. Update Database - I-save yung file path sa users table
        $user->update([
            'profile_picture' => $path,
        ]);

        if ($this->faceRecognition->isEnabled()) {
            try {
                $this->faceRecognition->indexStudent($user->fresh());
            } catch (\Throwable $exception) {
                Log::warning('Unable to index student face after profile update.', [
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        AuditLog::record($request, 'Update Profile Photo', 'Updated profile photo for '.$user->email);

        return back()->with('success', 'Graduation photo updated successfully!');
    }

    /**
     * Update the user's bio/quote via AJAX.
     * Ito yung Step 3 na kailangan natin para sa Live Edit.
     */
    public function updateBio(Request $request)
    {
        // Validation - Max 255 characters para hindi masyadong mahaba sa card
        $request->validate([
            'bio' => 'nullable|string|max:255',
        ]);

        /** @var User $user */
        $user = Auth::user();

        // Update lang ang bio column
        $user->update([
            'bio' => $request->bio,
        ]);

        AuditLog::record($request, 'Update Bio', 'Updated bio for '.$user->email);

        return response()->json([
            'success' => true,
            'message' => 'Bio updated successfully!',
            'new_bio' => $user->bio,
        ]);
    }
}
