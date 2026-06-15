<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Gallery | Sinag-Bughaw NU Lipa</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-gold: #fdb813; 
            --nu-blue-light: #2a3d66;
            --bg-canvas: #f8fafc;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: var(--bg-canvas); color: var(--nu-blue); overflow-x: hidden; }

        /* SECURITY SHIELD */
        #security-shield {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(29, 43, 75, 0.98); color: var(--nu-gold); z-index: 99999;
            text-align: center; flex-direction: column; justify-content: center; align-items: center;
            backdrop-filter: blur(10px);
        }

        /* ENTRANCE ANIMATIONS */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        /* NAVIGATION (REFINED) */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px 8%; background: white; position: sticky; top: 0; z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .nav-logo h3 { color: var(--nu-blue); font-size: 1.1rem; font-weight: 800; text-transform: uppercase; line-height: 1; }
        .nav-logo span { font-weight: 400; font-size: 0.65rem; color: var(--nu-gold); letter-spacing: 1px; display: block; }
        
        .nav-links { display: flex; gap: 30px; list-style: none; align-items: center; }
        .nav-links a { color: #64748b; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: 0.3s; }
        .nav-links a.active { color: var(--nu-blue); position: relative; }
        .nav-links a.active::after { content: ''; position: absolute; bottom: -5px; left: 0; width: 20px; height: 3px; background: var(--nu-gold); border-radius: 10px; }
        
        .user-nav { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .user-info { text-align: right; }
        .user-info b { font-size: 0.8rem; color: var(--nu-blue); display: block; }
        .user-info span { font-size: 0.65rem; color: #94a3b8; display: block; font-weight: 500; }
        .profile-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--nu-gold); }

        /* GALLERY HEADER */
        .gallery-hero {
            background: linear-gradient(135deg, var(--nu-blue) 0%, var(--nu-blue-light) 100%);
            padding: 80px 8% 120px; color: white; border-radius: 0 0 60px 60px;
            text-align: center; position: relative; overflow: hidden;
        }
        .gallery-hero h1 { font-size: 3rem; font-weight: 800; margin-bottom: 15px; }
        .gallery-hero h1 span { color: var(--nu-gold); }
        .gallery-hero p { opacity: 0.8; font-size: 1rem; max-width: 600px; margin: 0 auto; font-weight: 300; }

        /* SEARCH & FILTERS */
        .gallery-controls { max-width: 1000px; margin: -35px auto 40px; padding: 0 20px; display: flex; gap: 15px; }
        .search-wrap { flex: 1; position: relative; }
        .search-bar {
            width: 100%; padding: 20px 30px 20px 60px; border-radius: 20px;
            border: none; background: white; font-weight: 600;
            box-shadow: 0 15px 35px rgba(0,0,0,0.08); outline: none;
        }
        .search-icon { position: absolute; left: 25px; top: 50%; transform: translateY(-50%); color: var(--nu-gold); }
        .face-tools { max-width: 1000px; margin: 0 auto 30px; padding: 0 20px; }
        .face-panel { background: white; border-radius: 24px; box-shadow: 0 18px 36px rgba(29,43,75,0.08); padding: 24px; }
        .face-panel h3 { margin: 0 0 10px; font-size: 1.2rem; }
        .face-panel p { margin: 0 0 18px; color: #64748b; line-height: 1.6; }
        .face-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .face-input { flex: 1; min-width: 260px; padding: 14px 16px; border: 1px solid #dbe3f0; border-radius: 14px; background: #f8fafc; }
        .face-btn { border: none; background: var(--nu-blue); color: white; border-radius: 14px; padding: 14px 18px; font-weight: 700; cursor: pointer; }
        .face-state { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; margin-bottom: 14px; }
        .face-state.ready { background: #ecfdf3; color: #15803d; }
        .face-state.off { background: #fff7ed; color: #c2410c; }
        .match-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 18px; }
        .match-card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; }
        .match-card img { width: 56px; height: 56px; border-radius: 16px; object-fit: cover; border: 2px solid var(--nu-gold); margin-bottom: 12px; }
        .match-card h4 { margin: 0 0 4px; font-size: 1rem; }
        .match-card p { margin: 0; font-size: 0.85rem; color: #64748b; }
        
        .gallery-match-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 25px; }
        .gallery-match-item { border-radius: 20px; overflow: hidden; position: relative; height: 180px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .gallery-match-item img { width: 100%; height: 100%; object-fit: cover; }

        /* PHOTO GRID */
        .gallery-section { padding: 20px 8% 100px; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
        
        .album-card { 
            background: white; border-radius: 30px; overflow: hidden; 
            transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(0,0,0,0.02);
        }
        .album-card:hover { transform: translateY(-12px); box-shadow: 0 25px 50px rgba(29, 43, 75, 0.12); }
        
        .img-container { height: 260px; position: relative; overflow: hidden; background: #f1f5f9; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
        .album-card:hover .img-container img { transform: scale(1.08); }

        /* CNN SCANNING ANIMATION */
        .ai-scanner {
            position: absolute; top: 0; left: 0; width: 100%; height: 3px;
            background: var(--nu-gold); box-shadow: 0 0 15px var(--nu-gold);
            z-index: 10; opacity: 0; transition: 0.3s;
            animation: scan 2.5s infinite linear;
        }
        .album-card:hover .ai-scanner { opacity: 1; }
        @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }

        .face-box {
            position: absolute; border: 1.5px solid var(--nu-gold);
            width: 60px; height: 60px; border-radius: 4px;
            opacity: 0; z-index: 5; pointer-events: none;
        }
        .album-card:hover .face-box { opacity: 0.8; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

        .photo-badge { 
            position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.95);
            padding: 6px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 800;
            display: flex; align-items: center; gap: 6px; z-index: 11; color: var(--nu-blue);
        }

        .album-details { padding: 25px; }
        .album-details h4 { font-size: 1.2rem; font-weight: 800; color: var(--nu-blue); margin-bottom: 5px; }
        .album-date { font-size: 0.8rem; color: #94a3b8; font-weight: 500; display: flex; align-items: center; gap: 6px; }

        /* FOOTER */
        footer { background: var(--nu-blue); color: white; padding: 80px 8% 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 40px; }
        .footer-logo h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 20px; }
        .footer-logo span { color: var(--nu-gold); }
        .footer-logo p { font-size: 0.85rem; color: #94a3b8; line-height: 1.8; }
        .f-col h4 { font-size: 0.9rem; color: var(--nu-gold); text-transform: uppercase; margin-bottom: 25px; font-weight: 700; }
        .f-col li { list-style: none; color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px; }
        .footer-bottom { grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; text-align: center; color: #475569; font-size: 0.8rem; margin-top: 40px; }
    </style>
</head>
<body>

    <div id="security-shield">
        <i class="fas fa-fingerprint" style="font-size: 4rem; margin-bottom: 20px;"></i>
        <h1 style="font-weight: 800; letter-spacing: 2px;">ENCRYPTED VIEW</h1>
        <p style="opacity: 0.7; font-weight: 300;">Protecting Nationalian Biometric Data & Media</p>
    </div>

    <nav>
        <div class="nav-logo">
            <h3>NU LIPA <span>SINAG-BUGHAW</span></h3>
        </div>
        <ul class="nav-links">
            <li><a href="{{ url('/dashboard') }}">Home</a></li>
            <li><a href="{{ url('/directory') }}">Directory</a></li>
            <li><a href="{{ url('/faculty') }}">Faculty</a></li>
            <li><a href="{{ url('/gallery') }}" class="active">Gallery</a></li>
            <li><a href="{{ url('/sections') }}">Sections</a></li>
        </ul>
        <div class="user-nav">
            <div class="user-info">
                <b>{{ Auth::user()->name }}</b>
                <span>{{ Auth::user()->course ?? 'Student' }}</span>
            </div>
            <img src="{{ Auth::user()->profile_picture ? asset('storage/'.Auth::user()->profile_picture) : asset('images/user-profile.jpg') }}" class="profile-img" alt="{{ Auth::user()->name }}">
        </div>
    </nav>

    <header class="gallery-hero animate-up">
        <p>National University Lipa</p>
        <h1>The <span>Visual Archive</span></h1>
        <p>Relive the milestones and pioneer memories through our AI-powered digital gallery.</p>
    </header>

    <div class="gallery-controls animate-up" style="animation-delay: 0.2s;">
        <div class="search-wrap">
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="search-bar" placeholder="Search albums or events (BERT Semantic Search active)...">
        </div>
    </div>

    <section class="face-tools animate-up" style="animation-delay: 0.25s;">
        <div class="face-panel">
            <div class="face-state {{ $faceRecognitionEnabled ? 'ready' : 'off' }}">
                <i class="fas {{ $faceRecognitionEnabled ? 'fa-circle-check' : 'fa-triangle-exclamation' }}"></i>
                {{ $faceRecognitionEnabled ? 'Facial search is ready' : 'Facial search needs AWS Rekognition setup' }}
            </div>
            <h3>Identify a Student by Face</h3>
            <p>Upload a clear portrait or cropped face image and Sinag-Bughaw will compare it against indexed student profile photos in the Rekognition collection.</p>
            <form class="face-form" action="{{ route('gallery.face-search') }}" method="POST" enctype="multipart/form-data">
                @csrf
                <input class="face-input" type="file" name="face_image" accept="image/*" {{ $faceRecognitionEnabled ? '' : 'disabled' }} required>
                <button class="face-btn" type="submit" {{ $faceRecognitionEnabled ? '' : 'disabled' }}>Search Face</button>
            </form>
            @if ($errors->has('face_image'))
                <p style="margin-top: 12px; color: #b91c1c;">{{ $errors->first('face_image') }}</p>
            @endif
            @if (! empty($faceSearchResults))
                <div style="margin-top: 18px;">
                    <h3 style="font-size: 1rem;">Search Results</h3>
                    <p>{{ $faceSearchResults['message'] ?? 'Closest student matches based on facial similarity.' }}</p>
                    @if (($faceSearchResults['matches'] ?? []) !== [])
                        <div class="match-grid">
                            @foreach ($faceSearchResults['matches'] as $match)
                                <article class="match-card">
                                    <img src="{{ $match['profile_picture'] ? asset('storage/'.$match['profile_picture']) : 'https://ui-avatars.com/api/?name='.urlencode($match['name']).'&background=1d2b4b&color=fff' }}" alt="{{ $match['name'] }}">
                                    <h4>{{ $match['name'] }}</h4>
                                    <p>{{ $match['student_id'] ?: 'No student ID' }}</p>
                                    <p>{{ $match['course'] ?: 'Course not set' }}</p>
                                    <p>Similarity: {{ number_format((float) $match['similarity'], 2) }}%</p>
                                </article>
                            @endforeach
                        </div>
                    @endif
                </div>
            @endif
            
            @if (! empty($studentPhotos))
                <div style="margin-top: 35px; border-top: 1px solid #eee; padding-top: 25px;">
                    <h3 style="font-size: 1.1rem; color: var(--nu-blue);"><i class="fas fa-images" style="color: var(--nu-gold); margin-right: 10px;"></i> Gallery Occurrences</h3>
                    <p style="font-size: 0.9rem; margin-top: 5px;">Photos from the archive featuring the identified student(s).</p>
                    <div class="gallery-match-grid">
                        @foreach ($studentPhotos as $photo)
                            <div class="gallery-match-item">
                                <img src="{{ asset('storage/' . $photo->file_path) }}" alt="Matched Photo">
                                <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 10px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; font-size: 0.75rem;">
                                    <div style="font-weight: 700; margin-bottom: 2px;">{{ $photo->caption ?: 'Archive Photo' }}</div>
                                    @if(!empty($photo->matched_students))
                                        <div style="font-size: 0.65rem; color: var(--nu-gold); display: flex; align-items: center; gap: 4px;">
                                            <i class="fas fa-user-tag"></i>
                                            <span>
                                                {{ implode(', ', array_column($photo->matched_students, 'name')) }}
                                            </span>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </section>

    <main class="gallery-section">
        <div class="photo-grid">
            @forelse ($albums as $index => $album)
                <a href="{{ route('gallery.show', $album->id) }}" class="album-card animate-up">
                    <div class="img-container">
                        <div class="ai-scanner"></div>
                        <div class="photo-badge"><i class="fas fa-images"></i> {{ $album->photos_count }}</div>
                        <img src="{{ $album->cover_image ? asset('storage/'.$album->cover_image) : 'https://via.placeholder.com/800x600?text=Album' }}" alt="{{ $album->title }}">
                    </div>
                    <div class="album-details">
                        <h4>{{ $album->title }}</h4>
                        <div class="album-date"><i class="far fa-calendar-alt"></i> {{ \Illuminate\Support\Carbon::parse($album->event_date)->format('F j, Y') }}</div>
                    </div>
                </a>
            @empty
                <p>No albums are available yet.</p>
            @endforelse
        </div>
    </main>

    <footer>
        <div class="footer-logo">
            <h3>NU <span>Lipa</span></h3>
            <p>Built for Pioneers, by Pioneers. Sinag-Bughaw is the standard for modern academic archiving.</p>
        </div>
        <div class="f-col">
            <h4>Pioneer Hub</h4>
            <ul>
                <li>Student Directory</li>
                <li>Faculty & Staff</li>
                <li>Batch Gallery</li>
            </ul>
        </div>
        <div class="f-col">
            <h4>Legal</h4>
            <ul>
                <li>Privacy Policy</li>
                <li>Data Protection</li>
                <li>Terms of Use</li>
            </ul>
        </div>
        <div class="f-col">
            <h4>Campus</h4>
            <li style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin-bottom: 10px;">Km. 75 JP Laurel Highway, Lipa City</li>
            <li style="color: #94a3b8; font-size: 0.85rem;">admissions@nu-lipa.edu.ph</li>
        </div>
        <div class="footer-bottom">
            &copy; 2026 National University Lipa • Sinag-Bughaw Project.
        </div>
    </footer>

    <script>
        // PREVENT INSPECT & RIGHT CLICK
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.onkeydown = function(e) {
            if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67))) return false;
        };

        // SECURITY BLUR
        window.addEventListener('blur', () => document.getElementById('security-shield').style.display = 'flex');
        window.addEventListener('focus', () => document.getElementById('security-shield').style.display = 'none');
    </script>
</body>
</html>
