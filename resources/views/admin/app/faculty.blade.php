<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty | NU Lipa Yearbook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <style>
        :root { --bg:#e9edf4; --surface:#fff; --border:#d9e1ef; --text:#1f2a44; --muted:#71809d; --nav:#131d35; --primary:#4254c5; --shadow:0 18px 40px rgba(18,31,68,.08); --success:#15803d; --danger:#b91c1c; }
        * { box-sizing:border-box; font-family:'Inter',sans-serif; }
        body { margin:0; background:var(--bg); color:var(--text); }
        a { color:inherit; text-decoration:none; }
        .admin-shell { min-height:100vh; display:grid; grid-template-columns:256px minmax(0,1fr); }
        .sidebar { background:var(--nav); color:#dbe5ff; padding:26px 18px 18px; display:flex; flex-direction:column; min-height:100vh; }
        .brand { display:flex; align-items:center; gap:12px; padding:6px 10px 28px; color:#fff; font-weight:700; font-size:1.05rem; }
        .brand-mark { width:30px; height:30px; border-radius:10px; display:grid; place-items:center; background:linear-gradient(135deg,#4c63da,#2f47c5); }
        .menu { display:grid; gap:8px; }
        .menu-item { display:flex; align-items:center; gap:14px; padding:12px 14px; border-radius:12px; color:#c2cee7; font-weight:500; }
        .menu-item.active { background:var(--primary); color:#fff; box-shadow:0 10px 20px rgba(66,84,197,.24); }
        .sidebar-footer { margin-top:auto; padding:22px 10px 4px; border-top:1px solid rgba(219,229,255,.08); }
        .logout-link { display:inline-flex; align-items:center; gap:10px; color:#ff6b75; background:transparent; border:0; padding:8px 0; font-size:1rem; cursor:pointer; }
        .version { margin:18px 0 0 34px; color:#667594; font-size:.74rem; }
        .topbar { background:var(--surface); border-bottom:1px solid var(--border); padding:16px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .topbar-right { display:flex; align-items:center; gap:18px; }
        .top-icon { width:38px; height:38px; border-radius:50%; border:1px solid var(--border); display:grid; place-items:center; background:#fff; color:#6b7a97; }
        .user-chip { display:flex; align-items:center; gap:12px; padding-left:14px; border-left:1px solid var(--border); }
        .user-meta { text-align:right; }
        .user-name { font-size:.98rem; font-weight:700; }
        .user-role { font-size:.78rem; color:#7d8ca8; text-transform:uppercase; letter-spacing:.06em; }
        .avatar { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; background:#edf2ff; color:var(--primary); border:1px solid #d2dcfb; }
        .dashboard-body { padding:28px 22px 26px; }
        .page-header h1 { margin:0; font-size:clamp(2rem,3vw,2.5rem); }
        .page-header p { margin:6px 0 0; color:var(--muted); }
        .flash { margin-top:20px; padding:14px 16px; border-radius:14px; font-weight:600; background:#ecfdf3; border:1px solid #b7efcd; color:var(--success); }
        .grid { display:grid; grid-template-columns:360px minmax(0,1fr); gap:20px; margin-top:24px; align-items:start; }
        .card { background:var(--surface); border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); overflow:hidden; }
        .card-head { padding:18px 18px 14px; border-bottom:1px solid #e5ebf5; }
        .card-head h2 { margin:0; font-size:1.05rem; }
        .card-head p { margin:8px 0 0; color:#7790b2; font-size:.92rem; }
        .card-body { padding:18px; }
        .field { margin-bottom:16px; }
        .field label { display:block; font-size:.82rem; font-weight:700; color:#55637f; margin-bottom:8px; text-transform:uppercase; letter-spacing:.04em; }
        .field input, .field textarea { width:100%; border:1px solid #cfdaec; border-radius:12px; padding:12px 14px; font-size:.95rem; }
        .field textarea { min-height:110px; resize:vertical; }
        .btn-row { display:flex; gap:10px; flex-wrap:wrap; }
        .btn { border:1px solid #cfdaec; border-radius:12px; padding:11px 16px; font-weight:700; cursor:pointer; background:#fff; color:#4f5e7b; }
        .btn-primary { background:var(--primary); color:#fff; border-color:var(--primary); }
        .btn-danger { background:#fff5f5; border-color:#fecaca; color:var(--danger); }
        .toolbar { padding:16px 18px; display:flex; justify-content:space-between; gap:12px; border-bottom:1px solid #e5ebf5; }
        .toolbar input { width:100%; max-width:320px; border:1px solid #cfdaec; border-radius:12px; padding:11px 14px; }
        .list { display:grid; gap:16px; padding:18px; }
        .faculty-card { border:1px solid #e5ebf5; border-radius:16px; padding:16px; }
        .faculty-head { display:flex; gap:14px; align-items:flex-start; margin-bottom:14px; }
        .faculty-photo { width:68px; height:68px; border-radius:16px; background:#eef2ff; object-fit:cover; }
        .faculty-name { font-size:1rem; font-weight:800; margin:0 0 4px; }
        .faculty-meta { color:#64748b; margin:0 0 3px; font-size:.92rem; }
        .faculty-bio { color:#60708f; font-size:.9rem; line-height:1.55; margin:0 0 14px; }
        .empty { padding:36px 18px; text-align:center; color:#7d8ba6; }
        .pagination { display:flex; justify-content:space-between; gap:12px; padding:16px 18px; border-top:1px solid #e5ebf5; color:#6f7f9c; font-size:.9rem; }
        .pager-link { min-width:42px; border:1px solid #d8e0ee; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; padding:8px 12px; background:#fff; color:#71809d; }
        .error-box { margin-bottom:16px; background:#fff1f2; border:1px solid #fecdd3; color:#be123c; border-radius:14px; padding:14px 16px; font-weight:600; }
        @media (max-width:980px) { .admin-shell { grid-template-columns:1fr; } .sidebar { min-height:auto; } .topbar { flex-direction:column; align-items:flex-start; } .grid { grid-template-columns:1fr; } }
    </style>
</head>
<body>
    <div class="admin-shell">
        <aside class="sidebar">
            <div class="brand"><div class="brand-mark"><i class="fas fa-graduation-cap"></i></div><span>NU Admin Portal</span></div>
            <nav class="menu">
                <a href="{{ route('admin.dashboard') }}" class="menu-item"><i class="fas fa-table-cells-large"></i><span>Dashboard</span></a>
                <a href="{{ route('admin.students') }}" class="menu-item"><i class="fas fa-user-graduate"></i><span>Student Profiles</span></a>
                <a href="{{ route('admin.faculty') }}" class="menu-item active"><i class="fas fa-user-tie"></i><span>Faculty</span></a>
                <a href="{{ route('admin.content') }}" class="menu-item"><i class="fas fa-images"></i><span>Content & Gallery</span></a>
                <a href="{{ route('admin.audit-logs') }}" class="menu-item"><i class="fas fa-shield-halved"></i><span>Audit Logs</span></a>
                <a href="{{ route('admin.settings') }}" class="menu-item"><i class="fas fa-gear"></i><span>System Settings</span></a>
            </nav>
            <div class="sidebar-footer">
                <form action="{{ route('admin.logout') }}" method="POST">@csrf<button type="submit" class="logout-link"><i class="fas fa-arrow-right-from-bracket"></i><span>Sign Out</span></button></form>
                <div class="version">v2.4.0 • Secure Connection</div>
            </div>
        </aside>
        <main>
            <div class="topbar">
                <div>{{ $dashboardDate }}</div>
                <div class="topbar-right">
                    <div class="top-icon"><i class="far fa-bell"></i></div>
                    <div class="user-chip"><div class="user-meta"><div class="user-name">{{ $adminUsername }}</div><div class="user-role">{{ $adminRole }}</div></div><div class="avatar"><i class="fas fa-user"></i></div></div>
                </div>
            </div>
            <div class="dashboard-body">
                <div class="page-header">
                    <h1>Faculty</h1>
                    <p>Create, update, and remove faculty records from the archive.</p>
                </div>

                @if (session('success'))
                    <div class="flash">{{ session('success') }}</div>
                @endif

                <div class="grid">
                    <section class="card">
                        <div class="card-head">
                            <h2>Add Faculty Member</h2>
                            <p>New faculty entries will appear on both the public and admin portals.</p>
                        </div>
                        <div class="card-body">
                            @if ($errors->any())
                                <div class="error-box">{{ $errors->first() }}</div>
                            @endif
                            <form action="{{ route('admin.faculty.store') }}" method="POST" enctype="multipart/form-data">
                                @csrf
                                <div class="field"><label>Name</label><input type="text" name="name" value="{{ old('name') }}" required></div>
                                <div class="field"><label>Title</label><input type="text" name="title" value="{{ old('title') }}" required></div>
                                <div class="field"><label>Department</label><input type="text" name="department" value="{{ old('department') }}" required></div>
                                <div class="field"><label>Short Bio</label><textarea name="bio">{{ old('bio') }}</textarea></div>
                                <div class="field"><label>Photo</label><input type="file" name="image" accept="image/*"></div>
                                <div class="btn-row"><button type="submit" class="btn btn-primary">Save Faculty</button></div>
                            </form>
                        </div>
                    </section>

                    <section class="card">
                        <div class="toolbar">
                            <form method="GET" action="{{ route('admin.faculty') }}" style="width:100%;">
                                <input type="text" name="search" value="{{ $search }}" placeholder="Search faculty by name, title, or department">
                            </form>
                        </div>
                        <div class="list">
                            @forelse ($faculties as $faculty)
                                <article class="faculty-card">
                                    <div class="faculty-head">
                                        <img class="faculty-photo" src="{{ $faculty->image ? asset('storage/'.$faculty->image) : 'https://via.placeholder.com/120x120?text=NU' }}" alt="{{ $faculty->name }}">
                                        <div>
                                            <p class="faculty-name">{{ $faculty->name }}</p>
                                            <p class="faculty-meta">{{ $faculty->title }}</p>
                                            <p class="faculty-meta">{{ $faculty->department }}</p>
                                        </div>
                                    </div>
                                    @if ($faculty->bio)
                                        <p class="faculty-bio">{{ $faculty->bio }}</p>
                                    @endif
                                    <form action="{{ route('admin.faculty.update', $faculty) }}" method="POST" enctype="multipart/form-data">
                                        @csrf
                                        @method('PUT')
                                        <div class="field"><label>Name</label><input type="text" name="name" value="{{ $faculty->name }}" required></div>
                                        <div class="field"><label>Title</label><input type="text" name="title" value="{{ $faculty->title }}" required></div>
                                        <div class="field"><label>Department</label><input type="text" name="department" value="{{ $faculty->department }}" required></div>
                                        <div class="field"><label>Short Bio</label><textarea name="bio">{{ $faculty->bio }}</textarea></div>
                                        <div class="field"><label>Replace Photo</label><input type="file" name="image" accept="image/*"></div>
                                        <div class="btn-row">
                                            <button type="submit" class="btn btn-primary">Update</button>
                                        </div>
                                    </form>
                                    <form action="{{ route('admin.faculty.destroy', $faculty) }}" method="POST" style="margin-top:10px;">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-danger" onclick="return confirm('Delete this faculty record?')">Delete</button>
                                    </form>
                                </article>
                            @empty
                                <div class="empty">No faculty records found yet.</div>
                            @endforelse
                        </div>
                        <div class="pagination">
                            <div>
                                @if ($faculties->total() > 0)
                                    Showing {{ $faculties->firstItem() }} to {{ $faculties->lastItem() }} of {{ $faculties->total() }}
                                @else
                                    Showing 0 records
                                @endif
                            </div>
                            <div style="display:flex; gap:8px;">
                                <a href="{{ $faculties->previousPageUrl() ?: '#' }}" class="pager-link {{ $faculties->onFirstPage() ? 'disabled' : '' }}">Prev</a>
                                <a href="{{ $faculties->nextPageUrl() ?: '#' }}" class="pager-link {{ $faculties->hasMorePages() ? '' : 'disabled' }}">Next</a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
