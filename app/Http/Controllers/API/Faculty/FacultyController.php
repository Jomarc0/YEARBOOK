<?php

namespace App\Http\Controllers\API\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index()
    {
        return response()->json(Faculty::orderBy('name')->paginate(20));
    }

    public function byDepartment(Request $request)
    {
        $search = $request->query('search');

        $faculty = Faculty::query()
            ->when($search, fn($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->get();

        // Group by department, shape into the array the frontend expects
        $groups = $faculty
            ->groupBy('department')
            ->map(fn($members, $dept) => [
                'id'      => $dept,   // use dept name as id, or a real dept id if you have one
                'name'    => $dept,
                'faculty' => $members->values(),
            ])
            ->values();

        return response()->json(['data' => $groups]);
    }

    public function show(int $id)
    {
        return response()->json(Faculty::findOrFail($id));
    }
}