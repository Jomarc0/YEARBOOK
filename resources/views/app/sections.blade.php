<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sinag-Bughaw | Sections</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8fafc; padding-bottom: 100px; }

        /* Blue Header */
        .header { background-color: #3b50b9; color: white; padding: 40px 20px 25px; }
        .header h1 { font-size: 1.4rem; font-weight: 700; color: #FFD700; }
        
        .batch-info { padding: 20px; }
        .batch-info h2 { font-size: 1.1rem; color: #1e293b; font-weight: 700; }
        .batch-info p { font-size: 0.75rem; color: #64748b; }

        /* Sections Grid */
        .sections-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            padding: 0 15px; 
        }

        .section-card { 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
        }

        /* Group Photo */
        .group-photo { width: 100%; height: 80px; object-fit: cover; border-bottom: 1px solid #eee; }

        /* Adviser Section */
        .adviser-box { padding: 8px; }
        .adviser-label { font-size: 0.55rem; color: #94a3b8; font-weight: 600; display: block; }
        .adviser-info { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
        .adviser-img { width: 18px; height: 18px; border-radius: 50%; }
        .adviser-name-placeholder { background: #e2e8f0; height: 10px; width: 80%; border-radius: 4px; }

        /* Student Preview Grid */
        .student-preview { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 4px; 
            padding: 0 8px 8px; 
        }
        .preview-img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 4px; border: 1px solid #f1f5f9; }

        /* View Button */
        .btn-view { 
            background: #1a237e; 
            color: white; 
            text-align: center; 
            padding: 8px; 
            font-size: 0.7rem; 
            font-weight: 600; 
            text-decoration: none;
            margin-top: auto;
        }

        /* Bottom Nav */
        .bottom-nav { 
            position: fixed; bottom: 0; left: 0; width: 100%; 
            background: white; padding: 15px 20px; 
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.05); z-index: 100;
        }
        .nav-item { text-align: center; text-decoration: none; color: #94a3b8; font-size: 0.6rem; }
        .nav-item i { font-size: 1.2rem; display: block; margin-bottom: 4px; }
        .nav-item.active { color: #3b50b9; }
    </style>
</head>
<body>

    <div class="header">
        <h1>section</h1>
    </div>

    <div class="batch-info">
        <h2>BATCH 2024 - 2025</h2>
        <p>View students organized by their sections</p>
    </div>

    <div class="sections-grid">
        @for ($i = 0; $i < 6; $i++)
        <div class="section-card">
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400" class="group-photo">
            
            <div class="adviser-box">
                <span class="adviser-label">Class Adviser</span>
                <div class="adviser-info">
                    <img src="https://i.pravatar.cc/150?u=teacher{{$i}}" class="adviser-img">
                    <div class="adviser-name-placeholder"></div>
                </div>
            </div>

            <div class="student-preview">
                <img src="https://i.pravatar.cc/150?u=a{{$i}}" class="preview-img">
                <img src="https://i.pravatar.cc/150?u=b{{$i}}" class="preview-img">
                <img src="https://i.pravatar.cc/150?u=c{{$i}}" class="preview-img">
                <img src="https://i.pravatar.cc/150?u=d{{$i}}" class="preview-img">
                <img src="https://i.pravatar.cc/150?u=e{{$i}}" class="preview-img">
                <img src="https://i.pravatar.cc/150?u=f{{$i}}" class="preview-img">
            </div>

            <a href="#" class="btn-view">View All Students</a>
        </div>
        @endfor
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
        <a href="/gallery" class="nav-item">
            <i class="fa-solid fa-images"></i>
            <span>Gallery</span>
        </a>
        <a href="/sections" class="nav-item active">
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