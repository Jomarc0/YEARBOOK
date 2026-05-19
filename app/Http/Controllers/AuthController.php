<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // --- 1. SHOW VIEWS ---

    // Ipinapakita ang Login Page
    /**
     * Displays the login form.
     *
     * @return \Illuminate\View\View The 'web.login' view.
     */
    public function showLogin()
    {
        // Ibalik ang view para sa login page.
        return view('web.login');
    }

    // Ipinapakita ang Register Page
    /**
     * Displays the registration form.
     * Aborts with a 403 error if registration is disabled via settings.
     *
     * @return \Illuminate\View\View The 'web.register' view.
     */
    public function showRegister()
    {
        // Suriin kung pinapayagan ang pagpaparehistro sa system settings.
        // Kung hindi, mag-abort at magpakita ng 403 Forbidden error.
        abort_unless(Setting::getValue('allow_registration', '1') === '1', 403, 'Registration is currently disabled.');

        // Ibalik ang view para sa registration page.
        return view('web.register');
    }

    // --- 2. REGISTRATION LOGIC ---

    public function register(Request $request)
    {
        abort_unless(Setting::getValue('allow_registration', '1') === '1' || $request->session()->get('is_admin'), 403, 'Registration is currently disabled.');

        // Validation: Sinisigurado na tama ang format ng inputs
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'student_id' => 'required|string|unique:users,student_id',
            'course' => 'nullable|string|max:255',
        ]);

        // Pag-save sa Database (yearbook_db)
        /**
         * Pag-save sa Database (users table):
         * - Pinagsama ang first_name at last_name para sa 'name' column.
         */
        User::create([
            'name' => $request->first_name.' '.$request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'student_id' => $request->student_id,
            'course' => $request->course,
        ]);

        AuditLog::record($request, 'User Registration', 'Registered user '.$request->email);

        if ($request->session()->get('is_admin')) {
            return redirect()
                ->route('admin.students')
                ->with('success', 'Student account created successfully.');
        }

        // Redirect sa Login Page imbes na i-auto login ang user
        return redirect()->route('login')->with('success', 'Registration successful! Please login to your account.');
    }

    // --- 3. LOGIN LOGIC ---

    public function login(Request $request)
    {
        // I-validate ang login credentials
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Susubukan kung tama ang email at password
        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            AuditLog::record($request, 'User Login', 'Logged in as '.$request->user()->email);

            return redirect()->intended('dashboard');
        }

        AuditLog::record($request, 'Failed Login', 'Failed login attempt for '.$request->input('email'), 'Critical');

        // Kung mali ang details, babalik sa login page na may error
        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    // --- 4. LOGOUT LOGIC ---

    public function logout(Request $request)
    {
        $email = optional($request->user())->email ?? 'unknown user';
        AuditLog::record($request, 'User Logout', 'Logged out '.$email);

        Auth::logout();

        // I-clear ang session para hindi na makabalik sa dashboard
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
