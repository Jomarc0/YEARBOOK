<?php

namespace App\Http\Controllers;

use App\Contracts\FaceRecognition;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Photo;
use App\Models\Setting;
use Illuminate\Http\Request;

class FaceRecognitionController extends Controller
{
    public function __construct(private readonly FaceRecognition $faceRecognition)
    {
    }

    /**
     * Sync all student profile pictures to the face recognition collection.
     */
    public function syncStudents(Request $request)
    {
        $this->ensureAdmin($request);

        try {
            // Get all students with profile pictures
            $students = User::whereNotNull('profile_picture')->get();

            $result = $this->faceRecognition->syncStudents($students);

            AuditLog::record(
                $request,
                'Sync Faces',
                "Student faces synced. Indexed: {$result['indexed']}, Skipped: {$result['skipped']}"
            );

            return redirect()->back()->with('success', 
                "Face sync complete: {$result['indexed']} students indexed, {$result['skipped']} skipped."
            );
        } catch (\Exception $e) {
            AuditLog::record(
                $request,
                'Sync Faces Error',
                'Student face sync failed: ' . $e->getMessage(),
                'Warning'
            );

            return redirect()->back()->withErrors('Face sync failed: ' . $e->getMessage());
        }
    }

    /**
     * Search for matching students by uploading a face image.
     */
    public function search(Request $request)
    {
        $request->validate([
            'face_image' => 'required|image|max:5120',
        ]);

        try {
            $file = $request->file('face_image');

            // Get configurable threshold from settings
            $threshold = (float) (Setting::getValue('face_recognition_threshold', '90'));

            // Search for matches
            $searchResult = $this->faceRecognition->searchUploadedFace($file, 5, $threshold);

            // Find all gallery photos containing the matched students
            $studentPhotos = [];
            if (!empty($searchResult['matches'])) {
                $matchedStudentIds = collect($searchResult['matches'])->pluck('user_id')->filter()->values()->all();
                
                if (!empty($matchedStudentIds)) {
                    $studentPhotos = Photo::query()
                        ->select(['id', 'file_path', 'caption', 'ai_metadata'])
                        ->where(function ($query) use ($matchedStudentIds) {
                            foreach ($matchedStudentIds as $id) {
                                // Database-level JSON filtering (much faster than PHP filter)
                                $query->orWhereJsonContains('ai_metadata->matches', ['user_id' => (int) $id]);
                            }
                        })
                        ->latest()
                        ->limit(50) // Limit results for performance
                        ->get()
                        ->map(function ($photo) {
                            $matches = data_get($photo->ai_metadata, 'matches', []);
                            $photo->matched_students = collect($matches)->map(function ($match) {
                                return [
                                    'user_id' => data_get($match, 'user_id'),
                                    'name' => data_get($match, 'name', 'Unknown'),
                                    'similarity' => data_get($match, 'similarity', 0),
                                ];
                            })->values()->all();
                            
                            return $photo;
                        })->all();
                }
            }

            // Store results in session for display in gallery view
            session([
                'faceSearchResults' => $searchResult,
                'studentPhotos' => $studentPhotos,
            ]);

            AuditLog::record(
                $request,
                'Face Search',
                'Student face search performed. Matches found: ' . count($searchResult['matches'] ?? []) . ', Photos found: ' . count($studentPhotos)
            );

            return redirect()->route('gallery.index')->with('success', 'Face search completed.');
        } catch (\Exception $e) {
            AuditLog::record(
                $request,
                'Face Search Error',
                'Student face search failed: ' . $e->getMessage(),
                'Warning'
            );

            return redirect()->back()->withErrors('Face search failed: ' . $e->getMessage());
        }
    }

    /**
     * Ensure the user is authenticated as an admin.
     */
    private function ensureAdmin(Request $request): void
    {
        if (! $request->session()->get('is_admin')) {
            abort(403, 'Unauthorized access.');
        }
    }
}