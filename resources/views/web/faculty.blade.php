<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty & Administration | Sinag-Bughaw NU Lipa</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-gold: #fdb813; 
            --nu-blue-light: #2a3d66;
            --bg-canvas: #f8fafc;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: var(--bg-canvas); color: var(--nu-blue); overflow-x: hidden; }

        /* --- ENTRANCE ANIMATIONS --- */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-up[data-delay="0"] { animation-delay: 0s; }
        .animate-up[data-delay="0.1"] { animation-delay: 0.1s; }
        .animate-up[data-delay="0.2"] { animation-delay: 0.2s; }
        .animate-up[data-delay="0.3"] { animation-delay: 0.3s; }
        .animate-up[data-delay="0.4"] { animation-delay: 0.4s; }
        .animate-up[data-delay="0.5"] { animation-delay: 0.5s; }
        .animate-up[data-delay="0.6"] { animation-delay: 0.6s; }
        .animate-up[data-delay="0.7"] { animation-delay: 0.7s; }
        .animate-up[data-delay="0.8"] { animation-delay: 0.8s; }
        .animate-up[data-delay="0.9"] { animation-delay: 0.9s; }
        .animate-up[data-delay="1"] { animation-delay: 1s; }
        .animate-up[data-delay="1.1"] { animation-delay: 1.1s; }
        .animate-up[data-delay="1.2"] { animation-delay: 1.2s; }

        /* --- NAVIGATION --- */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px 8%; background: white; position: sticky; top: 0; z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .nav-logo h3 { color: var(--nu-blue); font-size: 1.1rem; font-weight: 800; line-height: 1; text-transform: uppercase; }
        .nav-logo span { font-weight: 400; font-size: 0.65rem; color: var(--nu-gold); letter-spacing: 1px; display: block; }
        
        .nav-links { display: flex; gap: 30px; list-style: none; align-items: center; }
        .nav-links a { color: #64748b; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: 0.3s; }
        .nav-links a:hover { color: var(--nu-blue); }
        .nav-links a.active { color: var(--nu-blue); position: relative; }
        .nav-links a.active::after { content: ''; position: absolute; bottom: -5px; left: 0; width: 20px; height: 3px; background: var(--nu-gold); border-radius: 10px; }
        
        .user-nav { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .user-info { text-align: right; }
        .user-info b { font-size: 0.8rem; color: var(--nu-blue); display: block; text-transform: lowercase; }
        .user-info span { font-size: 0.65rem; color: #94a3b8; display: block; font-weight: 500; }
        
        .profile-wrapper {
            width: 42px; height: 42px; border-radius: 50%; padding: 2px;
            background: linear-gradient(45deg, var(--nu-blue), var(--nu-gold));
            display: flex; align-items: center; justify-content: center;
        }
        .profile-img { 
            width: 100%; height: 100%; border-radius: 50%; object-fit: cover; 
            border: 2px solid white; background: #eee; 
        }

        /* --- PREMIUM HERO HEADER --- */
        .faculty-hero {
            background: linear-gradient(135deg, var(--nu-blue) 0%, var(--nu-blue-light) 100%);
            padding: 100px 8% 150px; color: white; border-radius: 0 0 80px 80px;
            text-align: center; position: relative; overflow: hidden;
        }
        .faculty-hero::before {
            content: 'FACULTY'; position: absolute; right: -20px; bottom: -20px;
            font-size: 12rem; font-weight: 900; color: rgba(255,255,255,0.03); pointer-events: none;
        }
        .faculty-hero h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 15px; line-height: 1.1; }
        .faculty-hero h1 span { color: var(--nu-gold); }
        .faculty-hero p { opacity: 0.8; font-size: 1.1rem; max-width: 600px; margin: 0 auto; font-weight: 300; }

        /* --- SEARCH BOX --- */
        .search-container { max-width: 800px; margin: -40px auto 0; padding: 0 20px; position: relative; z-index: 10; }
        .search-bar-wrap { position: relative; }
        .search-bar {
            width: 100%; padding: 25px 35px 25px 70px; border-radius: 25px;
            border: none; background: white; font-size: 1.1rem; font-weight: 600;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); outline: none; transition: 0.4s;
        }
        .search-bar:focus { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
        .search-icon { position: absolute; left: 30px; top: 50%; transform: translateY(-50%); color: var(--nu-gold); font-size: 1.4rem; }

        /* --- FACULTY GRID --- */
        .faculty-section { padding: 80px 8% 120px; }
        .faculty-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 35px; 
        }

        /* --- FACULTY CARD --- */
        /* Palitan mo yung dating .faculty-card selector nito */
.faculty-card {
    background: white; 
    border-radius: 40px; 
    padding: 45px 30px;
    text-align: center; 
    border: 1px solid rgba(0,0,0,0.02);
    transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative; 
    overflow: hidden;
    /* ETO YUNG IMPORTANTE: */
    animation-delay: calc(var(--i) * 0.1s);
}
        .faculty-card::before {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 120px;
            background: #f8fafc; z-index: 0;
        }
        .faculty-card:hover { transform: translateY(-15px); border-color: var(--nu-gold); box-shadow: 0 30px 60px rgba(29, 43, 75, 0.1); }

        .img-frame { width: 140px; height: 140px; margin: 0 auto 25px; position: relative; z-index: 1; }
        .faculty-img {
            width: 100%; height: 100%; border-radius: 45px;
            object-fit: cover; border: 6px solid white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            background: #f1f5f9;
        }

        .faculty-details { position: relative; z-index: 1; }
        .faculty-details span { color: var(--nu-gold); font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 10px; }
        .faculty-details h3 { font-size: 1.4rem; font-weight: 800; color: var(--nu-blue); margin-bottom: 8px; }
        .faculty-details p { font-size: 0.9rem; color: #64748b; margin-bottom: 30px; }
        .faculty-card {
    animation-delay: calc(var(--i) * 0.1s);
}
        
        .view-btn { 
            text-decoration: none; color: var(--nu-blue); font-weight: 800; font-size: 0.85rem;
            background: #f1f5f9; padding: 12px 30px; border-radius: 15px; transition: 0.3s;
            display: inline-block;
        }
        .faculty-card:hover .view-btn { background: var(--nu-blue); color: white; }

        /* --- FOOTER --- */
        footer { background: var(--nu-blue); color: white; padding: 80px 8% 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 40px; }
        .footer-logo h3 { font-size: 1.5rem; margin-bottom: 20px; font-weight: 800; }
        .footer-logo span { color: var(--nu-gold); }
        .footer-logo p { font-size: 0.85rem; color: #94a3b8; line-height: 1.8; margin-bottom: 25px; }
        .social-links i { font-size: 1.2rem; margin-right: 15px; opacity: 0.6; cursor: pointer; transition: 0.3s; }
        .social-links i:hover { opacity: 1; color: var(--nu-gold); }
        
        .f-col h4 { font-size: 0.95rem; margin-bottom: 30px; font-weight: 700; color: var(--nu-gold); text-transform: uppercase; }
        .f-col ul { list-style: none; }
        .f-col ul li { color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px; transition: 0.3s; cursor: pointer; }
        .f-col ul li:hover { color: white; transform: translateX(5px); }
        
        .footer-bottom { grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; text-align: center; color: #475569; font-size: 0.8rem; margin-top: 40px; }

        @media (max-width: 1024px) { footer { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) { footer { grid-template-columns: 1fr; } .faculty-hero h1 { font-size: 2.5rem; } }
    </style>
</head>
<body>

    <nav>
        <div class="nav-logo">
            <h3>NU LIPA <span>SINAG-BUGHAW</span></h3>
        </div>
        <ul class="nav-links">
            <li>
                @auth
                    <a href="{{ route('dashboard') }}">Home</a>
                @else
                    <a href="{{ route('landing') }}">Home</a>
                @endauth
            </li>
            <li><a href="{{ route('directory') }}">Directory</a></li>
            <li><a href="{{ route('faculty') }}" class="active">Faculty</a></li>
            <li><a href="{{ route('gallery') }}">Gallery</a></li>
            <li><a href="{{ route('sections') }}">Sections</a></li>
        </ul>
        
        <div class="user-nav">
            <div class="user-info">
                <b>{{ Auth::user()->name ?? 'guest user' }}</b>
                <span>Student</span>
            </div>
            <div class="profile-wrapper">
                {{-- Dynamic Profile Photo base sa local storage at .env settings mo --}}
                <img src="{{ Auth::user()->profile_picture ? asset('storage/'.Auth::user()->profile_picture) : asset('images/user-profile.jpg') }}" class="profile-img" alt="Profile">
            </div>
        </div>
    </nav>

    <header class="faculty-hero animate-up">
        <p>National University Lipa</p>
        <h1>Meet the <span>Mentors</span></h1>
        <p>The dedicated administrators and faculty members of the pioneer batches shaping the future of Nationalians.</p>
    </header>

    <div class="search-container animate-up" style="animation-delay: 0.2s;">
        <div class="search-bar-wrap">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="facultySearch" class="search-bar" placeholder="Search by name, department, or academic title...">
        </div>
    </div>

   <main class="faculty-section">
    <div class="faculty-grid" id="facultyGrid">
        
        @forelse($faculties as $faculty)
    <div class="faculty-card animate-up faculty-item" style="--i: {{ $loop->index }}">
        <div class="img-frame">
            {{-- Ginagamit ang 'image' column base sa SQL mo --}}
            <img src="{{ $faculty->image ? asset('storage/' . $faculty->image) : 'https://ui-avatars.com/api/?name='.urlencode($faculty->name) }}" class="faculty-img">
        </div>
        <div class="faculty-details">
            <span class="f-title">{{ $faculty->title }}</span>
            <h3 class="f-name">{{ $faculty->name }}</h3>
            <p class="f-dept">{{ $faculty->department }}</p>
            <a href="{{ route('faculty.profile', $faculty->id) }}" class="view-btn">Full Profile</a>
        </div>
    </div>
@empty
    <p>No faculty found.</p>
@endforelse

    </div>
</main> 

    <footer>
        <div class="footer-logo">
            <h3>NU <span>Lipa</span></h3>
            <p>Celebrating academic excellence and cherished memories. The official digital yearbook platform built for Pioneers, by Pioneers.</p>
            <div class="social-links">
                <i class="fab fa-facebook-f"></i>
                <i class="fab fa-instagram"></i>
                <i class="fab fa-linkedin-in"></i>
            </div>
        </div>
        <div class="f-col">
            <h4>Pioneer Hub</h4>
            <ul>
                <li><a href="{{ route('directory') }}" style="color: inherit; text-decoration: none;">Student Directory</a></li>
                <li>Faculty & Staff</li>
                <li>Batch Gallery</li>
            </ul>
        </div>
        <div class="f-col">
            <h4>Support</h4>
            <ul>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Help Center</li>
            </ul>
        </div>
        <div class="f-col">
            <h4>Campus</h4>
            <ul>
                <li style="line-height: 1.5;">Km. 75 JP Laurel Highway, Brgy. Marawoy, Lipa City</li>
                <li>admissions@nu-lipa.edu.ph</li>
            </ul>
        </div>
        <div class="footer-bottom">
            &copy; 2026 National University Lipa • Sinag-Bughaw Project. All rights reserved.
        </div>
    </footer>

    <script>
        // --- LIVE SEARCH LOGIC ---
        document.getElementById('facultySearch').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.faculty-item');

            cards.forEach(card => {
                const name = card.querySelector('.f-name').textContent.toLowerCase();
                const dept = card.querySelector('.f-dept').textContent.toLowerCase();
                const title = card.querySelector('.f-title').textContent.toLowerCase();

                if (name.includes(searchTerm) || dept.includes(searchTerm) || title.includes(searchTerm)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    </script>
</body>
</html>
