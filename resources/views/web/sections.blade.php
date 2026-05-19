<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Sections | Sinag-Bughaw Archive</title>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        /* --- ROOT VARIABLES (Premium Theme) --- */
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-blue-bright: #3f51b5;
            --nu-gold: #f59e0b;
            --dark-bg: #0f172a; 
            --card-bg: #ffffff;
            --accent: #6366f1;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow-sm: 0 4px 20px rgba(0,0,0,0.03);
            --shadow-lg: 0 20px 40px rgba(0,0,0,0.08);
            --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* --- GLOBAL RESET --- */
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        
        body { 
            background-color: #f8fafc; 
            display: flex; 
            flex-direction: column; 
            min-height: 100vh; 
            color: var(--text-main);
            overflow-x: hidden;
        }

        /* --- NAVIGATION --- */
        nav {
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 15px 8%; 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            position: sticky; 
            top: 0; 
            z-index: 1000;
        }
        
        .logo h3 { 
            color: var(--nu-blue); 
            font-weight: 800; 
            letter-spacing: -1px;
            line-height: 1;
        }
        
        .logo span { 
            font-weight: 300; 
            font-size: 0.65rem; 
            display: block; 
            margin-top: 2px; 
            color: var(--text-muted); 
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .nav-links { display: flex; gap: 25px; list-style: none; }
        .nav-links a { 
            color: var(--text-muted); 
            text-decoration: none; 
            font-size: 0.85rem; 
            font-weight: 600; 
            transition: var(--transition);
        }
        
        .nav-links a:hover { color: var(--nu-blue-bright); }
        .nav-links a.active { 
            color: var(--nu-blue-bright); 
            position: relative; 
        }
        
        .nav-links a.active::after { 
            content: ''; 
            position: absolute; 
            bottom: -22px; 
            left: 0; 
            width: 100%; 
            height: 3px; 
            background: var(--nu-blue-bright); 
            border-radius: 10px 10px 0 0;
        }
        
        .user-nav { display: flex; align-items: center; gap: 15px; }
        .user-info { text-align: right; }
        .user-info b { font-size: 0.85rem; color: var(--nu-blue); display: block; }
        .user-info span { font-size: 0.7rem; color: var(--text-muted); display: block; }
        
        .profile-img { 
            width: 40px; 
            height: 40px; 
            border-radius: 12px; 
            object-fit: cover; 
            border: 2px solid var(--border-color); 
            transition: var(--transition);
        }
        .profile-img:hover { border-color: var(--nu-blue-bright); transform: rotate(5deg); }

        /* --- MODERN HEADER SECTION --- */
        .sections-header {
            background: linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%);
            color: white; 
            padding: 90px 8%; 
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .sections-header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: url('https://www.transparenttextures.com/patterns/cubes.png');
            opacity: 0.1;
        }

        .sections-header h1 { 
            font-size: 3.2rem; 
            font-weight: 800; 
            margin-bottom: 15px; 
            letter-spacing: -2px;
            position: relative;
        }
        
        .sections-header p { 
            opacity: 0.8; 
            font-size: 1.1rem; 
            margin-bottom: 40px; 
            font-weight: 300;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            position: relative;
        }

        .search-bar { 
            max-width: 600px; 
            margin: 0 auto; 
            position: relative; 
            z-index: 10;
        }
        
        .search-bar input {
            width: 100%; 
            padding: 20px 30px 20px 60px; 
            border-radius: 15px;
            border: none; 
            outline: none; 
            font-size: 1rem; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            transition: var(--transition);
        }
        
        .search-bar input:focus { transform: scale(1.02); }
        .search-bar i { 
            position: absolute; 
            left: 25px; 
            top: 50%; 
            transform: translateY(-50%); 
            color: var(--nu-blue); 
            font-size: 1.2rem; 
        }

        /* --- CONTENT WRAPPER --- */
        .content-wrap { 
            padding: 60px 8% 100px; 
            max-width: 1440px; 
            margin: 0 auto; 
            width: 100%;
        }
        
        .batch-info { 
            margin-bottom: 50px; 
            border-left: 5px solid var(--nu-blue-bright); 
            padding-left: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .batch-title { 
            font-size: 1.4rem; 
            font-weight: 800; 
            color: var(--nu-blue); 
            text-transform: uppercase; 
            letter-spacing: 1px; 
        }
        
        .batch-subtitle { 
            font-size: 0.95rem; 
            color: var(--text-muted); 
            margin-top: 5px;
        }

        /* --- GRID SYSTEM --- */
        .sections-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
            gap: 40px; 
        }

        /* --- SECTION CARD DESIGN --- */
        .section-card {
            background: var(--card-bg); 
            border-radius: 24px; 
            overflow: hidden;
            box-shadow: var(--shadow-sm); 
            border: 1px solid #f1f5f9;
            transition: var(--transition);
            display: flex; 
            flex-direction: column;
            position: relative;
        }
        
        .section-card:hover { 
            transform: translateY(-12px); 
            box-shadow: var(--shadow-lg); 
        }

        .image-container { 
            position: relative; 
            width: 100%; 
            height: 220px; 
            overflow: hidden; 
        }
        
        .section-banner { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            transition: 0.6s ease; 
        }
        
        .section-card:hover .section-banner { transform: scale(1.15); }
        
        /* Glassmorphism Badge */
        .stats-overlay {
            position: absolute; 
            top: 20px; 
            right: 20px;
            background: rgba(255, 255, 255, 0.85); 
            padding: 8px 15px;
            border-radius: 12px; 
            font-size: 0.75rem; 
            font-weight: 800; 
            color: var(--nu-blue);
            backdrop-filter: blur(8px); 
            border: 1px solid rgba(255,255,255,0.4);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .section-body { padding: 30px; flex-grow: 1; display: flex; flex-direction: column; }
        
        .section-tag {
            background: #eef2ff; 
            color: var(--accent); 
            padding: 6px 14px;
            border-radius: 8px; 
            font-size: 0.75rem; 
            font-weight: 700;
            display: inline-block; 
            margin-bottom: 20px;
            align-self: flex-start;
        }

        .advisor-box { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
            margin-bottom: 25px; 
            padding: 12px;
            background: #f8fafc;
            border-radius: 15px;
        }
        
        .advisor-box img { 
            width: 45px; 
            height: 45px; 
            border-radius: 50%; 
            object-fit: cover; 
            border: 3px solid white; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .advisor-box .label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
        .advisor-box .name { font-size: 0.95rem; font-weight: 700; color: var(--nu-blue); }

        .roster-label { 
            font-size: 0.7rem; 
            color: var(--text-muted); 
            margin-bottom: 12px; 
            font-weight: 800; 
            letter-spacing: 0.5px;
            display: block;
        }

        .face-stack { display: flex; align-items: center; padding-left: 10px; }
        .face-stack img {
            width: 38px; 
            height: 38px; 
            border-radius: 50%; 
            border: 3px solid white;
            margin-left: -12px; 
            transition: var(--transition); 
            cursor: pointer;
            object-fit: cover;
        }
        
        .face-stack img:hover { transform: translateY(-8px) scale(1.1); z-index: 10; border-color: var(--nu-blue-bright); }
        
        .more-count {
            width: 38px; 
            height: 38px; 
            border-radius: 50%; 
            background: var(--nu-blue);
            margin-left: -12px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 0.7rem; 
            font-weight: 700; 
            color: white; 
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .view-btn {
            background: var(--nu-blue); 
            color: white; 
            width: 100%; 
            padding: 18px;
            text-align: center; 
            text-decoration: none; 
            display: block;
            font-size: 0.9rem; 
            font-weight: 700; 
            transition: var(--transition);
            border-radius: 0 0 24px 24px; 
            margin-top: auto;
            border: none;
            cursor: pointer;
        }
        
        .view-btn:hover { 
            background: var(--nu-blue-bright); 
            letter-spacing: 1px; 
            text-transform: uppercase;
        }

        /* --- FOOTER DESIGN --- */
        footer { 
            background: var(--dark-bg); 
            color: white; 
            padding: 100px 8% 40px; 
            display: grid; 
            grid-template-columns: 2fr 1fr 1fr 1.5fr; 
            gap: 60px; 
            margin-top: auto;
        }
        
        .f-info h3 { font-size: 1.8rem; margin-bottom: 25px; font-weight: 800; color: white; }
        .f-info p { font-size: 0.9rem; color: #94a3b8; line-height: 1.8; margin-bottom: 20px; }
        
        .f-col h4 { 
            font-size: 1rem; 
            margin-bottom: 30px; 
            color: var(--nu-blue-bright); 
            text-transform: uppercase; 
            letter-spacing: 1.5px;
            font-weight: 700;
        }
        
        .f-col ul { list-style: none; }
        .f-col ul li { 
            margin-bottom: 15px; 
            font-size: 0.9rem; 
            color: #cbd5e1; 
            cursor: pointer; 
            transition: 0.3s; 
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .f-col ul li:hover { color: white; transform: translateX(8px); }
        
        .footer-bottom { 
            grid-column: 1 / -1; 
            border-top: 1px solid rgba(255,255,255,0.08); 
            padding-top: 40px; 
            text-align: center; 
            color: #64748b; 
            font-size: 0.8rem; 
            letter-spacing: 0.5px;
        }

        /* --- RESPONSIVENESS --- */
        @media (max-width: 1024px) {
            footer { grid-template-columns: 1fr 1fr; }
            .sections-header h1 { font-size: 2.5rem; }
        }
        
        @media (max-width: 768px) {
            nav { padding: 15px 5%; }
            .nav-links { display: none; } /* Pwede mo gawan ng hamburger menu later */
            footer { grid-template-columns: 1fr; text-align: center; gap: 40px; }
            .f-col ul li { justify-content: center; }
            .batch-info { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
    </style>
</head>
<body>

    <nav>
        <div class="logo">
            <h3>NU Lipa <span>SINAG-BUGHAW ARCHIVE</span></h3>
        </div>
        
        <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/directory">Directory</a></li>
            <li><a href="/faculty">Faculty</a></li>
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/sections" class="active">Sections</a></li>
        </ul>
        
        <div class="user-nav">
            <div class="user-info">
                <b>Alex De La Cruz</b>
                <span>2026 • BSCS</span>
            </div>
            <img src="https://ui-avatars.com/api/?name=Alex+De+La+Cruz&background=1d2b4b&color=fff" class="profile-img" alt="User Profile">
        </div>
    </nav>

    <header class="sections-header">
        <h1>Student Sections</h1>
        <p>A digital repository of academic bonds, shared milestones, and the pioneer spirits of NU Lipa.</p>
        
        <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" id="sectionSearch" placeholder="Search by section name, advisor, or program...">
        </div>
    </header>

    <main class="content-wrap">
        <div class="batch-info">
            <div>
                <h3 class="batch-title">Pioneer Batch 2024 - 2025</h3>
                <p class="batch-subtitle">College of Computing and Information Technologies</p>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
                Showing {{ $sections->count() }} Academic Sections
            </div>
        </div>

        <div class="sections-grid">
            @forelse($sections as $section)
                <div class="section-card">
                    <div class="image-container">
                        <img src="{{ $section->banner ?? 'https://images.unsplash.com/photo-1523240715181-2f0f9f224a49?auto=format&fit=crop&w=800' }}" 
                             class="section-banner" alt="{{ $section->name }}">
                        <div class="stats-overlay">
                            <i class="fas fa-users" style="margin-right: 5px;"></i> {{ $section->students_count }} Students
                        </div>
                    </div>

                    <div class="section-body">
                        <span class="section-tag">{{ $section->name }}</span>
                        
                        <div class="advisor-box">
                            <img src="https://ui-avatars.com/api/?name={{ urlencode($section->advisor) }}&background=random&color=fff" alt="Advisor">
                            <div>
                                <p class="label">Class Advisor</p>
                                <p class="name">{{ $section->advisor }}</p>
                            </div>
                        </div>
                        
                        <span class="roster-label">STUDENT PREVIEW:</span>
                        <div class="face-stack">
                            @foreach($section->students->take(5) as $student)
                                <img src="https://ui-avatars.com/api/?name={{ urlencode($student->name) }}&background=1d2b4b&color=fff" 
                                     title="{{ $student->name }}" alt="Student">
                            @endforeach
                            
                            @if($section->students_count > 5)
                                <div class="more-count">+{{ $section->students_count - 5 }}</div>
                            @endif
                        </div>
                    </div>

                    <a href="{{ route('sections.show', $section->id) }}" class="view-btn">
                        Open Masterlist <i class="fas fa-arrow-right" style="margin-left: 8px; font-size: 0.8rem;"></i>
                    </a>
                </div>
            @empty
                <div style="grid-column: 1/-1; text-align: center; padding: 100px 0;">
                    <i class="fas fa-folder-open" style="font-size: 4rem; color: #e2e8f0; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-muted);">No sections found.</h3>
                </div>
            @endforelse
        </div>
    </main>

    <footer>
        <div class="f-info">
            <h3>NU Lipa</h3>
            <p>The Sinag-Bughaw Archive System is a dedicated platform for preserving the digital legacy of Nationalians. Empowered by face recognition and semantic search technologies.</p>
            <div style="display: flex; gap: 15px;">
                <i class="fab fa-facebook" style="font-size: 1.2rem; cursor: pointer;"></i>
                <i class="fab fa-instagram" style="font-size: 1.2rem; cursor: pointer;"></i>
                <i class="fab fa-linkedin" style="font-size: 1.2rem; cursor: pointer;"></i>
            </div>
        </div>
        
        <div class="f-col">
            <h4>Quick Links</h4>
            <ul>
                <li>Yearbook Directory</li>
                <li>Archive Search</li>
                <li>Digital Gallery</li>
                <li>Batch Records</li>
            </ul>
        </div>
        
        <div class="f-col">
            <h4>University</h4>
            <ul>
                <li>NU Lipa Website</li>
                <li>Student Portal</li>
                <li>LMS Access</li>
                <li>IT Department</li>
            </ul>
        </div>
        
        <div class="f-col">
            <h4>Contact Us</h4>
            <ul>
                <li><i class="fas fa-map-marker-alt"></i> Lipa City, Batangas</li>
                <li><i class="fas fa-envelope"></i> support@sinag-bughaw.ph</li>
                <li><i class="fas fa-phone"></i> (043) 123-4567</li>
            </ul>
        </div>
        
        <div class="footer-bottom">
            &copy; 2026 Sinag-Bughaw Archive System | Powered by Laravel & Sinag-Dev Team
        </div>
    </footer>

    <script>
        document.getElementById('sectionSearch').addEventListener('keyup', function() {
            let filter = this.value.toLowerCase();
            let cards = document.querySelectorAll('.section-card');
            
            cards.forEach(card => {
                let text = card.innerText.toLowerCase();
                card.style.display = text.includes(filter) ? "flex" : "none";
            });
        });
        
    </script>

</body>
</html>