<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Sinag-Bughaw</title>
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
            --success-green: #28a745;
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
            padding: 40px 20px;
        }

        .login-card {
            background: white;
            width: 100%;
            max-width: 500px;
            padding: 50px;
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.05);
            text-align: center;
            animation: fadeInUp 0.6s ease-out; /* Entry Animation */
        }

        .icon-box {
            background: #f0f4ff;
            color: var(--nu-blue-bright);
            width: 60px;
            height: 60px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin: 0 auto 25px;
        }

        .login-card h2 { font-size: 2rem; color: #111; margin-bottom: 10px; font-weight: 700; }
        .login-card p.subtitle { color: #6c757d; font-size: 0.95rem; margin-bottom: 30px; }

        /* ALERTS */
        .alert {
            padding: 14px;
            border-radius: 10px;
            font-size: 0.85rem;
            margin-bottom: 20px;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alert-error {
            background: #fff5f5;
            color: var(--error-red);
            border-left: 4px solid var(--error-red);
            animation: shake 0.4s ease-in-out; /* Error Shake */
        }

        .alert-success {
            background: #f0fff4;
            color: var(--success-green);
            border-left: 4px solid var(--success-green);
        }

        /* FORM STYLING */
        form { text-align: left; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-size: 0.85rem; font-weight: 600; color: #495057; margin-bottom: 8px; }
        .input-wrapper { position: relative; }
        .input-wrapper i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #adb5bd; font-size: 0.9rem; }

        input {
            width: 100%;
            padding: 14px 15px 14px 45px;
            border: 1px solid var(--input-border);
            border-radius: 12px;
            font-size: 0.9rem;
            transition: 0.3s;
        }

        input:focus {
            outline: none;
            border-color: var(--nu-blue-bright);
            box-shadow: 0 0 0 4px rgba(59, 89, 152, 0.1);
        }

        /* BUTTON LOADING STATE */
        .btn-signin {
            width: 100%;
            background: #3f51b5; 
            color: white;
            padding: 16px;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 10px;
            box-shadow: 0 10px 20px rgba(63, 81, 181, 0.2);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }

        .btn-signin:hover { background: #303f9f; transform: translateY(-2px); }
        
        .btn-signin:disabled {
            background: #7986cb;
            cursor: not-allowed;
            transform: none;
        }

        .spinner {
            display: none;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
        }

        .register-link { text-align: center; margin-top: 35px; font-size: 0.9rem; color: #6c757d; }
        .register-link a { color: #3f51b5; text-decoration: none; font-weight: 700; }

        /* FOOTER */
        footer { background: #0e1628; color: white; padding: 60px 8% 30px; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 40px; }
        .f-info h3 { font-size: 1.5rem; margin-bottom: 15px; }
        .f-info p { color: #a0aabf; font-size: 0.85rem; line-height: 1.6; margin-bottom: 20px; }
        .footer-bottom { grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px; text-align: center; color: #55607a; font-size: 0.75rem; }
    </style>
</head>
<body>

    <div class="main-content">
        <div class="login-card">
            <div class="icon-box">
                <i class="fas fa-lock"></i>
            </div>
            <h2>Welcome Back</h2>
            <p class="subtitle">Enter your credentials to access your account.</p>

            @if(session('success'))
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> {{ session('success') }}
                </div>
            @endif

            @if ($errors->any())
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i> {{ $errors->first() }}
                </div>
            @endif

            <form action="{{ route('login.process') }}" method="POST" id="loginForm">
                @csrf

                <div class="form-group">
                    <label>Email Address</label>
                    <div class="input-wrapper">
                        <i class="far fa-envelope"></i>
                        <input type="email" name="email" placeholder="student@nu-lipa.edu.ph" value="{{ old('email') }}" required autofocus>
                    </div>
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <div class="input-wrapper">
                        <i class="fas fa-key"></i>
                        <input type="password" name="password" placeholder="********" required>
                    </div>
                </div>

                <button type="submit" class="btn-signin" id="submitBtn">
                    <span id="btnText">Sign In</span>
                    <div class="spinner" id="btnSpinner"></div>
                </button>
            </form>

            <div class="register-link">
                Don't have an account? <a href="{{ route('register') }}">Register Now</a>
            </div>
        </div>
    </div>

    <footer>
        <div class="f-info">
            <h3>NU Lipa</h3>
            <p>Celebrating academic excellence and cherished memories. The official digital yearbook platform of National University Lipa.</p>
        </div>
        <div class="f-col">
            <h4>Quick Links</h4>
            <p style="color: #a0aabf; font-size: 0.85rem;">Student Directory</p>
        </div>
        <div class="footer-bottom">
            &copy; 2026 National University Lipa. Sinag-Bughaw Project.
        </div>
    </footer>

    <script>
        const loginForm = document.getElementById('loginForm');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnSpinner = document.getElementById('btnSpinner');

        loginForm.addEventListener('submit', function() {
            // Disable button to prevent multiple clicks
            submitBtn.disabled = true;
            btnText.innerText = "Signing in...";
            btnSpinner.style.display = "block";
        });
    </script>
</body>
</html>