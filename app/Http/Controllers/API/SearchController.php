<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query  = $request->get('q', '');
        $type   = $request->get('type', 'all');
        $viewer = $request->user();

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        if (in_array($type, ['students', 'all'])) {
            $results['students'] = User::where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                    ->orWhere('student_id', 'like', "%{$query}%")
                    ->orWhere('course', 'like', "%{$query}%");
                })
                ->when(!$viewer, fn($q) =>
                    $q->where('profile_visibility', 'public')
                )
                ->when($viewer, fn($q) =>
                    $q->where(function ($inner) use ($viewer) {
                        $inner->whereIn('profile_visibility', ['public', 'alumni_only'])
                            ->orWhere('id', $viewer->id);
                    })
                )
                ->take(10)
                ->get()
                ->map(fn($u) => [
                    'id'              => $u->id,
                    'name'            => $u->name,
                    'student_id'      => $u->student_id,
                    'course'          => $u->course,
                    'profile_picture' => $u->profile_picture,
                ]);
        }

        if (in_array($type, ['faculty', 'all'])) {
            $results['faculty'] = Faculty::search($query)->take(5)->get();
        }

        if (in_array($type, ['albums', 'all'])) {
            $results['albums'] = Album::search($query)->take(5)->get();
        }

        return response()->json(['results' => $results, 'query' => $query]);
    }
}