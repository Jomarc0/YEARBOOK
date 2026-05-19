<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Faculty;
use App\Models\User;

class SearchController extends Controller
{
    // Sa loob ng SearchController.php
public function search(Request $request) {
    $query = $request->get('query');

    $faculties = Faculty::where('name', 'LIKE', "%{$query}%")
                        ->orWhere('department', 'LIKE', "%{$query}%")
                        ->get();

    // Flexible Query: Hinahanap nito sa 'name', 'first_name', o 'last_name'
    $students = User::where('name', 'LIKE', "%{$query}%")
                    ->orWhere('first_name', 'LIKE', "%{$query}%")
                    ->orWhere('last_name', 'LIKE', "%{$query}%")
                    ->get();

    return response()->json([
        'faculties' => $faculties,
        'students' => $students
    ]);
}
}