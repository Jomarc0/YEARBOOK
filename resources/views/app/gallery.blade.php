<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Gallery</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8fafc; padding-bottom: 90px; }

        /* Blue Header */
        .header { background-color: #3b50b9; color: white; padding: 40px 20px 25px; }
        .header h1 { font-size: 1.4rem; font-weight: 700; color: #FFD700; margin-bottom: 2px; }
        .header p { font-size: 0.75rem; opacity: 0.8; }

        /* Gallery Container */
        .gallery-container { padding: 20px; display: flex; flex-direction: column; gap: 25px; }

        /* Album Card */
        .album-card { text-decoration: none; color: inherit; display: block; }
        
        .image-wrapper { 
            position: relative; 
            width: 100%; 
            height: 200px; 
            border-radius: 20px; 
            overflow: hidden; 
            margin-bottom: 12px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .image-wrapper img { width: 100%; height: 100%; object-fit: cover; }

        /* Photo Count Badge */
        .photo-count {
            position: absolute;
            bottom: 15px;
            left: 15px;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px 12px;
            border-radius: 10px;
            font-size: 0.65rem;
            font-weight: 700;
            color: #3b50b9;
        }

        .album-info h3 { font-size: 1.1rem; font-weight: 700; color: #3b50b9; margin-bottom: 4px; }
        .album-info p { font-size: 0.75rem; color: #94a3b8; }

        /* Bottom Nav (Same as Dashboard & Directory) */
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
        <h1>Gallery</h1>
        <p>Memories captured</p>
    </div>

    <div class="gallery-container">
        <a href="#" class="album-card">
            <div class="image-wrapper">
                <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000" alt="Graduation">
                <div class="photo-count">120 Photos</div>
            </div>
            <div class="album-info">
                <h3>Graduation 2025</h3>
                <p>Updated 2 days ago</p>
            </div>
        </a>

        <a href="#" class="album-card">
            <div class="image-wrapper">
                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000" alt="University Week">
                <div class="photo-count">85 Photos</div>
            </div>
            <div class="album-info">
                <h3>University Week</h3>
                <p>Updated 2 days ago</p>
            </div>
        </a>

        <a href="#" class="album-card">
            <div class="image-wrapper">
                <img src="https://images.unsplash.com/photo-1541252260730-0412e3e2108e?q=80&w=1000" alt="Sports Fest">
                <div class="photo-count">45 Photos</div>
            </div>
            <div class="album-info">
                <h3>Sports Fest</h3>
                <p>Updated 2 days ago</p>
            </div>
        </a>
    </div>

    <nav class="bottom-nav">
        <a href="/dashboard" class="nav-item">
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
        </a>
        <a href="/directory" class="nav-item">
            <i class="fa-solid fa-address-book"></i>
            <span>Directory</span>
        </a>
        <a href="/gallery" class="nav-item active">
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