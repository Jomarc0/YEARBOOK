<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | Sinag-Bughaw</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-blue-bright: #3f51b5;
            --nu-yellow: #fdb813; 
            --bg-gray: #f4f7fe;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: var(--bg-gray); color: var(--nu-blue); overflow-x: hidden; transition: filter 0.3s ease; }

        /* SECURITY & WATERMARK STYLES */
        @media print { body { display: none !important; } }

        #security-shield {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #1d2b4b; color: white; z-index: 10000;
            flex-direction: column; justify-content: center; align-items: center; text-align: center;
        }

        .watermark-bg {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 4rem; font-weight: 900; color: rgba(0, 0, 0, 0.03); /* Labo lang para hindi istorbo */
            pointer-events: none; z-index: 9999; user-select: none; white-space: nowrap;
        }

        /* ANIMATIONS */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { opacity: 0; animation: fadeInUp 0.8s ease forwards; }
        .animate-scale { opacity: 0; animation: scaleIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

        .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.2s; }

        /* UI COMPONENTS */
        .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 8%; background: white; box-shadow: 0 4px 30px rgba(0,0,0,0.03); position: sticky; top: 0; z-index: 100; }
        .logo-text { font-weight: 800; font-size: 1.4rem; letter-spacing: -1px; text-transform: uppercase; }
        .logo-text span { color: var(--nu-blue-bright); }
        .user-nav-profile { display: flex; align-items: center; gap: 15px; text-decoration: none; color: inherit; }
        .user-nav-profile img { width: 45px; height: 45px; border-radius: 14px; object-fit: cover; border: 2px solid var(--nu-yellow); }

        .main-container { padding: 40px 8%; max-width: 1600px; margin: 0 auto; }
        .welcome-section h1 { font-size: 2.8rem; font-weight: 800; letter-spacing: -1.5px; }

        .search-wrapper { position: relative; max-width: 700px; margin-bottom: 50px; z-index: 1000; }
        .search-bar {
            width: 100%; padding: 20px 30px 20px 65px; border-radius: 20px;
            border: 2px solid transparent; background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.05);
            font-size: 1rem; outline: none; transition: 0.3s;
        }
        .search-bar:focus { border-color: var(--nu-blue-bright); }
        .search-icon { position: absolute; left: 25px; top: 50%; transform: translateY(-50%); color: var(--nu-blue-bright); }

        .results-dropdown {
            position: absolute; top: 100%; left: 0; width: 100%; background: white;
            border-radius: 20px; margin-top: 10px; box-shadow: 0 15px 50px rgba(0,0,0,0.1);
            display: none; overflow: hidden; border: 1px solid rgba(0,0,0,0.05);
        }
        .search-item { display: flex; align-items: center; padding: 15px 25px; text-decoration: none; color: inherit; border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
        .search-item:hover { background: #f8fafc; }
        .search-item img { width: 40px; height: 40px; border-radius: 10px; margin-right: 15px; object-fit: cover; }
        
        .dashboard-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; }
        .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .qa-card { background: white; padding: 30px; border-radius: 25px; text-decoration: none; box-shadow: 0 10px 30px rgba(0,0,0,0.03); transition: 0.4s; color: inherit; }
        .qa-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(63, 81, 181, 0.1); }
        .icon-box { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
        
        .blue-ib { background: #eef2ff; color: #3f51b5; }
        .purple-ib { background: #f5f3ff; color: #8b5cf6; }
        .green-ib { background: #f0fdf4; color: #22c55e; }
        .orange-ib { background: #fff7ed; color: #f97316; }

        .featured-card { background: linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%); border-radius: 40px; padding: 40px; color: white; min-height: 400px; display: flex; flex-direction: column; justify-content: space-between; }
        .btn-premium { background: var(--nu-yellow); color: var(--nu-blue); padding: 15px; border-radius: 15px; text-decoration: none; font-weight: 800; text-align: center; margin-top: 20px; display: block; }
    </style>
</head>
<body>
    <div class="watermark-bg">{{ Auth::user()->first_name }} {{ Auth::user()->last_name }}</div>

    <div id="security-shield">
        <i class="fas fa-shield-alt" style="font-size: 5rem; color: #fdb813; margin-bottom: 20px;"></i>
        <h1 style="font-weight: 800;">SECURITY ACTIVE</h1>
        <p>Screenshot and Recording protection is enabled.</p>
    </div>

    <nav class="top-nav animate-up">
        <div class="logo-text">NU LIPA <span>SINAG-BUGHAW</span></div>
        <div style="display: flex; gap: 25px; align-items: center;">
            <form action="{{ route('logout') }}" method="POST">@csrf
                <button type="submit" style="background:none; border:none; color:#ef4444; font-weight:700; cursor:pointer;"><i class="fas fa-power-off"></i> Logout</button>
            </form>
            <a href="{{ url('/profile') }}" class="user-nav-profile">
                <div style="text-align: right">
                    <b>{{ Auth::user()->first_name }}</b><br><small>Pioneer Student</small>
                </div>
                <img src="{{ Auth::user()->profile_picture ? asset('storage/'.Auth::user()->profile_picture) : 'https://ui-avatars.com/api/?name='.urlencode(Auth::user()->first_name).'&background=1d2b4b&color=fff' }}">
            </a>
        </div>
    </nav>

    <main class="main-container">
        <section class="welcome-section animate-up delay-1">
            <p>Mabuhay, NU Lipa Pioneer!</p>
            <h1>Welcome Back, <span style="color: var(--nu-blue-bright);">{{ Auth::user()->first_name }}</span>!</h1>
        </section>

        <div class="search-wrapper animate-up delay-2" id="searchArea">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="liveSearch" class="search-bar" placeholder="Search batchmates, faculty, or memories..." autocomplete="off">
            <div id="resultsBox" class="results-dropdown"></div>
        </div>

        <div class="dashboard-grid">
            <div class="left-col">
                <h3 style="margin-bottom: 20px;">Quick Access</h3>
                <div class="cards-grid">
                    <a href="{{ url('/directory') }}" class="qa-card animate-scale">
                        <div class="icon-box blue-ib"><i class="fas fa-users"></i></div>
                        <h4>Students</h4>
                        <p>Browse directory.</p>
                    </a>
                    <a href="{{ url('/faculty') }}" class="qa-card animate-scale">
                        <div class="icon-box purple-ib"><i class="fas fa-chalkboard-teacher"></i></div>
                        <h4>Faculty</h4>
                        <p>Our educators.</p>
                    </a>
                    <a href="{{ url('/gallery') }}" class="qa-card animate-scale">
                        <div class="icon-box green-ib"><i class="fas fa-images"></i></div>
                        <h4>Gallery</h4>
                        <p>School memories.</p>
                    </a>
                    <a href="{{ url('/sections') }}" class="qa-card animate-scale">
                        <div class="icon-box orange-ib"><i class="fas fa-layer-group"></i></div>
                        <h4>Sections</h4>
                        <p>Batch groupings.</p>
                    </a>
                </div>
            </div>

            <div class="right-col">
                <div class="featured-card animate-scale">
                    <div>
                        <div style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; display:inline-block; font-size:0.7rem;">PIONEER BATCH</div>
                        <h2 style="font-size: 2rem; margin-top:20px;">{{ Auth::user()->name ? Auth::user()->name : (Auth::user()->first_name ? Auth::user()->first_name.' '.Auth::user()->last_name : 'Pioneer Student') }}</h2>
                        <p style="opacity:0.9; margin-top:8px;">ID: {{ Auth::user()->student_id ?? 'N/A' }}</p>
                    </div>
                    <a href="{{ url('/profile') }}" class="btn-premium">My Profile</a>
                </div>
            </div>
        </div>
    </main>

    <script>
    const searchInput = document.getElementById('liveSearch');
    const resultsBox = document.getElementById('resultsBox');

    /* SEARCH LOGIC */
    searchInput.addEventListener('input', function() {
        let val = this.value;
        if (val.length < 2) { resultsBox.style.display = 'none'; return; }

        axios.get("{{ route('api.search') }}", { params: { query: val } })
            .then(res => {
                let data = res.data;
                resultsBox.innerHTML = '';
                resultsBox.style.display = 'block';
                let html = '';

                if(data.faculties && data.faculties.length > 0) {
                    html += '<div style="padding:10px 25px; background:#f8fafc; font-size:0.7rem; font-weight:800; color:var(--nu-blue-bright);">MENTORS</div>';
                    data.faculties.forEach(f => {
                        let fName = f.name || `${f.first_name} ${f.last_name}`;
                        html += `<a href="/faculty?search=${encodeURIComponent(fName)}" class="search-item">
                                    <img src="${f.image ? '/storage/'+f.image : 'https://ui-avatars.com/api/?name='+encodeURIComponent(fName)}">
                                    <div class="info"><b>${fName}</b><small>${f.title || 'Faculty'}</small></div></a>`;
                    });
                }

                if(data.students && data.students.length > 0) {
                    html += '<div style="padding:10px 25px; background:#f8fafc; font-size:0.7rem; font-weight:800; color:var(--nu-yellow);">STUDENTS</div>';
                    data.students.forEach(s => {
                        let sName = s.name || `${s.first_name} ${s.last_name}`;
                        html += `<a href="/directory?search=${s.student_id}" class="search-item">
                                    <img src="${s.profile_picture ? '/storage/'+s.profile_picture : 'https://ui-avatars.com/api/?name='+encodeURIComponent(sName)}">
                                    <div class="info"><b>${sName}</b><small>Pioneer Student</small></div></a>`;
                    });
                }
                resultsBox.innerHTML = html || '<div style="padding:20px; text-align:center;">No results found.</div>';
            });
    });

    /* SECURITY LOGIC */
    // 1. I-blur kapag inalis ang mouse sa screen (para mahirapan mag-Snipping Tool)
    document.addEventListener('mouseleave', () => { document.body.style.filter = "blur(25px)"; });
    document.addEventListener('mouseenter', () => { document.body.style.filter = "none"; });

    // 2. Visibility Blur (Tab Switch)
    document.addEventListener('visibilitychange', () => {
        document.body.style.filter = document.hidden ? "blur(25px)" : "none";
    });

    // 3. PrintScreen/Print Block
    document.addEventListener('keydown', function(e) {
        if (e.key === "PrintScreen" || e.keyCode === 44 || (e.ctrlKey && e.key === 'p')) {
            const shield = document.getElementById('security-shield');
            shield.style.display = 'flex';
            setTimeout(() => { shield.style.display = 'none'; }, 3000);
            e.preventDefault();
        }
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
    </script>
</body>
</html>