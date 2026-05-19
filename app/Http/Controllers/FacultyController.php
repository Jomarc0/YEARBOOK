<?php

namespace App\Http\Controllers;

use App\Models\User; // Gamitin natin ang User model dahil doon naka-save ang faculty roles
use Illuminate\View\View;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
  public function index()
{
    // Gamitin ito kung ang data ay nasa faculties table
    $faculties = \App\Models\Faculty::orderBy('name', 'asc')->get(); 

    // Siguraduhin na tama ang path ng view file mo
    return view('web.faculty', compact('faculties')); 
}

    public function show($id): View
    {
        // Gamitin ang User model para mahanap ang specific faculty profile
        $faculty = User::where('role', 'faculty')->findOrFail($id);

        // Siguraduhin na ang file ay nasa resources/views/web/faculty-profile.blade.php
        return view('web.faculty-profile', compact('faculty'));
    }
}