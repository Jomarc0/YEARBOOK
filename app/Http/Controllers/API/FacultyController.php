<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;

class FacultyController extends Controller
{
    public function index()
    {
        return response()->json(Faculty::orderBy('name')->paginate(20));
    }

    public function show(int $id)
    {
        return response()->json(Faculty::findOrFail($id));
    }
}