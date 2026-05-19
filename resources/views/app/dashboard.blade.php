<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8fafc; color: #1e293b; padding-bottom: 80px; }

        /* User Header Section */
        .user-header { padding: 30px 20px 20px; display: flex; justify-content: space-between; align-items: center; }
        .user-greeting p { font-size: 0.8rem; color: #64748b; font-weight: 400; }
        .user-greeting h1 { font-size: 1.3rem; font-weight: 700; color: #0f172a; }
        .profile-img { position: relative; width: 45px; height: 45px; }
        .profile-img img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .status-dot { position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; background: #22c55e; border: 2px solid white; border-radius: 50%; }

        /* Featured Blue Card */
        .featured-card { 
            background: linear-gradient(135deg, #3b50b9 0%, #2563eb 100%); 
            margin: 0 20px 30px; 
            padding: 25px; 
            border-radius: 24px; 
            color: white;
            box-shadow: 0 10px 25px rgba(59, 80, 185, 0.3);
        }
        .badge-info { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; margin-bottom: 15px; opacity: 0.9; }
        .featured-card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; }
        .featured-card p { font-size: 0.75rem; opacity: 0.8; line-height: 1.6; margin-bottom: 20px; }
        .btn-profile { 
            display: inline-block; background: white; color: #3b50b9; 
            padding: 10px 20px; border-radius: 12px; font-size: 0.8rem; 
            font-weight: 600; text-decoration: none; transition: 0.3s;
        }

        /* Quick Access Grid */
        .section-header { padding: 0 20px; margin-bottom: 15px; }
        .section-header h3 { font-size: 1rem; font-weight: 600; }
        .access-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 20px; margin-bottom: 30px; }
        .access-card { 
            background: white; padding: 20px; border-radius: 20px; 
            text-decoration: none; color: inherit; transition: 0.3s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .access-card:active { transform: scale(0.96); }
        .icon-wrap { 
            width: 40px; height: 40px; border-radius: 10px; 
            display: flex; align-items: center; justify-content: center; margin-bottom: 15px;
        }
        .access-card h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; }
        .access-card p { font-size: 0.7rem; color: #94a3b8; line-height: 1.4; }

        /* Colors for Icons */
        .bg-blue { background: #eff6ff; color: #3b82f6; }
        .bg-orange { background: #fff7ed; color: #f97316; }
        .bg-purple { background: #f5f3ff; color: #8b5cf6; }
        .bg-green { background: #f0fdf4; color: #22c55e; }

        /* Events Section */
        .event-card { 
            background: white; margin: 0 20px; padding: 15px; border-radius: 20px; 
            display: flex; align-items: center; gap: 15px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .date-box { 
            background: #eff6ff; padding: 10px; border-radius: 15px; 
            text-align: center; min-width: 60px;
        }
        .date-box span { display: block; line-height: 1; }
        .date-box .month { font-size: 0.6rem; color: #3b82f6; font-weight: 700; margin-bottom: 4px; }
        .date-box .day { font-size: 1.1rem; color: #1e293b; font-weight: 700; }
        .event-info h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 2px; }
        .event-info p { font-size: 0.7rem; color: #64748b; margin-bottom: 8px; }
        .confirmed-tag { 
            display: inline-block; background: #dcfce7; color: #166534; 
            padding: 4px 10px; border-radius: 8px; font-size: 0.55rem; font-weight: 700;
        }

        /* Bottom Nav */
        .bottom-nav { 
            position: fixed; bottom: 0; left: 0; width: 100%; 
            background: white; padding: 15px 25px; 
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.05);
        }
        .nav-item { text-align: center; text-decoration: none; color: #94a3b8; }
        .nav-item i { font-size: 1.2rem; display: block; margin-bottom: 4px; }
        .nav-item span { font-size: 0.6rem; }
        .nav-item.active { color: #3b50b9; }
    </style>
</head>
<body>

    <div class="user-header">
        <div class="user-greeting">
            <p>Good Morning,</p>
            <h1>{{ Auth::user()->name ? Auth::user()->name : (Auth::user()->first_name ? Auth::user()->first_name.' '.Auth::user()->last_name : 'Pioneer') }}</h1>
        </div>
        <div class="profile-img">
            <img src="https://via.placeholder.com/150" alt="User">
            <div class="status-dot"></div>
        </div>
    </div>

    <div class="featured-card">
        <div class="badge-info">
            <i class="fa-solid fa-medal"></i>
            <span>Student of the Month</span>
        </div>
        <h2>{{ Auth::user()->name ? Auth::user()->name : (Auth::user()->first_name ? Auth::user()->first_name.' '.Auth::user()->last_name : 'Pioneer Student') }}</h2>
        <p>ID: {{ Auth::user()->student_id ?? 'N/A' }}</p>
        <a href="{{ url('/profile') }}" class="btn-profile">View Profile</a>
    </div>

    <div class="section-header">
        <h3>Quick Access</h3>
    </div>

    <div class="access-grid">
        <a href="/directory" class="access-card">
            <div class="icon-wrap bg-blue"><i class="fa-solid fa-users"></i></div>
            <h4>Students</h4>
            <p>Browse your batchmates</p>
        </a>
        <a href="/gallery" class="access-card">
            <div class="icon-wrap bg-orange"><i class="fa-solid fa-image"></i></div>
            <h4>Gallery</h4>
            <p>Campus memories</p>
        </a>
        <a href="/faculty" class="access-card">
            <div class="icon-wrap bg-purple"><i class="fa-solid fa-graduation-cap"></i></div>
            <h4>Faculty</h4>
            <p>Professors & Staff</p>
        </a>
        <a href="/sections" class="access-card">
            <div class="icon-wrap bg-green"><i class="fa-solid fa-book-open"></i></div>
            <h4>Sections</h4>
            <p>Class directory</p>
        </a>
    </div>

    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3>Upcoming Events</h3>
        <a href="#" style="font-size: 0.7rem; color: #3b50b9; text-decoration: none; font-weight: 600;">View All</a>
    </div>

    <div class="event-card">
        <div class="date-box">
            <span class="month">MAR</span>
            <span class="day">15</span>
        </div>
        <div class="event-info">
            <h4>Graduation Ball 2026</h4>
            <p>Grand Ballroom, Taal Vista Hotel</p>
            <span class="confirmed-tag">CONFIRMED</span>
        </div>
    </div>

    <nav class="bottom-nav">
        <a href="/dashboard" class="nav-item active">
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-address-book"></i>
            <span>Directory</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-images"></i>
            <span>Gallery</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-award"></i>
            <span>Achievement</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-user"></i>
            <span>Profile</span>
        </a>
    </nav>

</body>
</html>