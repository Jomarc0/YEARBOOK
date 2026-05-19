<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Logs | NU Lipa Yearbook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --bg:#e9edf4; --surface:#fff; --border:#d9e1ef; --text:#1f2a44; --muted:#71809d; --nav:#131d35; --primary:#4254c5; --shadow:0 18px 40px rgba(18,31,68,.08); --success:#16a34a; --warning:#d97706; --critical:#dc2626; }
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
        .table-card { margin-top:24px; background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:var(--shadow); overflow:hidden; }
        .table-wrap { overflow-x:auto; }
        table { width:100%; border-collapse:collapse; min-width:920px; }
        th, td { padding:14px 18px; border-bottom:1px solid #eef2f8; text-align:left; }
        th { color:#6d7b96; font-size:.84rem; letter-spacing:.04em; text-transform:uppercase; background:#fbfcff; }
        .badge { display:inline-flex; padding:5px 10px; border-radius:999px; font-size:.78rem; font-weight:800; text-transform:uppercase; }
        .success { color:var(--success); background:#dcfce7; }
        .warning { color:var(--warning); background:#fef3c7; }
        .critical { color:var(--critical); background:#fee2e2; }
        .pager { display:flex; justify-content:space-between; gap:12px; padding:16px 18px; color:#6f7f9c; font-size:.9rem; }
        .pager-link { min-width:42px; border:1px solid #d8e0ee; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; padding:8px 12px; background:#fff; color:#71809d; }
        @media (max-width:980px) { .admin-shell { grid-template-columns:1fr; } .sidebar { min-height:auto; } }
    </style>
</head>
<body>
    <div class="admin-shell">
        <aside class="sidebar">
            <div class="brand"><div class="brand-mark">N</div><span>NU Admin Portal</span></div>
            <nav class="menu">
                <a href="{{ route('admin.dashboard') }}" class="menu-item">Dashboard</a>
                <a href="{{ route('admin.students') }}" class="menu-item">Student Profiles</a>
                <a href="{{ route('admin.faculty') }}" class="menu-item">Faculty</a>
                <a href="{{ route('admin.content') }}" class="menu-item">Content & Gallery</a>
                <a href="{{ route('admin.audit-logs') }}" class="menu-item active">Audit Logs</a>
                <a href="{{ route('admin.settings') }}" class="menu-item">System Settings</a>
            </nav>
            <div class="sidebar-footer"><form action="{{ route('admin.logout') }}" method="POST">@csrf<button type="submit" class="logout-link">Sign Out</button></form><div class="version">v2.4.0 • Secure Connection</div></div>
        </aside>
        <main>
            <div class="topbar"><div>{{ $dashboardDate }}</div><div style="font-weight:700;">{{ $adminUsername }}</div></div>
            <div class="dashboard-body">
                <div class="page-header"><h1>Audit Logs</h1><p>Real activity records from admin and user actions now stored in the database.</p></div>
                <section class="table-card">
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($logs as $log)
                                    <tr>
                                        <td>{{ optional($log->logged_at)->format('M d, Y h:i A') ?: '-' }}</td>
                                        <td>{{ $log->user_name }}</td>
                                        <td>{{ $log->action }}</td>
                                        <td>{{ $log->details }}</td>
                                        <td>{{ $log->ip_address }}</td>
                                        <td><span class="badge {{ strtolower($log->status) }}">{{ $log->status }}</span></td>
                                    </tr>
                                @empty
                                    <tr><td colspan="6">No audit logs recorded yet.</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                    <div class="pager">
                        <div>
                            @if ($logs->total() > 0)
                                Showing {{ $logs->firstItem() }} to {{ $logs->lastItem() }} of {{ $logs->total() }}
                            @else
                                Showing 0 entries
                            @endif
                        </div>
                        <div style="display:flex; gap:8px;">
                            <a href="{{ $logs->previousPageUrl() ?: '#' }}" class="pager-link">Prev</a>
                            <a href="{{ $logs->nextPageUrl() ?: '#' }}" class="pager-link">Next</a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
</body>
</html>
