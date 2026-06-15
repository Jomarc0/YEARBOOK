<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile | {{ Auth::user()->name }}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-blue-bright: #3f51b5;
            --nu-yellow: #fdb813;
            --bg-gray: #f2f4f7;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background-color: var(--bg-gray); color: #333; overflow-x: hidden; }

        /* NAVIGATION */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px 8%; background: white; position: sticky; top: 0; z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }
        .nav-logo h3 { color: var(--nu-blue); font-size: 1rem; letter-spacing: 1px; }
        .nav-logo span { font-weight: 300; font-size: 0.7rem; display: block; margin-top: -3px; color: var(--nu-blue-bright); }
        .nav-links { display: flex; gap: 25px; list-style: none; }
        .nav-links a { color: #666; text-decoration: none; font-size: 0.8rem; font-weight: 600; transition: 0.3s; }
        .nav-links a:hover { color: var(--nu-blue-bright); }
        
        .user-nav { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; text-align: right; }
        .profile-small { width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid var(--nu-blue-bright); }

        /* HEADER & BANNER */
        .banner { 
            width: 100%; height: 300px; 
            background: linear-gradient(rgba(29, 43, 75, 0.4), rgba(29, 43, 75, 0.8)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe1?auto=format&fit=crop&w=1200') center/cover; 
        }
        
        .profile-container { max-width: 1100px; margin: -100px auto 50px; padding: 0 20px; position: relative; }
        
        /* MAIN CARD */
        .main-card { 
            background: white; border-radius: 24px; padding: 40px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.08); display: flex; gap: 40px; align-items: center;
            animation: fadeInScale 0.6s ease forwards;
        }

        .profile-img-wrap { position: relative; min-width: 200px; }
        
        /* Glassmorphism Loader */
        .glass-loader {
            position: absolute;
            top: 0; left: 0;
            width: 200px; height: 200px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-radius: 50%;
            display: none; 
            align-items: center; justify-content: center;
            z-index: 5;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .spinner {
            width: 40px; height: 40px;
            border: 4px solid rgba(29, 43, 75, 0.1);
            border-left-color: var(--nu-blue-bright);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .profile-main-img { 
            width: 200px; height: 200px; border-radius: 50%; border: 7px solid white; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.15); object-fit: cover; cursor: pointer;
            transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .uploading-blur { filter: blur(4px); }

        .upload-icon {
            position: absolute; bottom: 15px; right: 15px; 
            background: var(--nu-blue-bright); color: white; 
            width: 42px; height: 42px; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            border: 4px solid white; cursor: pointer; transition: 0.3s; z-index: 6;
        }
        .upload-icon:hover { background: var(--nu-blue); transform: rotate(15deg); }

        .status-online { 
            width: 20px; height: 20px; background: #2ecc71; border: 4px solid white;
            border-radius: 50%; position: absolute; top: 20px; left: 20px;
            box-shadow: 0 0 10px rgba(46, 204, 113, 0.4); z-index: 2;
        }

        .profile-info { flex: 1; }
        .profile-info h1 { font-size: 2.2rem; color: var(--nu-blue); font-weight: 800; margin-bottom: 5px; text-transform: capitalize; }
        .profile-info p.sub { color: var(--nu-blue-bright); font-weight: 700; font-size: 1rem; margin-bottom: 18px; letter-spacing: 0.5px; }
        
        .bio-container { position: relative; margin-bottom: 25px; }
        .bio { color: #555; font-size: 0.95rem; line-height: 1.7; font-style: italic; max-width: 600px; transition: 0.3s; cursor: pointer; }
        .bio:hover { color: var(--nu-blue-bright); }
        
        #bioInput {
            width: 100%; padding: 12px; border-radius: 12px; 
            border: 2px solid var(--nu-blue-bright); font-family: inherit; 
            font-size: 0.9rem; outline: none; color: #444; resize: none;
        }

        .actions { display: flex; gap: 12px; }
        .btn-msg { 
            background: var(--nu-blue); color: white; padding: 12px 30px; 
            border-radius: 12px; text-decoration: none; font-size: 0.9rem; 
            font-weight: 700; display: flex; align-items: center; gap: 10px;
            transition: 0.3s; box-shadow: 0 8px 20px rgba(29, 43, 75, 0.2);
        }
        .btn-msg:hover { transform: translateY(-3px); background: var(--nu-blue-bright); }
        .btn-share { border: 1px solid #ddd; width: 45px; height: 45px; border-radius: 12px; color: #666; background: white; cursor: pointer; transition: 0.3s; }
        .btn-share:hover { background: #f9f9f9; color: var(--nu-blue); border-color: #ccc; }

        /* DETAILS GRID */
        .details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 30px; }
        .detail-card { 
            background: white; border-radius: 20px; padding: 30px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02);
            transition: 0.3s;
        }
        .detail-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.06); }
        .detail-card h4 { font-size: 1rem; display: flex; align-items: center; gap: 12px; margin-bottom: 25px; color: var(--nu-blue); font-weight: 700; }
        .detail-card h4 i { color: var(--nu-yellow); font-size: 1.1rem; }

        .achieve-list li { list-style: none; margin-bottom: 20px; position: relative; padding-left: 20px; }
        .achieve-list li::before { content: ""; width: 6px; height: 6px; background: var(--nu-blue-bright); border-radius: 50%; position: absolute; left: 0; top: 8px; }
        .achieve-list b { font-size: 0.9rem; display: block; color: #111; margin-bottom: 2px; }
        .achieve-list span { font-size: 0.75rem; color: #888; font-weight: 500; }

        .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 0.85rem; padding-bottom: 12px; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #888; font-weight: 500; }
        .info-value { color: var(--nu-blue); font-weight: 700; }

        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .photo-box { aspect-ratio: 1; border-radius: 12px; background: #f8f9fa; border: 2px dashed #e0e0e0; display: flex; align-items: center; justify-content: center; transition: 0.3s; cursor: pointer; }
        .photo-box:hover { border-color: var(--nu-blue-bright); background: #f0f2ff; color: var(--nu-blue-bright); }

        /* Toast Notification */
        #toast {
            display: none; position: fixed; top: 100px; right: 30px; 
            background: #2ecc71; color: white; padding: 15px 25px; 
            border-radius: 12px; z-index: 2000; font-weight: 600;
            box-shadow: 0 10px 30px rgba(46, 204, 113, 0.3);
            animation: slideIn 0.4s ease forwards;
        }

        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        footer { background: #0e1628; color: white; padding: 40px 8%; margin-top: 60px; text-align: center; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; color: #55607a; font-size: 0.8rem; letter-spacing: 1px; }
    </style>
</head>
<body>

    <nav>
        <div class="nav-logo">
            <h3>NU Lipa <span>SINAG-BUGHAW</span></h3>
        </div>
        <ul class="nav-links">
            <li><a href="/dashboard">Home</a></li>
            <li><a href="/directory">Directory</a></li>
            <li><a href="/faculty">Faculty</a></li>
            <li><a href="/gallery">Gallery</a></li>
        </ul>
        <div class="user-nav">
            <div>
                <b style="color:var(--nu-blue-bright); text-transform: capitalize;">{{ Auth::user()->name }}</b><br>
                <span style="color:#999">Batch 2026 • Student</span>
            </div>
            <img src="{{ Auth::user()->profile_picture ? asset('storage/'.Auth::user()->profile_picture) : asset('images/default-avatar.png') }}" class="profile-small">
        </div>
    </nav>

    <div class="banner"></div>

    <div class="profile-container">
        <div id="toast"><i class="fas fa-check-circle"></i> Profile updated!</div>

        <div class="main-card">
            <div class="profile-img-wrap">
                <div class="status-online"></div>
                
                <div class="glass-loader" id="uploadLoader">
                    <div class="spinner"></div>
                </div>

                <img src="{{ Auth::user()->profile_picture ? asset('storage/'.Auth::user()->profile_picture) : asset('images/default-avatar.png') }}" 
                     class="profile-main-img" id="displayImage">
                
                <form action="{{ route('profile.update.photo') }}" method="POST" enctype="multipart/form-data" id="photoForm">
                    @csrf
                    <label for="profile_picture" class="upload-icon">
                        <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" name="profile_picture" id="profile_picture" hidden accept="image/*" onchange="startUpload()">
                </form>
            </div>
            
            <div class="profile-info">
                <h1>{{ Auth::user()->name }}</h1>
                <p class="sub">{{ Auth::user()->course ?? 'BS Computer Science' }} • Batch 2026</p>
                
                <div class="bio-container" id="bioWrapper">
                    <p class="bio" id="userBio" onclick="toggleBioEdit()" title="Click to edit your quote">
                        @if(Auth::user()->bio)
                            "{{ Auth::user()->bio }}"
                        @else
                            Click here to add your yearbook quote...
                        @endif
                        <i class="fas fa-pencil-alt" style="font-size: 0.7rem; color: #ccc; margin-left: 8px;"></i>
                    </p>
                    
                    <div id="bioEditGroup" style="display: none; margin-top: 10px;">
                        <textarea id="bioInput" rows="3" placeholder="Write your yearbook legacy...">{{ Auth::user()->bio }}</textarea>
                        <div style="margin-top: 10px; display: flex; gap: 8px;">
                            <button onclick="saveBio()" style="background: var(--nu-blue-bright); color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Save Changes</button>
                            <button onclick="toggleBioEdit()" style="background: #eee; color: #666; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Cancel</button>
                        </div>
                    </div>
                </div>
                
                <div style="display:flex; align-items: center; gap: 20px; margin: 20px 0;">
                    <div style="font-size: 0.8rem; color: #777; font-weight: 500;">
                        <span style="margin-right: 15px;"><i class="fas fa-map-marker-alt" style="color: #e74c3c;"></i> Lipa City, Batangas</span>
                        <span><i class="fas fa-university" style="color: var(--nu-blue-bright);"></i> NU Lipa</span>
                    </div>
                </div>

                <div class="actions">
                    <a href="#" class="btn-msg"><i class="fas fa-paper-plane"></i> Message</a>
                    <button class="btn-share"><i class="fas fa-share-alt"></i></button>
                    <button class="btn-share" title="Settings"><i class="fas fa-cog"></i></button>
                </div>
            </div>
        </div>

        <div class="details-grid">
            <div class="detail-card">
                <h4><i class="fas fa-award"></i> Achievements</h4>
                <ul class="achieve-list">
                    <li><b>Sinag-Bughaw Developer</b><span>Capstone Project 2026</span></li>
                    <li><b>Tech Innovator Award</b><span>NU Lipa Exhibit</span></li>
                    <li><b>Dean's Lister</b><span>1st Semester A.Y. 2025-2026</span></li>
                </ul>
            </div>

            <div class="detail-card">
                <h4><i class="fas fa-graduation-cap"></i> Academic Info</h4>
                <div class="info-row"><span class="info-label">Student ID</span><span class="info-value">{{ Auth::user()->student_id ?? '2023-183929' }}</span></div>
                <div class="info-row"><span class="info-label">Course</span><span class="info-value">{{ Auth::user()->course ?? 'BSCS' }}</span></div>
                <div class="info-row"><span class="info-label">Year Level</span><span class="info-value">4th Year</span></div>
                <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color: #2ecc71;">Enrolled</span></div>
            </div>

            <div class="detail-card">
                <h4><i class="fas fa-images"></i> Tagged Photos</h4>
                <div class="photo-grid">
                    <div class="photo-box"><i class="fas fa-plus"></i></div>
                    <div class="photo-box"><i class="fas fa-plus"></i></div>
                    <div class="photo-box"><i class="fas fa-plus"></i></div>
                    <div style="grid-column: 1 / -1; font-size: 0.7rem; color: #bbb; text-align: center; margin-top: 10px;">
                        Photos where you are tagged will appear here.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer>
        <div class="footer-bottom">&copy; 2026 NATIONAL UNIVERSITY LIPA • SINAG-BUGHAW PROJECT</div>
    </footer>

    <script>
        // Photo Upload Logic with Glass Loader
        function startUpload() {
            const loader = document.getElementById('uploadLoader');
            const image = document.getElementById('displayImage');
            const fileInput = document.getElementById('profile_picture');
            const form = document.getElementById('photoForm');

            if (fileInput.files && fileInput.files[0]) {
                loader.style.display = 'flex';
                image.classList.add('uploading-blur');
                form.submit();
            }
        }

        // Bio Edit Logic
        function toggleBioEdit() {
            const bioDisplay = document.getElementById('userBio');
            const bioEditGroup = document.getElementById('bioEditGroup');
            
            if (bioDisplay.style.display === "none") {
                bioDisplay.style.display = "block";
                bioEditGroup.style.display = "none";
            } else {
                bioDisplay.style.display = "none";
                bioEditGroup.style.display = "block";
                document.getElementById('bioInput').focus();
            }
        }

        async function saveBio() {
            const bioInput = document.getElementById('bioInput');
            const newBio = bioInput.value.trim();
            const bioDisplay = document.getElementById('userBio');
            
            try {
                const response = await fetch("{{ route('profile.update.bio') }}", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ bio: newBio })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const displayText = newBio ? `"${newBio}"` : "Click here to add your yearbook quote...";
                    bioDisplay.innerHTML = `${displayText} <i class="fas fa-pencil-alt" style="font-size: 0.7rem; color: #ccc; margin-left: 8px;"></i>`;
                    toggleBioEdit();
                    showToast();
                } else {
                    alert('Error: ' + (data.message || 'Could not update bio.'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Connection error. Is your local server running?');
            }
        }

        function showToast() {
            const toast = document.getElementById('toast');
            toast.style.display = "block";
            setTimeout(() => { toast.style.display = "none"; }, 3000);
        }
    </script>
</body>
</html>