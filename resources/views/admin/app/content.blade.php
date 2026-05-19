<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content & Gallery | NU Lipa Yearbook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <style>
        :root { --bg:#e9edf4; --surface:#fff; --border:#d9e1ef; --text:#1f2a44; --muted:#71809d; --nav:#131d35; --primary:#4254c5; --shadow:0 18px 40px rgba(18,31,68,.08); }
        * { box-sizing:border-box; font-family:'Inter',sans-serif; }
        body { margin:0; background:var(--bg); color:var(--text); }
        a { color:inherit; text-decoration:none; }
        .admin-shell { min-height:100vh; display:grid; grid-template-columns:256px minmax(0,1fr); }
        .sidebar { background:var(--nav); color:#dbe5ff; padding:26px 18px 18px; display:flex; flex-direction:column; min-height:100vh; }
        .brand,.menu-item,.logout-link { display:flex; align-items:center; gap:12px; }
        .brand { padding:6px 10px 28px; color:#fff; font-weight:700; font-size:1.05rem; }
        .brand-mark { width:30px; height:30px; border-radius:10px; display:grid; place-items:center; background:linear-gradient(135deg,#4c63da,#2f47c5); }
        .menu { display:grid; gap:8px; }
        .menu-item { padding:12px 14px; border-radius:12px; color:#c2cee7; font-weight:500; }
        .menu-item.active { background:var(--primary); color:#fff; box-shadow:0 10px 20px rgba(66,84,197,.24); }
        .sidebar-footer { margin-top:auto; padding:22px 10px 4px; border-top:1px solid rgba(219,229,255,.08); }
        .logout-link { color:#ff6b75; background:transparent; border:0; padding:8px 0; font-size:1rem; cursor:pointer; }
        .version { margin:18px 0 0 34px; color:#667594; font-size:.74rem; }
        .topbar { background:#fff; border-bottom:1px solid var(--border); padding:16px 22px; display:flex; justify-content:space-between; align-items:center; }
        .user-chip { display:flex; align-items:center; gap:12px; }
        .avatar { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; background:#edf2ff; color:var(--primary); border:1px solid #d2dcfb; }
        .dashboard-body { padding:28px 22px 26px; }
        .page-header h1 { margin:0; font-size:clamp(2rem,3vw,2.5rem); }
        .page-header p { margin:6px 0 0; color:var(--muted); }
        .flash { margin-top:20px; background:#ecfdf3; border:1px solid #b7efcd; color:#15803d; border-radius:14px; padding:14px 16px; font-weight:600; }
        .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; margin-top:24px; align-items:start; }
        .card { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); overflow:hidden; }
        .card-head { padding:18px; border-bottom:1px solid #e5ebf5; }
        .card-head h2 { margin:0; font-size:1.05rem; }
        .card-head p { margin:8px 0 0; color:#7790b2; font-size:.92rem; }
        .card-body { padding:18px; }
        .field { margin-bottom:16px; }
        .field label { display:block; font-size:.82rem; font-weight:700; color:#55637f; margin-bottom:8px; text-transform:uppercase; letter-spacing:.04em; }
        .field input, .field textarea, .field select { width:100%; border:1px solid #cfdaec; border-radius:12px; padding:12px 14px; font-size:.95rem; }
        .field textarea { min-height:110px; resize:vertical; }
        .btn { border:1px solid #cfdaec; border-radius:12px; padding:11px 16px; font-weight:700; cursor:pointer; background:#fff; color:#4f5e7b; }
        .btn-primary { background:var(--primary); color:#fff; border-color:var(--primary); }
        .btn-danger { background:#fff5f5; border-color:#fecaca; color:#b91c1c; }
        .stack { display:grid; gap:14px; }
        .item { border:1px solid #e5ebf5; border-radius:16px; padding:16px; }
        .thumb { width:100%; height:180px; object-fit:cover; border-radius:14px; background:#eef2ff; margin-bottom:12px; }
        .meta { color:#64748b; font-size:.92rem; margin:0 0 6px; }
        .title { margin:0 0 6px; font-size:1rem; font-weight:800; }
        .small { color:#7c8aa6; font-size:.88rem; }
        .empty { padding:36px 18px; text-align:center; color:#7d8ba6; }
        @media (max-width:980px) { .admin-shell { grid-template-columns:1fr; } .sidebar { min-height:auto; } .grid { grid-template-columns:1fr; } }
    </style>
</head>
<body>
    <div class="admin-shell">
        <aside class="sidebar">
            <div class="brand"><div class="brand-mark"><i class="fas fa-graduation-cap"></i></div><span>NU Admin Portal</span></div>
            <nav class="menu">
                <a href="{{ route('admin.dashboard') }}" class="menu-item"><i class="fas fa-table-cells-large"></i><span>Dashboard</span></a>
                <a href="{{ route('admin.students') }}" class="menu-item"><i class="fas fa-user-graduate"></i><span>Student Profiles</span></a>
                <a href="{{ route('admin.faculty') }}" class="menu-item"><i class="fas fa-user-tie"></i><span>Faculty</span></a>
                <a href="{{ route('admin.content') }}" class="menu-item active"><i class="fas fa-images"></i><span>Content & Gallery</span></a>
                <a href="{{ route('admin.audit-logs') }}" class="menu-item"><i class="fas fa-shield-halved"></i><span>Audit Logs</span></a>
                <a href="{{ route('admin.settings') }}" class="menu-item"><i class="fas fa-gear"></i><span>System Settings</span></a>
            </nav>
            <div class="sidebar-footer"><form action="{{ route('admin.logout') }}" method="POST">@csrf<button type="submit" class="logout-link"><i class="fas fa-arrow-right-from-bracket"></i><span>Sign Out</span></button></form><div class="version">v2.4.0 • Secure Connection</div></div>
        </aside>
        <main>
            <div class="topbar"><div>{{ $dashboardDate }}</div><div class="user-chip"><div><div style="font-weight:700;">{{ $adminUsername }}</div><div style="font-size:.78rem;color:#7d8ca8;text-transform:uppercase;">{{ $adminRole }}</div></div><div class="avatar"><i class="fas fa-user"></i></div></div></div>
            <div class="dashboard-body">
                <div class="page-header"><h1>Content & Gallery</h1><p>Manage albums and uploaded gallery photos from one backend screen.</p></div>
                @if (session('success'))<div class="flash">{{ session('success') }}</div>@endif
                @if ($errors->any())<div class="flash" style="background:#fff1f2;border-color:#fecdd3;color:#be123c;">{{ $errors->first() }}</div>@endif

                <div class="grid">
                    <section class="card">
                        <div class="card-head"><h2>Create Album</h2><p>Albums drive the public gallery and mobile archive views.</p></div>
                        <div class="card-body">
                            <form action="{{ route('admin.content.albums.store') }}" method="POST" enctype="multipart/form-data">
                                @csrf
                                <div class="field"><label>Album Title</label><input type="text" name="title" value="{{ old('title') }}" required></div>
                                <div class="field"><label>Description</label><textarea name="description">{{ old('description') }}</textarea></div>
                                <div class="field"><label>Event Date</label><input type="date" name="event_date" value="{{ old('event_date') }}" required></div>
                                <div class="field"><label>Cover Image</label><input type="file" name="cover_image" accept="image/*"></div>
                                <button type="submit" class="btn btn-primary">Create Album</button>
                            </form>
                        </div>
                    </section>

                    <section class="card">
                        <div class="card-head"><h2>Upload Photo</h2><p>Add a photo directly into an existing album.</p></div>
                        <div class="card-body">
                            <div style="margin-bottom:16px; padding:12px 14px; border-radius:14px; background:{{ $faceRecognitionEnabled ? '#ecfdf3' : '#fff7ed' }}; color:{{ $faceRecognitionEnabled ? '#15803d' : '#c2410c' }}; font-size:.88rem; font-weight:600;">
                                {{ $faceRecognitionEnabled ? 'AWS Rekognition is enabled. Uploaded photos will be analyzed for faces automatically.' : 'AWS Rekognition is not configured. Photo uploads will skip face analysis.' }}
                            </div>
                            <form action="{{ route('admin.content.photos.store') }}" method="POST" enctype="multipart/form-data">
                                @csrf
                                <div class="field">
                                    <label>Album</label>
                                    <select name="album_id" required>
                                        <option value="">Select album</option>
                                        @foreach ($albumOptions as $albumOption)
                                            <option value="{{ $albumOption->id }}">{{ $albumOption->title }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="field"><label>Caption</label><input type="text" name="caption" value="{{ old('caption') }}"></div>
                                <div class="field"><label>Photo File</label><input type="file" name="photo" accept="image/*" required></div>
                                <button type="submit" class="btn btn-primary">Upload Photo</button>
                            </form>
                            <form action="{{ route('admin.content.faces.sync') }}" method="POST" style="margin-top:14px;">
                                @csrf
                                <button type="submit" class="btn" {{ $faceRecognitionEnabled ? '' : 'disabled' }}>Sync Student Face Collection</button>
                            </form>
                        </div>
                    </section>

                    <section class="card">
                        <div class="card-head"><h2>Albums</h2><p>{{ $albums->total() }} album records in the archive.</p></div>
                        <div class="card-body stack">
                            @forelse ($albums as $album)
                                <article class="item">
                                    <img class="thumb" src="{{ $album->cover_image ? asset('storage/'.$album->cover_image) : 'https://via.placeholder.com/640x360?text=Album' }}" alt="{{ $album->title }}">
                                    <p class="title">{{ $album->title }}</p>
                                    <p class="meta">{{ \Illuminate\Support\Carbon::parse($album->event_date)->format('F j, Y') }} • {{ $album->photos_count }} photos</p>
                                    @if ($album->description)<p class="small">{{ $album->description }}</p>@endif
                                    <form action="{{ route('admin.content.albums.destroy', $album) }}" method="POST" style="margin-top:12px;">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-danger" onclick="return confirm('Delete this album and its photos?')">Delete Album</button>
                                    </form>
                                </article>
                            @empty
                                <div class="empty">No albums created yet.</div>
                            @endforelse
                        </div>
                    </section>

                    <section class="card">
                        <div class="card-head"><h2>Recent Photos</h2><p>Latest uploads currently stored in the system.</p></div>
                        <div class="card-body stack">
                            @forelse ($photos as $photo)
                                <article class="item">
                                    <img class="thumb" src="{{ asset('storage/'.$photo->file_path) }}" alt="{{ $photo->caption ?: 'Photo' }}">
                                    <p class="title">{{ $photo->caption ?: 'Untitled photo' }}</p>
                                    <p class="meta">{{ $photo->album?->title ?: 'Unknown album' }}</p>
                                    <p class="small">
                                        Faces detected: {{ (int) data_get($photo->ai_metadata, 'face_count', 0) }}
                                        @if (data_get($photo->ai_metadata, 'matches.0.name'))
                                            • Top match: {{ data_get($photo->ai_metadata, 'matches.0.name') }}
                                        @endif
                                    </p>
                                    <p class="small">{{ $photo->created_at?->diffForHumans() }}</p>
                                    <form action="{{ route('admin.content.photos.destroy', $photo) }}" method="POST" style="margin-top:12px;">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-danger" onclick="return confirm('Delete this photo?')">Delete Photo</button>
                                    </form>
                                </article>
                            @empty
                                <div class="empty">No photos uploaded yet.</div>
                            @endforelse
                        </div>
                    </section>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
