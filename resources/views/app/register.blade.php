<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Register</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f9fa; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }

        .register-card { background: white; width: 100%; max-width: 400px; padding: 40px 30px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); text-align: center; }

        .icon-header { background: #f0f4ff; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .icon-header i { color: #3f51b5; font-size: 1.5rem; }

        h1 { font-size: 1.6rem; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
        .subtitle { font-size: 0.8rem; color: #666; margin-bottom: 30px; }

        .form-group { text-align: left; margin-bottom: 18px; }
        label { display: block; font-size: 0.7rem; font-weight: 600; color: #999; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }

        .input-wrapper { position: relative; }
        .input-wrapper i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #999; font-size: 0.9rem; }

        input { width: 100%; padding: 14px 14px 14px 45px; border-radius: 12px; border: 1px solid #edf2f7; background-color: #f8fafc; font-family: 'Poppins', sans-serif; font-size: 0.85rem; color: #333; }

        .btn-signup { width: 100%; padding: 16px; background-color: #3f51b5; color: white; border: none; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; margin-top: 10px; }
        .footer-link { margin-top: 30px; font-size: 0.8rem; color: #999; }
        .footer-link a { color: #3f51b5; text-decoration: none; font-weight: 700; }
    </style>
</head>
<body>
    <div class="register-card">
        <div class="icon-header"><i class="fa-solid fa-lock"></i></div>
        <h1>Please Register Here</h1>
        <p class="subtitle">Enter your credentials to access your yearbook.</p>
        <form action="/login">
            <div class="form-group">
                <label>Email Address</label>
                <div class="input-wrapper">
                    <i class="fa-regular fa-envelope"></i>
                    <input type="email" placeholder="student@nu-lipa.edu.ph">
                </div>
            </div>
            <div class="form-group">
                <label>Password</label>
                <div class="input-wrapper">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" placeholder="••••••••">
                </div>
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <div class="input-wrapper">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" placeholder="••••••••">
                </div>
            </div>
            <button type="submit" class="btn-signup">Sign Up</button>
        </form>
        <div class="footer-link">Already have account? <a href="/login">Sign In</a></div>
    </div>
</body>
</html>