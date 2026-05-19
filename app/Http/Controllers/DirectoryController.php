<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    public function index(Request $request)
    {
        // Kunin ang search query at course filter mula sa request.
        // Mas safe gamitin ang $request->input() para sa parehong AJAX at normal requests.
        // Mas safe gamitin ang $request->input para sa AJAX at normal requests
        $search = $request->input('search');
        $course = $request->input('course');

        // Simulan ang query para sa User model (students).
        $students = User::query()
            // Kung may search query, magdagdag ng where clause.
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    // Maghanap sa 'name', 'student_id', o 'course' ng user.
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('student_id', 'LIKE', "%{$search}%")
                        ->orWhere('course', 'LIKE', "%{$search}%");
                });
            })
            // Kung may course filter at hindi ito 'All', magdagdag ng where clause.
            ->when($course && $course !== 'All', function ($query) use ($course) {
                return $query->where('course', $course);
            })
            // Ayusin ang resulta ayon sa pangalan.
            ->orderBy('name', 'asc')
            ->get();

        // ETO YUNG FIX PARA SA UI:
        // Kapag AJAX ang request, yung cards lang dapat ang binabalik
        /**
         * FIX PARA SA UI:
         * Kung ang request ay galing sa AJAX (halimbawa, mula sa search filter sa frontend),
         * ibalik lang ang partial view ng listahan ng estudyante.
         * Ito ay para maiwasan ang pag-reload ng buong page at maging mas mabilis ang UI.
         */
        if ($request->ajax()) {
            // I-render ang partial view 'web.partials.student-list' at ipasa ang students.
            // Ang view file ay dapat nasa 'resources/views/web/partials/student-list.blade.php'.
            return view('web.partials.student-list', compact('students'))->render();
        }

        /**
         * Kung ang request ay normal na page load (hindi AJAX),
         * ibalik ang buong 'web.directory' view.
         */
        // Kapag normal na load, buong page (directory.blade.php)
        // Ang view file ay dapat nasa 'resources/views/web/directory.blade.php'.
        return view('web.directory', compact('students'));
    }
}