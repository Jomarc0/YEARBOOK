<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile - Sinag-Bughaw</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --nu-blue: #2b4bbd;
            --nu-yellow: #ffc107;
            --text-dark: #1a1a1a;
            --text-gray: #777;
            --bg-light: #f8f9fa;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background-color: white; color: var(--text-dark); }

        /* Header Blue Banner */
        .header-banner {
            background-color: var(--nu-blue);
            height: 180px;
            width: 100%;
        }

        /* Profile Section */
        .profile-container {
            text-align: center;
            margin-top: -60px;
            padding: 0 25px;
        }

        .profile-img-wrapper {
            position: relative;
            display: inline-block;
        }

        .profile-img {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid #fff;
            object-fit: cover;
            background: #eee;
        }

        .badge-icon {
            position: absolute;
            bottom: 8px;
            right: 5px;
            background: var(--nu-yellow);
            color: #fff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border: 2px solid #fff;
        }

        .user-name { font-size: 1.5rem; font-weight: 700; margin-top: 12px; color: #1e293b; }
        .user-course { font-size: 1rem; color: var(--nu-blue); font-weight: 500; }
        .user-year { font-size: 0.9rem; color: var(--text-gray); margin-bottom: 25px; }

        /* Buttons Group */
        .btn-group { display: flex; gap: 12px; margin-bottom: 30px; }
        .btn {
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
        }
        .btn-message { background: var(--nu-blue); color: #fff; box-shadow: 0 4px 10px rgba(43, 75, 189, 0.2); }
        .btn-yearbook { background: #fff; color: #475569; border: 1.5px solid #e2e8f0; }

        /* Content Sections */
        .section { text-align: left; margin-bottom: 25px; }
        
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.85rem;
            font-weight: 700;
            color: #475569;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .about-text {
            font-size: 0.88rem;
            color: #64748b;
            line-height: 1.6;
        }

        /* Achievement Cards */
        .card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px;
            border-radius: 18px;
            margin-bottom: 12px;
        }
        .card-info h4 { font-size: 0.92rem; font-weight: 700; margin-bottom: 2px; }
        .card-info p { font-size: 0.78rem; opacity: 0.8; }
        .card i { font-size: 1.1rem; }

        .card-yellow { background: #fffdf0; border: 1.5px solid #fef3c7; color: #b45309; }
        .card-blue { background: #eff6ff; border: 1.5px solid #dbeafe; color: #1d4ed8; }

        /* List Items (Settings) */
        .list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
            font-size: 0.95rem;
        }
        .list-item div { display: flex; align-items: center; gap: 15px; }
        .list-item i.main-icon { width: 20px; text-align: center; }
        .list-item .chevron { font-size: 0.8rem; color: #94a3b8; }
        .text-danger { color: #ef4444; font-weight: 500; }

        /* Bottom Nav Bar */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: #fff;
            display: flex;
            justify-content: space-around;
            padding: 12px 0 25px 0; /* Extra padding for modern phones */
            border-top: 1px solid #f1f5f9;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.02);
        }
        .nav-item { text-align: center; color: #94a3b8; text-decoration: none; font-size: 0.65rem; font-weight: 500; }
        .nav-item i { font-size: 1.3rem; display: block; margin-bottom: 4px; }
        .nav-item.active { color: var(--nu-blue); }

        .spacer { height: 100px; } /* Buffer for scrolling */
    </style>
</head>
<body>

    <div class="header-banner"></div>

    <div class="profile-container">
        <div class="profile-img-wrapper">
            <img src="{{ asset('images/nu-building.jpg') }}" class="profile-img" alt="Alex">
            <div class="badge-icon"><i class="fas fa-medal"></i></div>
        </div>

        <h2 class="user-name">Alex De La Cruz</h2>
        <p class="user-course">BS Computer Science</p>
        <p class="user-year">4th Year</p>

        <div class="btn-group">
            <button class="btn btn-message">Message</button>
            <button class="btn btn-yearbook">View Yearbook</button>
        </div>

        <div class="section">
            <div class="section-title"><i class="fas fa-book-open"></i> About</div>
            <p class="about-text">
                Aspiring software engineer with a passion for mobile development and UI/UX design. President of the Computer Science Society 2024-2025.
            </p>
        </div>

        <div class="section">
            <div class="section-title"><i class="fas fa-award"></i> Achievements</div>
            
            <div class="card card-yellow">
                <div class="card-info">
                    <h4>Dean's Lister</h4>
                    <p>First Semester, AY 2025-2026</p>
                </div>
                <i class="fas fa-ribbon"></i>
            </div>

            <div class="card card-blue">
                <div class="card-info">
                    <h4>Best Capstone Project</h4>
                    <p>Technology Expo 2025</p>
                </div>
                <i class="fas fa-ribbon"></i>
            </div>
        </div>

        <div class="list-item">
            <div><i class="fas fa-cog main-icon"></i> Account Settings</div>
            <i class="fas fa-chevron-right chevron"></i>
        </div>

        <div class="list-item text-danger">
            <div><i class="fas fa-sign-out-alt main-icon"></i> Sign Out</div>
        </div>

        <div class="spacer"></div>
    </div>

    <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i>Home</a>
        <a href="/directory" class="nav-item"><i class="fas fa-users"></i>Directory</a>
        <a href="/gallery" class="nav-item"><i class="fas fa-images"></i>Gallery</a>
        <a href="/sections" class="nav-item"><i class="fas fa-th-large"></i>Sections</a>
        <a href="/achievements" class="nav-item"><i class="fas fa-trophy"></i>Achivement</a>
        <a href="/faculty" class="nav-item"><i class="fas fa-user-tie"></i>Faculty</a>
        <a href="/profile" class="nav-item active"><i class="fas fa-user-circle"></i>Profile</a>
    </nav>

</body>
</html>