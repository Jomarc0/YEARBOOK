<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Welcome</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { height: 100%; font-family: 'Poppins', sans-serif; overflow: hidden; }

        /* Main Background with Building Image */
        .container {
            height: 100vh;
            background-image: url('{{ asset("images/nu-building.jpg") }}'); 
            background-size: cover;
            background-position: center;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        /* The Exact Blue Gradient Overlay from Prototype */
        .overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to bottom, rgba(53, 80, 160, 0.8) 0%, rgba(20, 40, 110, 0.95) 100%);
            z-index: 1;
        }

        /* Content Wrapper */
        .content {
            position: relative;
            z-index: 2;
            text-align: center;
            color: white;
            width: 100%;
            padding: 0 30px;
        }

        /* White Logo Box with Rounded Corners */
        .logo-container {
            background: white;
            width: 100px;
            height: 100px;
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .logo-container img { width: 70px; height: 70px; }

        /* Branding Text */
        .brand h1 { font-size: 2rem; font-weight: 700; margin-bottom: 5px; letter-spacing: 0.5px; }
        .brand p { font-size: 0.85rem; opacity: 0.9; margin-bottom: 50px; }

        /* Welcome Message */
        .welcome-msg h2 { font-size: 1.4rem; font-weight: 600; margin-bottom: 8px; }
        .welcome-msg p { font-size: 0.75rem; line-height: 1.5; opacity: 0.8; max-width: 240px; margin: 0 auto 40px; }

        /* Buttons Section */
        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-width: 280px;
            margin: 0 auto;
        }

        /* Solid Yellow Button */
        .btn-yellow {
            background: #FFCC00;
            color: #14286E;
            padding: 14px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.95rem;
            text-decoration: none;
            transition: transform 0.2s;
            display: block;
        }

        /* Ghost/Outline Button */
        .btn-outline {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.5);
            padding: 14px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-weight: 500;
            font-size: 0.9rem;
            text-decoration: none;
            display: block;
        }

        .btn-yellow:active { transform: scale(0.98); }
    </style>
</head>
<body>

    <div class="container">
        <div class="overlay"></div>

        <div class="content">
            <div class="logo-container">
                <img src="{{ asset('images/NU logo.webp') }}" alt="Logo">
            </div>

            <div class="brand">
                <h1>NU Lipa</h1>
                <p>Digital Yearbook</p>
            </div>

            <div class="welcome-msg">
                <h2>Welcome Scholar</h2>
                <p>Connect, reminisce, and celebrate your academic journey.</p>
            </div>

            <div class="btn-group">
                <a href="/register" class="btn-yellow">Get Started</a>
                
                <a href="/login" class="btn-outline">I already have an account</a>
            </div>
        </div>
    </div>

</body>
</html>