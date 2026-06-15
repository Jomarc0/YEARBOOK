<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | National University Lipa</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-yellow: #fdb813; 
            --light-bg: #fcfcfc;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background-color: var(--light-bg); color: #333; overflow-x: hidden; }

        /* NAVIGATION */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 20px 8%; background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px); position: absolute; width: 100%; top: 0; z-index: 1000;
        }
        .nav-center { 
            display: flex; gap: 20px; list-style: none; 
            background: rgba(255, 255, 255, 0.2); padding: 8px 25px; border-radius: 50px;
        }
        .nav-center a { color: white; text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: 0.3s; }
        .nav-center a:hover { color: var(--nu-yellow); }
        
        .nav-right .btn-login { color: white; text-decoration: none; margin-right: 20px; font-weight: 600; font-size: 0.9rem; transition: 0.3s; }
        .nav-right .btn-login:hover { color: var(--nu-yellow); }
        .btn-register { background: var(--nu-yellow); color: var(--nu-blue); padding: 10px 25px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.9rem; transition: 0.3s; }
        .btn-register:hover { background: #e5a712; transform: translateY(-2px); }

        /* HERO SECTION */
        .hero {
            height: 95vh;
            background: linear-gradient(rgba(29, 43, 75, 0.6), rgba(29, 43, 75, 0.6)), url('/images/NU-building.jpg');
            background-size: cover; background-position: center; background-repeat: no-repeat;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            text-align: center; color: white; padding-bottom: 80px;
        }
        .hero h1 { font-size: 4.8rem; font-weight: 700; line-height: 1.1; letter-spacing: -2px; }
        .hero h1 span { color: var(--nu-yellow); }
        .hero p { max-width: 650px; font-size: 1.1rem; opacity: 0.9; margin: 25px 0 40px; line-height: 1.6; }

        .hero-btns .btn-primary { background: var(--nu-yellow); color: var(--nu-blue); padding: 15px 35px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-right: 15px; display: inline-flex; align-items: center; gap: 10px; transition: 0.3s; }
        .hero-btns .btn-secondary { border: 2px solid white; color: white; padding: 13px 35px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; transition: 0.3s; }
        .hero-btns .btn-primary:hover, .hero-btns .btn-secondary:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }

        /* FLOATING STATS */
        .stats-wrap {
            display: flex; justify-content: center; gap: 30px;
            margin-top: -85px; padding: 0 8%; position: relative; z-index: 10;
        }
        .stat-box {
            background: white; padding: 35px; border-radius: 20px; width: 320px;
            box-shadow: 0 15px 45px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 20px;
            transition: 0.3s;
        }
        .stat-box:hover { transform: translateY(-10px); }
        .stat-icon { background: #f0f4ff; color: #35408f; width: 55px; height: 55px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
        .stat-text h2 { font-size: 1.8rem; color: #1d2b4b; }
        .stat-text p { font-size: 0.85rem; color: #888; }

        /* EXPLORE SECTION */
        .explore { padding: 120px 8%; text-align: center; }
        .explore h2 { font-size: 2.2rem; color: var(--nu-blue); margin-bottom: 15px; }
        .explore p.sub { color: #666; font-size: 1rem; margin-bottom: 50px; }
        
        .grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .grid-item { border-radius: 25px; overflow: hidden; height: 480px; position: relative; cursor: pointer; background: #eee; }
        .grid-item img { width: 100%; height: 100%; object-fit: cover; transition: 0.7s cubic-bezier(0.4, 0, 0.2, 1); filter: brightness(0.7); }
        .grid-item:hover img { transform: scale(1.1); filter: brightness(0.9); }
        
        .grid-overlay {
            position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px 30px;
            background: linear-gradient(transparent, rgba(0,0,0,0.9)); color: white; text-align: left;
        }
        .grid-overlay h3 { font-size: 1.5rem; margin-bottom: 10px; }
        .grid-overlay p { font-size: 0.9rem; opacity: 0.85; line-height: 1.4; }

        /* FOOTER */
        footer { background: #0e1628; color: white; padding: 100px 8% 50px; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 60px; }
        .f-info h3 { font-size: 1.5rem; margin-bottom: 20px; }
        .f-info p { color: #a0aabf; font-size: 0.9rem; line-height: 1.7; margin-bottom: 25px; }
        .socials i { margin-right: 15px; font-size: 1.2rem; color: #a0aabf; transition: 0.3s; cursor: pointer; }
        .socials i:hover { color: var(--nu-yellow); }

        .f-col h4 { color: white; margin-bottom: 25px; font-size: 1rem; font-weight: 600; }
        .f-col ul { list-style: none; }
        .f-col li { color: #a0aabf; font-size: 0.9rem; margin-bottom: 12px; cursor: pointer; transition: 0.2s; }
        .f-col li:hover { color: white; transform: translateX(5px); }
        
        .f-contact p { color: #a0aabf; font-size: 0.9rem; margin-bottom: 15px; display: flex; align-items: center; gap: 12px; }
        .f-contact i { color: var(--nu-yellow); }

        .footer-bottom { grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; text-align: center; color: #55607a; font-size: 0.8rem; }
    </style>
</head>
<body>

    <nav>
        <div class="logo">
            <h2 style="color: white;">NU Lipa</h2>
        </div>
        <ul class="nav-center">
            <li><a href="/">Home</a></li>
            <li><a href="/directory">Directory</a></li>
            <li><a href="/faculty">Faculty</a></li>
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/sections">Sections</a></li>
        </ul>
        <div class="nav-right">
            <a href="/login" class="btn-login">Login</a>
            <a href="/register" class="btn-register">Register</a>
        </div>
    </nav>

    <section class="hero">
        <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 5px;">Excellence in Education</p>
        <h1>Your Legacy,<br><span>Digitally Preserved.</span></h1>
        <p>Welcome to the official NU Lipa Digital Yearbook. Connect with alumni, celebrate achievements, and relive your university memories.</p>
        <div class="hero-btns">
            <a href="/directory" class="btn-primary"><i class="fas fa-search"></i> Browse Directory</a>
            <a href="/register" class="btn-secondary">Join the Community</a>
        </div>
    </section>

    <section class="stats-wrap">
        <div class="stat-box">
            <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
            <div class="stat-text"><h2>12,500+</h2><p>Graduates</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon"><i class="fas fa-book-open"></i></div>
            <div class="stat-text"><h2>35+</h2><p>Programs</p></div>
        </div>
        <div class="stat-box">
            <div class="stat-icon"><i class="fas fa-images"></i></div>
            <div class="stat-text"><h2>50k+</h2><p>Photos</p></div>
        </div>
    </section>

    <section class="explore">
        <h2>Explore the Yearbook</h2>
        <p class="sub">Discover the vibrant community of NU Lipa through our curated sections.</p>
        <div class="grid-container">
            <div class="grid-item">
                <img src="/images/nustud.jpg" alt="Student Directory">
                <div class="grid-overlay">
                    <h3>Student Directory</h3>
                    <p>Find classmates and connect with alumni from various batches.</p>
                </div>
            </div>
            <div class="grid-item">
                <img src="/images/gallerynu.jpg" alt="Photo Gallery">
                <div class="grid-overlay">
                    <h3>Photo Gallery</h3>
                    <p>Browse collections from university events and memorable moments.</p>
                </div>
            </div>
            <div class="grid-item">
                <img src="/images/nufaculty.jpg" alt="Faculty & Staff">
                <div class="grid-overlay">
                    <h3>Faculty & Staff</h3>
                    <p>Meet the mentors and staff who guided your academic journey.</p>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="f-info">
            <h3>NU Lipa</h3>
            <p>Celebrating academic excellence and cherished memories. The official digital yearbook platform of National University Lipa.</p>
            <div class="socials">
                <i class="fab fa-facebook-f"></i>
                <i class="fab fa-twitter"></i>
                <i class="fab fa-instagram"></i>
                <i class="fab fa-linkedin-in"></i>
            </div>
        </div>
        <div class="f-col">
            <h4>Quick Links</h4>
            <ul>
                <li><a href="/directory" style="color: inherit; text-decoration: none;">Student Directory</a></li>
                <li><a href="/faculty" style="color: inherit; text-decoration: none;">Faculty & Staff</a></li>
                <li><a href="/gallery" style="color: inherit; text-decoration: none;">Photo Gallery</a></li>
            </ul>
        </div>
        <div class="f-col">
            <h4>Support</h4>
            <ul>
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
            </ul>
        </div>
        <div class="f-col f-contact">
            <h4>Contact Us</h4>
            <p><i class="fas fa-map-marker-alt"></i> Km. 75 JP Laurel Highway, Lipa City, Batangas</p>
            <p><i class="fas fa-phone-alt"></i> +63 (043) 123 4567</p>
            <p><i class="fas fa-envelope"></i> admissions@nu-lipa.edu.ph</p>
        </div>
        <div class="footer-bottom">
            &copy; 2026 National University Lipa. All rights reserved.
        </div>
    </footer>

</body>
</html>