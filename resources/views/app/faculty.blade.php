<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty & Staff - Sinag-Bughaw</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background-color: #fff; color: #333; }

        /* Header Blue Bar */
        .header {
            background-color: #35408f; /* Exact Blue from proto */
            padding: 15px 20px;
            color: #ffc107; /* Yellow text */
            font-weight: 700;
            font-size: 1.1rem;
        }

        .content-padding { padding: 20px; }

        .title-section h2 {
            color: #35408f;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .title-section p {
            color: #ffc107;
            font-size: 0.85rem;
            font-style: italic;
            margin-bottom: 20px;
        }

        /* Department Section */
        .dept-container { margin-bottom: 25px; }

        .dept-title {
            color: #35408f;
            font-size: 0.9rem;
            font-weight: 700;
            font-style: italic;
            border-bottom: 2px solid #ffc107; /* The Yellow Line */
            padding-bottom: 5px;
            margin-bottom: 15px;
        }

        /* Faculty Card */
        .faculty-card {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding-left: 10px;
        }

        .faculty-img {
            width: 100px;
            height: 100px;
            background-color: #f0f0f0;
            object-fit: cover;
            border-radius: 4px; /* Minimal rounding like in proto */
        }

        /* Bottom Nav (Consistent with Profile) */
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
            box-shadow: 0 -2px 10px rgba(0,0,0,0.02);
        }
        .nav-item { text-align: center; color: #94a3b8; text-decoration: none; font-size: 0.65rem; font-weight: 500; }
        .nav-item i { font-size: 1.3rem; display: block; margin-bottom: 4px; }
        .nav-item.active { color: #35408f; }

        .spacer { height: 100px; }
    </style>
</head>
<body>

    <div class="header">faculty</div>

    <div class="content-padding">
        <div class="title-section">
            <h2>Faculty & Staff</h2>
            <p>Meet the dedicated educators and staff of NU Lipa</p>
        </div>

        <div class="dept-container">
            <div class="dept-title">Computer Science Department</div>
            <div class="faculty-card">
                <img src="https://via.placeholder.com/100" class="faculty-img" alt="CS Faculty">
            </div>
        </div>

        <div class="dept-container">
            <div class="dept-title">Information Technology Department</div>
            <div class="faculty-card">
                <img src="https://via.placeholder.com/100" class="faculty-img" alt="IT Faculty">
            </div>
        </div>

        <div class="dept-container">
            <div class="dept-title">Nursing Department</div>
            <div class="faculty-card">
                <img src="https://via.placeholder.com/100" class="faculty-img" alt="Nursing Faculty">
            </div>
        </div>

        <div class="dept-container">
            <div class="dept-title">Psychology Department</div>
            <div class="faculty-card">
                <img src="https://via.placeholder.com/100" class="faculty-img" alt="Psych Faculty">
            </div>
        </div>

        <div class="dept-container">
            <div class="dept-title">Administration</div>
            <div class="faculty-card">
                <img src="https://via.placeholder.com/100" class="faculty-img" alt="Admin">
            </div>
        </div>

        <div class="spacer"></div>
    </div>

    <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i>Home</a>
        <a href="/directory" class="nav-item"><i class="fas fa-users"></i>Directory</a>
        <a href="/gallery" class="nav-item"><i class="fas fa-images"></i>Gallery</a>
        <a href="/sections" class="nav-item"><i class="fas fa-th-large"></i>Sections</a>
        <a href="/achievements" class="nav-item"><i class="fas fa-trophy"></i>Achievement</a>
        <a href="/faculty" class="nav-item active"><i class="fas fa-user-tie"></i>Faculty</a>
        <a href="/profile" class="nav-item"><i class="fas fa-user-circle"></i>Profile</a>
    </nav>

</body>
</html>