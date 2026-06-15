<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Directory | Sinag-Bughaw</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-blue-bright: #3f51b5;
            --nu-yellow: #fdb813; 
            --bg-gray: #f8f9fa;
            --glass: rgba(255, 255, 255, 0.9);
            --card-shadow: 0 10px 30px rgba(0,0,0,0.03);
            --hover-shadow: 0 30px 60px rgba(29, 43, 75, 0.12);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        
        body { 
            background-color: var(--bg-gray); 
            display: flex; flex-direction: column; min-height: 100vh; 
            background-image: radial-gradient(#d1d9e6 1px, transparent 1px);
            background-size: 40px 40px;
            overflow-x: hidden;
        }

        /* NAVIGATION */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px 8%; background: var(--glass); backdrop-filter: blur(15px);
            border-bottom: 1px solid rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1000;
        }
        .logo h3 { color: var(--nu-blue); letter-spacing: -1px; line-height: 1; text-transform: uppercase; }
        .logo span { font-size: 0.65rem; font-weight: 800; color: var(--nu-blue-bright); letter-spacing: 1.5px; }

        .nav-center { display: flex; gap: 30px; list-style: none; }
        .nav-center a { color: #666; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: 0.3s; position: relative; }
        .nav-center a.active { color: var(--nu-blue-bright); }
        .nav-center a.active::after { content: ''; position: absolute; bottom: -5px; left: 0; width: 100%; height: 2px; background: var(--nu-yellow); border-radius: 10px; }
        
        .user-nav-info { display: flex; align-items: center; gap: 12px; }
        .user-nav-text { text-align: right; line-height: 1.2; }
        .user-nav-text b { font-size: 0.85rem; color: var(--nu-blue); display: block; }
        .user-nav-text span { font-size: 0.7rem; color: #888; }
        .nav-profile-img { width: 38px; height: 38px; border-radius: 12px; object-fit: cover; border: 2px solid var(--nu-blue-bright); }

        /* PREMIUM HEADER SECTION */
        .directory-header {
            background: var(--nu-blue-bright); color: white;
            padding: 100px 8% 120px; text-align: center;
            background: linear-gradient(135deg, rgba(29, 43, 75, 0.95), rgba(63, 81, 181, 0.85)), url('https://www.national-u.edu.ph/wp-content/uploads/2023/07/NU-Lipa-Facade.jpg');
            background-size: cover; background-position: center; border-radius: 0 0 60px 60px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            position: relative;
        }
        .directory-header h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 15px; letter-spacing: -2px; }
        .directory-header p { opacity: 0.9; font-size: 1rem; max-width: 600px; margin: 0 auto 40px; font-weight: 300; line-height: 1.6; }

        .search-container { max-width: 650px; margin: 0 auto; position: relative; z-index: 10; }
        .search-container input {
            width: 100%; padding: 22px 30px 22px 65px; border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.2); outline: none; font-size: 1rem; 
            background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); color: white;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .search-container input::placeholder { color: rgba(255,255,255,0.6); }
        .search-container input:focus { background: white; color: var(--nu-blue); transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .search-container i { position: absolute; left: 25px; top: 50%; transform: translateY(-50%); color: var(--nu-yellow); font-size: 1.2rem; }

        /* FILTERS */
        .filters { display: flex; justify-content: center; gap: 12px; padding: 40px 8% 20px; flex-wrap: wrap; margin-top: -50px; position: relative; z-index: 20; }
        .filter-chip {
            padding: 12px 28px; border-radius: 15px; background: white;
            border: none; color: var(--nu-blue); font-size: 0.85rem;
            font-weight: 700; cursor: pointer; transition: 0.4s;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .filter-chip.active { background: var(--nu-blue-bright); color: white; transform: scale(1.1); box-shadow: 0 10px 20px rgba(63, 81, 181, 0.3); }
        .filter-chip:hover:not(.active) { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); background: #fdfdfd; }

        /* STUDENT GRID */
        .student-grid { 
            padding: 40px 8% 80px; 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 35px; 
            min-height: 500px;
            position: relative;
            z-index: 1;
        }

        /* DYNAMIC STYLES FOR CARDS */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .student-card {
            background: white; border-radius: 30px; overflow: hidden;
            border: 1px solid rgba(0,0,0,0.02); transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--card-shadow); position: relative;
            animation: fadeInUp 0.6s ease forwards;
        }
        .student-card:hover { transform: translateY(-15px); box-shadow: var(--hover-shadow); }
        
        .card-img-wrap { height: 320px; position: relative; overflow: hidden; background: #f0f0f0; }
        .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: 1.2s cubic-bezier(0.2, 1, 0.2, 1); }
        .student-card:hover .card-img-wrap img { transform: scale(1.1); }
        
        .batch-badge {
            position: absolute; top: 20px; right: 20px; background: var(--nu-blue);
            color: white; padding: 10px 18px; border-radius: 14px; font-size: 0.75rem; font-weight: 800;
            display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); z-index: 5;
        }

        .card-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(29, 43, 75, 0.5); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: 0.5s; color: white; z-index: 3;
        }
        .student-card:hover .card-overlay { opacity: 1; }

        .card-body { padding: 35px 25px; text-align: center; }
        .card-body h4 { font-size: 1.4rem; color: var(--nu-blue); margin-bottom: 8px; letter-spacing: -0.5px; font-weight: 800; }
        
        .student-course {
            background: rgba(63, 81, 181, 0.06); color: var(--nu-blue-bright);
            display: inline-block; padding: 7px 16px; border-radius: 12px;
            font-size: 0.7rem; font-weight: 800; margin-bottom: 25px;
            text-transform: uppercase; letter-spacing: 1px;
        }
        
        .view-link { 
            text-decoration: none; color: white; font-size: 0.9rem; font-weight: 700; 
            background: var(--nu-blue); padding: 16px 25px; border-radius: 15px;
            display: flex; justify-content: center; align-items: center; gap: 12px; transition: 0.4s;
        }
        .view-link:hover { background: var(--nu-yellow); color: var(--nu-blue); transform: scale(1.02); }

        /* NO RESULTS STATE (Line 150+) */
        .no-results-container {
            grid-column: 1 / -1; text-align: center; padding: 100px 20px;
            background: white; border-radius: 40px; box-shadow: var(--card-shadow);
            margin: 20px 0; display: flex; flex-direction: column; align-items: center;
        }
        .no-results-icon { font-size: 5rem; color: rgba(29, 43, 75, 0.05); margin-bottom: 25px; }
        .no-results-container h3 { font-size: 2rem; color: var(--nu-blue); margin-bottom: 10px; font-weight: 800; }
        .no-results-container p { color: #888; margin-bottom: 30px; max-width: 400px; }
        .reset-btn { 
            background: var(--nu-blue); color: white; border: none; padding: 15px 35px; 
            border-radius: 15px; font-weight: 700; cursor: pointer; transition: 0.3s;
            display: flex; align-items: center; gap: 10px;
        }
        .reset-btn:hover { background: var(--nu-yellow); color: var(--nu-blue); transform: translateY(-3px); }

        /* FOOTER (Line 175+) */
        footer { background: #0e1628; color: white; padding: 100px 8% 50px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-top: auto; border-radius: 80px 80px 0 0; }
        .f-info h3 { color: var(--nu-yellow); margin-bottom: 20px; font-size: 1.8rem; font-weight: 800; }
        .f-info p { font-size: 0.9rem; color: #8892b0; line-height: 1.8; max-width: 400px; }
        .f-col h4 { margin-bottom: 30px; font-size: 1.1rem; border-left: 4px solid var(--nu-yellow); padding-left: 20px; font-weight: 700; }
        .f-col ul { list-style: none; }
        .f-col ul li { margin-bottom: 15px; font-size: 0.9rem; color: #8892b0; cursor: pointer; transition: 0.3s; }
        .f-col ul li:hover { color: var(--nu-yellow); padding-left: 10px; }
        .footer-bottom { grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 40px; text-align: center; }
        .footer-bottom p { color: #55607a; font-size: 0.8rem; }

        @media (max-width: 992px) {
            footer { grid-template-columns: 1fr; gap: 40px; padding: 80px 5% 40px; }
            .directory-header h1 { font-size: 2.5rem; }
        }
    </style>
</head> 
<body>
    <nav>
        <div class="logo">
            <h3>NU Lipa</h3>
            <span>SINAG-BUGHAW</span>
        </div>
        <ul class="nav-center">
            <li><a href="{{ route('dashboard') }}">Home</a></li>
            <li><a href="{{ route('directory') }}" class="active">Directory</a></li>
            <li><a href="{{ route('faculty') }}">Faculty</a></li>
            <li><a href="{{ route('gallery') }}">Gallery</a></li>
        </ul>
        <div class="user-nav-info">
            <div class="user-nav-text">
                <b>{{ Auth::user()->name }}</b>
                <span>{{ Auth::user()->course ?? 'Student' }}</span>
            </div>
            <img src="{{ Auth::user()->profile_picture ? asset('storage/'.Auth::user()->profile_picture) : 'https://ui-avatars.com/api/?name='.urlencode(Auth::user()->name).'&background=3f51b5&color=fff' }}" class="nav-profile-img">
        </div>
    </nav>

    <header class="directory-header">
        <h1>Sinag-Bughaw <span style="color: var(--nu-yellow);">Pioneers</span></h1>
        <p>Connecting the innovators of National University Lipa. Built by Pioneers, for Pioneers. Explore the digital legacy of the pioneer batches.</p>
        <div class="search-container">
            <i class="fas fa-search"></i>
            <input type="text" id="searchInput" placeholder="Search for names, student IDs, or programs..." onkeyup="handleSearch()">
        </div>
    </header>

    <div class="filters">
        <div class="filter-chip active" onclick="handleFilter('All', this)">All Programs</div>
        <div class="filter-chip" onclick="handleFilter('BSCS', this)">BSCS</div>
        <div class="filter-chip" onclick="handleFilter('BSIT', this)">BSIT</div>
        <div class="filter-chip" onclick="handleFilter('Engineering', this)">Engineering</div>
        <div class="filter-chip" onclick="handleFilter('Nursing', this)">Nursing</div>
        <div class="filter-chip" onclick="handleFilter('Accountancy', this)">Accountancy</div>
        <div class="filter-chip" onclick="handleFilter('Psychology', this)">Psychology</div>
        <div class="filter-chip" onclick="handleFilter('Education', this)">Education</div>
    </div>

    <main class="student-grid" id="studentGrid">
        @include('web.partials.student-list')
    </main>

    <footer>
        <div class="f-info">
            <h3>NU Lipa</h3>
            <p>Sinag-Bughaw: A Multi-Modal Digital Yearbook System. Dedicated to the pioneers of NU Lipa.</p>
            <div style="margin-top: 30px; display: flex; gap: 20px;">
                <i class="fab fa-facebook-f" style="color: #8892b0; font-size: 1.2rem; cursor: pointer;"></i>
                <i class="fab fa-twitter" style="color: #8892b0; font-size: 1.2rem; cursor: pointer;"></i>
                <i class="fab fa-linkedin-in" style="color: #8892b0; font-size: 1.2rem; cursor: pointer;"></i>
            </div>
        </div>
        <div class="f-col">
            <h4>Departments</h4>
            <ul>
                <li>Computing Studies</li>
                <li>Engineering & Architecture</li>
                <li>Allied Health</li>
                <li>Business & Accountancy</li>
            </ul>
        </div>
        <div class="f-col">
            <h4>Quick Links</h4>
            <ul>
                <li>Digital Archive</li>
                <li>Research Team</li>
                <li>Privacy Policy</li>
            </ul>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 National University Lipa • Sinag-Bughaw Project • All Rights Reserved</p>
        </div>
    </footer>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        let currentCourse = 'All';
        let searchTimer;

        function handleSearch() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(fetchStudents, 300);
        }

        function handleFilter(course, element) {
            $('.filter-chip').removeClass('active');
            $(element).addClass('active');
            currentCourse = course;
            fetchStudents();
        }

        function fetchStudents() {
            const query = $('#searchInput').val();
            $.ajax({
                url: "{{ route('directory') }}",
                type: "GET",
                data: { search: query, course: currentCourse },
                beforeSend: function() {
                    $('#studentGrid').stop().animate({ opacity: 0.3 }, 200);
                },
                success: function(response) {
                    setTimeout(() => {
                        $('#studentGrid').html(response).stop().animate({ opacity: 1 }, 200);
                    }, 100);
                },
                error: function(xhr) {
                    $('#studentGrid').css('opacity', '1');
                }
            });
        }
    </script>
</body>
</html>