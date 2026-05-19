<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Student Directory</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8fafc; padding-bottom: 90px; }

        /* Blue Header */
        .header { background-color: #3b50b9; color: white; padding: 40px 20px 25px; }
        .header h1 { font-size: 1.4rem; font-weight: 700; color: #FFD700; } /* Yellowish title */
        .header p { font-size: 0.75rem; opacity: 0.8; }

        /* Search Bar */
        .search-container { padding: 20px; margin-top: -30px; }
        .search-box { 
            background: white; display: flex; align-items: center; 
            padding: 12px 20px; border-radius: 15px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
        }
        .search-box i { color: #94a3b8; margin-right: 10px; }
        .search-box input { border: none; outline: none; width: 100%; font-size: 0.9rem; color: #333; }

        /* Filters */
        .filter-scroll { 
            display: flex; gap: 10px; overflow-x: auto; 
            padding: 0 20px 20px; white-space: nowrap; 
            scrollbar-width: none; /* Hide scrollbar Firefox */
        }
        .filter-scroll::-webkit-scrollbar { display: none; } /* Hide scrollbar Chrome */
        
        .filter-pill { 
            padding: 8px 18px; border-radius: 20px; font-size: 0.75rem; 
            font-weight: 600; background: white; color: #64748b; 
            border: 1px solid #e2e8f0; text-decoration: none;
        }
        .filter-pill.active { background: #3b50b9; color: white; border-color: #3b50b9; }

        /* Student List */
        .student-list { padding: 0 20px; display: flex; flex-direction: column; gap: 15px; }
        .student-card { 
            background: white; border-radius: 20px; padding: 15px; 
            display: flex; align-items: center; justify-content: space-between;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            text-decoration: none; color: inherit;
        }
        .student-info { display: flex; align-items: center; gap: 15px; }
        .student-img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
        
        .name-details h4 { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
        .name-details .course { font-size: 0.7rem; color: #3b50b9; font-weight: 500; display: block; }
        .name-details .year { 
            font-size: 0.6rem; color: #94a3b8; background: #f1f5f9; 
            padding: 2px 8px; border-radius: 8px; display: inline-block; margin-top: 4px;
        }
        .arrow-icon { color: #cbd5e1; font-size: 0.8rem; }

        /* Bottom Nav */
        .bottom-nav { 
            position: fixed; bottom: 0; left: 0; width: 100%; 
            background: white; padding: 15px 25px; 
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.05); z-index: 100;
        }
        .nav-item { text-align: center; text-decoration: none; color: #94a3b8; }
        .nav-item i { font-size: 1.2rem; display: block; margin-bottom: 4px; }
        .nav-item span { font-size: 0.6rem; }
        .nav-item.active { color: #3b50b9; position: relative; }
        .nav-item.active::after { 
            content: ''; position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
            width: 4px; height: 4px; background: #3b50b9; border-radius: 50%;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Student Directory</h1>
        <p>Find your batchmates</p>
    </div>

    <div class="search-container">
        <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search...">
        </div>
    </div>

    <div class="filter-scroll">
        <a href="#" class="filter-pill active">All</a>
        <a href="#" class="filter-pill">BSCS</a>
        <a href="#" class="filter-pill">BSIT</a>
        <a href="#" class="filter-pill">BSA</a>
        <a href="#" class="filter-pill">Engineering</a>
    </div>

    <div class="student-list">
        <a href="#" class="student-card">
            <div class="student-info">
                <img src="https://i.pravatar.cc/150?u=maria" class="student-img">
                <div class="name-details">
                    <h4>Maria Santos</h4>
                    <span class="course">BS Accountancy</span>
                    <span class="year">3rd Year</span>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </a>

        <a href="#" class="student-card">
            <div class="student-info">
                <img src="https://i.pravatar.cc/150?u=john" class="student-img">
                <div class="name-details">
                    <h4>John Reyes</h4>
                    <span class="course">BS Information Technology</span>
                    <span class="year">2nd Year</span>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </a>

        <a href="#" class="student-card">
            <div class="student-info">
                <img src="https://i.pravatar.cc/150?u=sarah" class="student-img">
                <div class="name-details">
                    <h4>Sarah Lim</h4>
                    <span class="course">BA Communication</span>
                    <span class="year">1st Year</span>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </a>

        <a href="#" class="student-card">
            <div class="student-info">
                <img src="https://i.pravatar.cc/150?u=miguel" class="student-img">
                <div class="name-details">
                    <h4>Miguel Tan</h4>
                    <span class="course">BS Civil Engineering</span>
                    <span class="year">5th Year</span>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </a>
    </div>

    <nav class="bottom-nav">
        <a href="/dashboard" class="nav-item">
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
        </a>
        <a href="/directory" class="nav-item active">
            <i class="fa-solid fa-address-book"></i>
            <span>Directory</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-images"></i>
            <span>Gallery</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-users-viewfinder"></i>
            <span>Sections</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-award"></i>
            <span>Achivement</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>Faculty</span>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-user"></i>
            <span>Profile</span>
        </a>
    </nav>

</body>
</html>