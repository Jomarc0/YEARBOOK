<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register | Sinag-Bughaw</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
   
    <style>
        :root {
            --nu-blue: #1d2b4b;
            --nu-blue-bright: #3b5998;
            --nu-yellow: #fdb813;
            --bg-gray: #e9ecef;
            --input-border: #dee2e6;
            --error-red: #dc3545;
        }
       
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
       
        body {
            background-color: var(--bg-gray);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
 
        /* ANIMATIONS */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
 
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
        }
 
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
 
        .main-content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 60px 20px;
        }
 
        .register-card {
            background: white;
            width: 100%;
            max-width: 600px;
            padding: 50px;
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.05);
            text-align: center;
            animation: fadeInUp 0.6s ease-out; /* Entry Animation */
        }
 
        .icon-box {
            background: #f0f4ff;
            color: var(--nu-blue-bright);
            width: 65px;
            height: 65px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin: 0 auto 25px;
        }
 
        .register-card h2 { font-size: 2.2rem; color: #111; margin-bottom: 10px; font-weight: 800; }
        .register-card p.subtitle { color: #6c757d; font-size: 1rem; margin-bottom: 40px; }
 
        /* FORM STYLING */
        form { text-align: left; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
       
        label {
            display: block; font-size: 0.85rem; font-weight: 700; color: #495057;
            margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
        }
 
        .input-wrapper { position: relative; }
        .input-wrapper i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #adb5bd; font-size: 0.95rem; }
 
        input {
            width: 100%; padding: 15px 15px; border: 1px solid var(--input-border);
            border-radius: 12px; font-size: 0.95rem; background: #fff; transition: all 0.3s ease;
        }
 
        input.has-icon { padding-left: 45px; }
 
        input:focus {
            outline: none; border-color: var(--nu-blue-bright);
            box-shadow: 0 0 0 4px rgba(59, 89, 152, 0.1); transform: translateY(-1px);
        }
 
        /* ERROR MESSAGE */
        .error-msg {
            background: #fff5f5; color: var(--error-red); padding: 15px;
            border-radius: 12px; font-size: 0.9rem; margin-bottom: 25px;
            border-left: 5px solid var(--error-red); display: flex; align-items: center; gap: 10px;
            animation: shake 0.4s ease-in-out; /* Error Animation */
        }
 
        /* BUTTON & LOADING */
        .btn-create {
            width: 100%; background: var(--nu-blue); color: white; padding: 18px;
            border: none; border-radius: 15px; font-weight: 700; font-size: 1.1rem;
            cursor: pointer; transition: all 0.3s ease; margin-top: 15px;
            box-shadow: 0 10px 25px rgba(29, 43, 75, 0.2);
            display: flex; justify-content: center; align-items: center; gap: 12px;
        }
 
        .btn-create:hover {
            background: var(--nu-blue-bright); transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(29, 43, 75, 0.3);
        }
 
        .btn-create:disabled { background: #55607a; cursor: not-allowed; transform: none; }
 
        .spinner {
            display: none; width: 20px; height: 20px; border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite;
        }
 
        .login-link { text-align: center; margin-top: 35px; font-size: 0.95rem; color: #6c757d; }
        .login-link a { color: var(--nu-blue-bright); text-decoration: none; font-weight: 700; }
 
        /* FOOTER */
        footer { background: #0e1628; color: white; padding: 80px 8% 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 60px; }
        .f-info h3 { font-size: 1.6rem; margin-bottom: 20px; color: var(--nu-yellow); }
        .f-info p { color: #a0aabf; font-size: 0.9rem; line-height: 1.8; margin-bottom: 25px; }
        .footer-bottom { grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 35px; text-align: center; color: #55607a; font-size: 0.8rem; }
 
        @media (max-width: 768px) {
            .form-row { grid-template-columns: 1fr; gap: 0; }
            footer { grid-template-columns: 1fr; text-align: center; padding: 40px 20px; }
        }
    </style>
</head>
<body>
 
    <div class="main-content">
        <div class="register-card">
            <div class="icon-box">
                <i class="fas fa-user-graduate"></i>
            </div>
            <h2>Join the Yearbook</h2>
            <p class="subtitle">Create your digital profile for Sinag-Bughaw.</p>
 
            <form action="{{ route('register.process') }}" method="POST" id="registerForm">
                @csrf
               
                @if ($errors->any())
                    <div class="error-msg">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>{{ $errors->first() }}</span>
                    </div>
                @endif
 
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" name="first_name" placeholder="Juan" value="{{ old('first_name') }}" required autofocus>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" name="last_name" placeholder="Dela Cruz" value="{{ old('last_name') }}" required>
                    </div>
                </div>
 
                <div class="form-group">
                    <label>Email Address</label>
                    <div class="input-wrapper">
                        <i class="far fa-envelope"></i>
                        <input type="email" name="email" class="has-icon" placeholder="student@nu-lipa.edu.ph" value="{{ old('email') }}" required>
                    </div>
                </div>
 
                <div class="form-row">
                    <div class="form-group">
                        <label>Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock"></i>
                            <input type="password" name="password" class="has-icon" placeholder="********" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-shield-alt"></i>
                            <input type="password" name="password_confirmation" class="has-icon" placeholder="********" required>
                        </div>
                    </div>
                </div>
 
                <div class="form-group">
                    <label>Course</label>
                    <div class="input-wrapper">
                        <i class="fas fa-book"></i>
                        <input type="text" name="course" class="has-icon" placeholder="BS Computer Science" value="{{ old('course') }}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Student ID / Alumni ID</label>
                    <div class="input-wrapper">
                        <i class="fas fa-hashtag"></i>
                        <input type="text" name="student_id" class="has-icon" placeholder="202X-XXXX" value="{{ old('student_id') }}" required>
                    </div>
                </div>
 
                <button type="submit" class="btn-create" id="submitBtn">
                    <span id="btnText">Create My Account</span>
                    <div class="spinner" id="btnSpinner"></div>
                </button>
            </form>
 
            <div class="login-link">
                Already part of the community? <a href="{{ route('login') }}">Sign In</a>
            </div>
        </div>
    </div>
 
    <footer>
        <div class="f-info">
            <h3>NU Lipa</h3>
            <p>Celebrating academic excellence and cherished memories. Sinag-Bughaw Project.</p>
        </div>
        <div class="footer-bottom">
            &copy; 2026 National University Lipa. All rights reserved.
        </div>
    </footer>
 
    <script>
        const registerForm = document.getElementById('registerForm');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnSpinner = document.getElementById('btnSpinner');
 
        registerForm.addEventListener('submit', function() {
            submitBtn.disabled = true;
            btnText.innerText = "Creating Account...";
            btnSpinner.style.display = "block";
        });
    </script>
</body>
</html>
