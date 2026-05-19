<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; font-family: 'Poppins', sans-serif; background-color: #35408f; color: white; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding-top: 50px; }
        
        .header-login { text-align: center; margin-bottom: 40px; }
        .logo-bg { background: white; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; padding: 10px; }
        .logo-bg img { width: 100%; height: 100%; object-fit: contain; }
        .header-login h1 { margin: 0; font-size: 2rem; }

        .login-card { background: white; color: #333; width: 85%; max-width: 380px; border-radius: 15px; padding: 35px 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); text-align: center; }
        .login-card h2 { margin: 0; font-size: 1.5rem; color: #000; }
        .login-card p { font-size: 0.8rem; color: #666; margin-bottom: 30px; }

        .form-group { text-align: left; margin-bottom: 20px; }
        .form-group label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 8px; color: #333; }
        .form-group input { width: 100%; padding: 12px 20px; border: 1.5px solid #ccc; border-radius: 30px; outline: none; box-sizing: border-box; }
        
        .btn-yellow { background: #f3d02e; border: none; width: 80%; padding: 12px; border-radius: 30px; font-weight: 700; font-size: 1.1rem; cursor: pointer; margin-top: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        
        .back-link { margin-top: 30px; color: white; text-decoration: none; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; opacity: 0.8; }
    </style>
</head>
<body>

    <div class="header-login">
        <div class="logo-bg">
            <img src="{{ asset('images/NU logo.webp') }}" alt="Logo">
        </div>
        <h1>NU Lipa</h1>
        <p style="margin:0; opacity:0.8;">Digital YearBook</p>
    </div>

    <div class="login-card">
        <h2>Login to Your Account</h2>
        <p>Enter your credentials to access the yearbook</p>

        <form>
            <div class="form-group">
                <label>User Name</label>
                <input type="text" placeholder="Enter Username">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" placeholder="Enter Password">
            </div>
            <button type="button" class="btn-yellow">Login</button>
        </form>

        <a href="/" style="text-decoration:none; color:#35408f; font-size:0.8rem; display:block; margin-top:20px;">Forgot Password?</a>
    </div>

    <a href="/" class="back-link">← Back to Home</a>

</body>
</html>