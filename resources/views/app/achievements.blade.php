<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Achievements - Sinag-Bughaw</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background-color: #fff; color: #333; }

        /* Header Blue Bar */
        .header {
            background-color: #3f4a9b; /* Exact Blue from proto */
            padding: 15px 20px;
            color: #ffc107; /* Yellow text */
            font-weight: 700;
            font-size: 1.1rem;
        }

        .content-padding { padding: 20px; }

        .title-section h2 {
            font-size: 1.4rem;
            color: #1a1a1a;
            margin-bottom: 5px;
            font-weight: 600;
        }
        .title-section p {
            font-size: 1.1rem;
            color: #1a1a1a;
            margin-bottom: 30px;
            line-height: 1.3;
        }

        /* Achievement Category */
        .category-container { margin-bottom: 25px; }

        .category-header {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1rem;
            color: #1a1a1a;
            border-bottom: 2.5px solid #ffc107; /* The Yellow Line */
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .category-header i { color: #ffc107; font-size: 1.2rem; }

        /* Achievement Card */
        .award-card {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            align-items: flex-start;
        }

        .award-img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            background: #eee;
        }

        .award-details { flex: 1; }

        .award-title { font-weight: 700; font-size: 0.95rem; color: #1a1a1a; }
        .award-name { font-size: 0.75rem; color: #666; margin-bottom: 8px; }

        /* Inner Content Box */
        .inner-info {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            background: #fff;
        }
        .inner-info p {
            font-size: 0.65rem;
            color: #777;
            line-height: 1.4;
            border-bottom: 1px solid #999;
            padding-bottom: 4px;
            margin-bottom: 4px;
        }
        .inner-info span {
            font-size: 0.6rem;
            color: #999;
            display: block;
        }

        /* Bottom Nav */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: #fff;
            display: flex;
            justify-content: space-around;
            padding: 12px 0 25px 0;
            border-top: 1px solid #f1f5f9;
        }
        .nav-item { text-align: center; color: #94a3b8; text-decoration: none; font-size: 0.65rem; font-weight: 500; }
        .nav-item i { font-size: 1.3rem; display: block; margin-bottom: 4px; }
        .nav-item.active { color: #3f4a9b; }

        .spacer { height: 100px; }
    </style>
</head>
<body>

    <div class="header">Achievements</div>

    <div class="content-padding">
        <div class="title-section">
            <h2>Celebrating excellence and</h2>
            <p>outstanding accomplishments</p>
        </div>

        <div class="category-container">
            <div class="category-header">
                <i class="fas fa-trophy"></i> Academic Excellence
            </div>
            <div class="award-card">
                <img src="https://via.placeholder.com/60" class="award-img" alt="Student">
                <div class="award-details">
                    <div class="award-title">Summa Cum Laude</div>
                    <div class="award-name">Maria Santos</div>
                    <div class="inner-info">
                        <p>Graduated with highest honors, maintaining a perfect GPA throughout the program.</p>
                        <span>March 2026</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="category-container">
            <div class="category-header">
                <i class="fas fa-trophy"></i> Research Excellence
            </div>
            <div class="award-card">
                <img src="https://via.placeholder.com/60" class="award-img" alt="Student">
                <div class="award-details">
                    <div class="award-title">Best Thesis Award</div>
                    <div class="award-name">Juan Dela Cruz & Team</div>
                    <div class="inner-info">
                        <p>Outstanding research on AI-powered educational systems.</p>
                        <span>February 2026</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="category-container">
            <div class="category-header">
                <i class="fas fa-trophy"></i> Professional Excellence
            </div>
            <div class="award-card">
                <div style="width:60px; height:60px; border-radius:50%; background:#e2e8b2;"></div>
                <div class="award-details">
                    <div class="award-title">CPA Board Top 10</div>
                    <div class="award-name">Carlos Garcia</div>
                    <div class="inner-info">
                        <p>Ranked 7th in the Certified Public Accountant Licensure Examination.</p>
                        <span>December 2025</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="spacer"></div>
    </div>

    <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i>Home</a>
        <a href="/directory" class="nav-item"><i class="fas fa-users"></i>Directory</a>
        <a href="/gallery" class="nav-item"><i class="fas fa-images"></i>Gallery</a>
        <a href="/sections" class="nav-item"><i class="fas fa-th-large"></i>Sections</a>
        <a href="/achievements" class="nav-item active"><i class="fas fa-trophy"></i>Achievement</a>
        <a href="/faculty" class="nav-item"><i class="fas fa-user-tie"></i>Faculty</a>
        <a href="/profile" class="nav-item"><i class="fas fa-user-circle"></i>Profile</a>
    </nav>

</body>
</html>