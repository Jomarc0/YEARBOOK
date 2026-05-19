<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Settings | NU Lipa Yearbook</title>
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
        .dashboard-body { padding:28px 22px 26px; }
        .page-header h1 { margin:0; font-size:clamp(2rem,3vw,2.5rem); }
        .page-header p { margin:6px 0 0; color:var(--muted); }
        .card { max-width:840px; margin-top:24px; background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); overflow:hidden; }
        .card-head { padding:18px; border-bottom:1px solid #e5ebf5; }
        .card-head h2 { margin:0; font-size:1.05rem; }
        .card-body { padding:18px; }
        .field { margin-bottom:18px; }
        .field label { display:block; font-size:.82rem; font-weight:700; color:#55637f; margin-bottom:8px; text-transform:uppercase; letter-spacing:.04em; }
        .field input, .field textarea { width:100%; border:1px solid #cfdaec; border-radius:12px; padding:12px 14px; font-size:.95rem; }
        .field textarea { min-height:110px; resize:vertical; }
        .toggle { display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid #cfdaec; border-radius:12px; background:#f8fbff; }
        .btn { border:1px solid var(--primary); border-radius:12px; padding:11px 16px; font-weight:700; cursor:pointer; background:var(--primary); color:#fff; }
        .flash { margin-top:20px; background:#ecfdf3; border:1px solid #b7efcd; color:#15803d; border-radius:14px; padding:14px 16px; font-weight:600; max-width:840px; }
        @media (max-width:980px) { .admin-shell { grid-template-columns:1fr; } .sidebar { min-height:auto; } }
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
                <a href="{{ route('admin.content') }}" class="menu-item"><i class="fas fa-images"></i><span>Content & Gallery</span></a>
                <a href="{{ route('admin.audit-logs') }}" class="menu-item"><i class="fas fa-shield-halved"></i><span>Audit Logs</span></a>
                <a href="{{ route('admin.settings') }}" class="menu-item active"><i class="fas fa-gear"></i><span>System Settings</span></a>
            </nav>
            <div class="sidebar-footer"><form action="{{ route('admin.logout') }}" method="POST">@csrf<button type="submit" class="logout-link"><i class="fas fa-arrow-right-from-bracket"></i><span>Sign Out</span></button></form><div class="version">v2.4.0 • Secure Connection</div></div>
        </aside>
        <main>
            <div class="topbar"><div>{{ $dashboardDate }}</div><div style="font-weight:700;">{{ $adminUsername }}</div></div>
            <div class="dashboard-body">
                <div class="page-header"><h1>Settings</h1><p>Persist key system options directly in the database.</p></div>
                @if (session('success'))<div class="flash">{{ session('success') }}</div>@endif
                @if ($errors->any())<div class="flash" style="background:#fff1f2;border-color:#fecdd3;color:#be123c;">{{ $errors->first() }}</div>@endif
                <section class="card">
                    <div class="card-head"><h2>Archive Configuration</h2></div>
                    <div class="card-body">
                        <form action="{{ route('admin.settings.update') }}" method="POST">
                            @csrf
                            <div class="field"><label>Site Name</label><input type="text" name="site_name" value="{{ old('site_name', $settings['site_name']) }}" required></div>
                            <div class="field"><label>Support Email</label><input type="email" name="support_email" value="{{ old('support_email', $settings['support_email']) }}" required></div>
                            <div class="field"><label>Campus Address</label><textarea name="campus_address" required>{{ old('campus_address', $settings['campus_address']) }}</textarea></div>
                            <div class="field"><label>Gallery Items Per Page</label><input type="number" name="gallery_items_per_page" min="1" max="100" value="{{ old('gallery_items_per_page', $settings['gallery_items_per_page']) }}" required></div>
                            <div class="field">
                                <label>Registration</label>
                                <label class="toggle">
                                    <input type="checkbox" name="allow_registration" value="1" {{ old('allow_registration', $settings['allow_registration']) ? 'checked' : '' }}>
                                    <span>Allow new student self-registration</span>
                                </label>
                            </div>
                            <button type="submit" class="btn">Save Settings</button>
                        </form>
                    </div>
                </section>

                <section class="card">
                    <div class="card-head"><h2>🤖 AI & Face Recognition</h2></div>
                    <div class="card-body">
                        <form action="{{ route('admin.settings.update') }}" method="POST">
                            @csrf
                            <div class="field">
                                <label>Face Recognition Threshold (%)</label>
                                <input type="number" name="face_recognition_threshold" min="50" max="99" step="1" 
                                       value="{{ old('face_recognition_threshold', $settings['face_recognition_threshold'] ?? 90) }}" required>
                                <small style="color: #64748b; font-size: 0.8rem;">Minimum similarity score for face matches (50-99%). Higher values = stricter matching.</small>
                            </div>
                            <div class="field">
                                <label>Face Recognition</label>
                                <label class="toggle">
                                    <input type="checkbox" name="face_recognition_enabled" value="1" {{ old('face_recognition_enabled', $settings['face_recognition_enabled'] ?? true) ? 'checked' : '' }}>
                                    <span>Enable AI-powered face recognition features</span>
                                </label>
                            </div>
                            <div class="field">
                                <label>Auto Face Detection</label>
                                <label class="toggle">
                                    <input type="checkbox" name="auto_face_detection" value="1" {{ old('auto_face_detection', $settings['auto_face_detection'] ?? true) ? 'checked' : '' }}>
                                    <span>Automatically detect faces in uploaded photos</span>
                                </label>
                            </div>
                            <button type="submit" class="btn">Save AI Settings</button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    </div>
</body>
</html>
