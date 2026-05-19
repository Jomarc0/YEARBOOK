<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | NU Lipa Yearbook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <style>
        :root {
            --bg: #e9edf4;
            --surface: #ffffff;
            --surface-soft: #f3f6fb;
            --border: #d9e1ef;
            --text: #1f2a44;
            --muted: #71809d;
            --nav: #131d35;
            --primary: #4254c5;
            --primary-soft: #eef1ff;
            --green: #22c55e;
            --green-soft: #e9f9ef;
            --violet: #a855f7;
            --violet-soft: #f4ebff;
            --amber: #f4b000;
            --amber-soft: #fff5d9;
            --red: #ff3647;
            --red-soft: #ffe8eb;
            --shadow: 0 18px 40px rgba(18, 31, 68, 0.08);
        }

        * {
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
        }

        body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        .admin-shell {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 256px minmax(0, 1fr);
        }

        .sidebar {
            background: var(--nav);
            color: #dbe5ff;
            padding: 26px 18px 18px;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 6px 10px 28px;
            color: #fff;
            font-weight: 700;
            font-size: 1.05rem;
        }

        .brand-mark {
            width: 30px;
            height: 30px;
            border-radius: 10px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #4c63da, #2f47c5);
            color: #fff;
            flex-shrink: 0;
        }

        .menu {
            display: grid;
            gap: 8px;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 14px;
            border-radius: 12px;
            color: #c2cee7;
            font-weight: 500;
        }

        .menu-item i {
            width: 16px;
            text-align: center;
        }

        .menu-item.active {
            background: var(--primary);
            color: #fff;
            box-shadow: 0 10px 20px rgba(66, 84, 197, 0.24);
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 22px 10px 4px;
            border-top: 1px solid rgba(219, 229, 255, 0.08);
        }

        .logout-link {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: #ff6b75;
            background: transparent;
            border: 0;
            padding: 8px 0;
            font-size: 1rem;
            cursor: pointer;
        }

        .version {
            margin: 18px 0 0 34px;
            color: #667594;
            font-size: 0.74rem;
        }

        .content {
            padding: 0;
        }

        .topbar {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 16px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .topbar-date {
            font-size: 0.95rem;
            font-weight: 700;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 18px;
        }

        .top-icon {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid var(--border);
            display: grid;
            place-items: center;
            background: #fff;
            color: #6b7a97;
            position: relative;
        }

        .top-icon .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--red);
            position: absolute;
            top: 10px;
            right: 10px;
            border: 2px solid #fff;
        }

        .user-chip {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-left: 14px;
            border-left: 1px solid var(--border);
        }

        .user-meta {
            text-align: right;
        }

        .user-name {
            font-size: 0.98rem;
            font-weight: 700;
            color: var(--text);
        }

        .user-role {
            font-size: 0.78rem;
            color: #7d8ca8;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #edf2ff;
            color: var(--primary);
            border: 1px solid #d2dcfb;
        }

        .dashboard-body {
            padding: 28px 22px 26px;
        }

        .page-header h1 {
            margin: 0;
            font-size: clamp(2rem, 3vw, 2.5rem);
            line-height: 1.1;
        }

        .page-header p {
            margin: 6px 0 0;
            color: var(--muted);
        }

        .metrics {
            margin-top: 26px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 20px;
        }

        .metric-card,
        .panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: var(--shadow);
        }

        .metric-card {
            padding: 22px 24px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
        }

        .metric-label {
            color: var(--muted);
            font-size: 0.98rem;
            margin-bottom: 10px;
        }

        .metric-value {
            font-size: 2rem;
            line-height: 1;
            font-weight: 800;
            margin-bottom: 12px;
        }

        .metric-trend {
            display: inline-flex;
            align-items: center;
            min-height: 24px;
            padding: 5px 9px;
            border-radius: 8px;
            font-size: 0.8rem;
        }

        .trend-positive {
            color: #16a34a;
            background: var(--green-soft);
        }

        .trend-neutral {
            color: #8b5cf6;
            background: var(--violet-soft);
        }

        .trend-caution {
            color: #d97706;
            background: var(--amber-soft);
        }

        .trend-alert {
            color: #dc2626;
            background: var(--red-soft);
        }

        .metric-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 1.1rem;
            flex-shrink: 0;
        }

        .bg-blue { background: #3b82f6; }
        .bg-violet { background: #a855f7; }
        .bg-amber { background: #f4b000; }
        .bg-red { background: #ff3647; }

        .panels {
            margin-top: 24px;
            display: grid;
            grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
            gap: 22px;
        }

        .panel {
            padding: 22px 24px;
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 22px;
        }

        .panel-title {
            font-size: 1.05rem;
            font-weight: 800;
        }

        .panel-action {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #5b6784;
            font-size: 0.88rem;
            font-weight: 600;
        }

        .chart-area {
            padding: 8px 6px 0;
        }

        .chart-grid {
            position: relative;
            height: 320px;
            display: grid;
            grid-template-columns: 56px minmax(0, 1fr);
            gap: 16px;
        }

        .chart-y {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #70809e;
            font-size: 0.88rem;
            padding: 4px 0 26px;
        }

        .chart-plot {
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            gap: 16px;
            padding: 0 12px 34px;
            border-bottom: 1px dashed #dce4f2;
            background-image:
                linear-gradient(to top, transparent 19%, #e6ecf7 20%, transparent 20.5%),
                linear-gradient(to top, transparent 39%, #e6ecf7 40%, transparent 40.5%),
                linear-gradient(to top, transparent 59%, #e6ecf7 60%, transparent 60.5%),
                linear-gradient(to top, transparent 79%, #e6ecf7 80%, transparent 80.5%);
            background-size: 100% 100%;
            background-repeat: no-repeat;
        }

        .bar-group {
            width: min(72px, 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            height: 100%;
        }

        .bar {
            width: 40px;
            border-radius: 6px 6px 0 0;
            background: linear-gradient(180deg, #4d61d1 0%, #3f51b5 100%);
            min-height: 12px;
            box-shadow: inset 0 -6px 12px rgba(17, 24, 39, 0.08);
        }

        .bar-label {
            color: #70809e;
            font-size: 0.88rem;
        }

        .activity-list {
            display: grid;
            gap: 18px;
        }

        .activity-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .activity-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-top: 8px;
            flex-shrink: 0;
        }

        .activity-dot.green { background: #22c55e; }
        .activity-dot.blue { background: #3b82f6; }
        .activity-dot.orange { background: #f59e0b; }
        .activity-dot.red { background: #ef4444; }

        .activity-title {
            font-size: 0.98rem;
            font-weight: 600;
            margin-bottom: 6px;
        }

        .activity-meta {
            color: #7a89a6;
            font-size: 0.86rem;
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
        }

        .activity-meta span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .panel-link {
            margin-top: 22px;
            display: inline-flex;
            justify-content: center;
            width: 100%;
            color: #49597b;
            font-size: 0.92rem;
            font-weight: 700;
        }

        @media (max-width: 1180px) {
            .metrics {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .panels {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 860px) {
            .admin-shell {
                grid-template-columns: 1fr;
            }

            .sidebar {
                min-height: auto;
            }

            .topbar {
                flex-direction: column;
                align-items: flex-start;
            }

            .topbar-right {
                width: 100%;
                justify-content: space-between;
            }
        }

        @media (max-width: 640px) {
            .dashboard-body,
            .topbar {
                padding-left: 16px;
                padding-right: 16px;
            }

            .metrics {
                grid-template-columns: 1fr;
            }

            .metric-card,
            .panel {
                border-radius: 18px;
            }

            .chart-grid {
                grid-template-columns: 42px minmax(0, 1fr);
                gap: 10px;
            }

            .chart-plot {
                gap: 10px;
                padding-left: 0;
                padding-right: 0;
            }

            .bar {
                width: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="admin-shell">
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-mark">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <span>NU Admin Portal</span>
            </div>

            <nav class="menu">
                <a href="{{ route('admin.dashboard') }}" class="menu-item active">
                    <i class="fas fa-table-cells-large"></i>
                    <span>Dashboard</span>
                </a>
                <a href="{{ route('admin.students') }}" class="menu-item">
                    <i class="fas fa-user-graduate"></i>
                    <span>Student Profiles</span>
                </a>
                <a href="{{ route('admin.faculty') }}" class="menu-item">
                    <i class="fas fa-user-tie"></i>
                    <span>Faculty</span>
                </a>
                <a href="{{ route('admin.content') }}" class="menu-item">
                    <i class="fas fa-images"></i>
                    <span>Content & Gallery</span>
                </a>
                <a href="{{ route('admin.audit-logs') }}" class="menu-item">
                    <i class="fas fa-shield-halved"></i>
                    <span>Audit Logs</span>
                </a>
                <a href="{{ route('admin.settings') }}" class="menu-item">
                    <i class="fas fa-gear"></i>
                    <span>System Settings</span>
                </a>
            </nav>

            <div class="sidebar-footer">
                <form action="{{ route('admin.logout') }}" method="POST">
                    @csrf
                    <button type="submit" class="logout-link">
                        <i class="fas fa-arrow-right-from-bracket"></i>
                        <span>Sign Out</span>
                    </button>
                </form>
                <div class="version">v2.4.0 • Secure Connection</div>
            </div>
        </aside>

        <main class="content">
            <div class="topbar">
                <div class="topbar-date">{{ $dashboardDate }}</div>

                <div class="topbar-right">
                    <div class="top-icon" aria-hidden="true">
                        <i class="far fa-bell"></i>
                        <span class="dot"></span>
                    </div>
                    <div class="top-icon" aria-hidden="true">
                        <i class="far fa-circle-question"></i>
                    </div>

                    <div class="user-chip">
                        <div class="user-meta">
                            <div class="user-name">{{ $adminUsername }}</div>
                            <div class="user-role">{{ $adminRole }}</div>
                        </div>
                        <div class="avatar">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-body">
                <div class="page-header">
                    <h1>Dashboard</h1>
                    <p>Manage your yearbook system data efficiently.</p>
                </div>

                <section class="metrics">
                    <article class="metric-card">
                        <div>
                            <div class="metric-label">Total Students</div>
                            <div class="metric-value">{{ number_format($totalStudents) }}</div>
                            <div class="metric-trend trend-positive">Live from user records</div>
                        </div>
                        <div class="metric-icon bg-blue">
                            <i class="fas fa-user-group"></i>
                        </div>
                    </article>

                    <article class="metric-card">
                        <div>
                            <div class="metric-label">Faculty Members</div>
                            <div class="metric-value">{{ number_format($totalFaculty) }}</div>
                            <div class="metric-trend trend-positive">{{ number_format($totalSections) }} active sections</div>
                        </div>
                        <div class="metric-icon bg-violet">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                    </article>

                    <article class="metric-card">
                        <div>
                            <div class="metric-label">Gallery Photos</div>
                            <div class="metric-value">{{ number_format($totalPhotos) }}</div>
                            <div class="metric-trend trend-caution">{{ number_format($totalAlbums) }} albums tracked</div>
                        </div>
                        <div class="metric-icon bg-amber">
                            <i class="fas fa-image"></i>
                        </div>
                    </article>

                    <article class="metric-card">
                        <div>
                            <div class="metric-label">System Alerts</div>
                            <div class="metric-value">{{ $recentActivity->count() }}</div>
                            <div class="metric-trend trend-alert">Recent changes to review</div>
                        </div>
                        <div class="metric-icon bg-red">
                            <i class="fas fa-triangle-exclamation"></i>
                        </div>
                    </article>
                </section>

                <section class="panels">
                    <article class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Enrollment Analytics</div>
                            <div class="panel-action">
                                <i class="fas fa-download"></i>
                                <span>Report</span>
                            </div>
                        </div>

                        <div class="chart-area">
                            <div class="chart-grid">
                                <div class="chart-y">
                                    @foreach ([100, 75, 50, 25, 0] as $percent)
                                        <span>{{ number_format((int) round($maxEnrollment * ($percent / 100))) }}</span>
                                    @endforeach
                                </div>

                                <div class="chart-plot">
                                    @foreach ($enrollmentByYear as $yearData)
                                        @php
                                            $height = max(8, (int) round(($yearData->total / $maxEnrollment) * 100));
                                        @endphp
                                        <div class="bar-group">
                                            <div class="bar" style="height: {{ $height }}%;"></div>
                                            <div class="bar-label">{{ $yearData->year }}</div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </article>

                    <aside class="panel">
                        <div class="panel-header">
                            <div class="panel-title">Recent Audit Activity</div>
                        </div>

                        <div class="activity-list">
                            @forelse ($recentActivity as $activity)
                                <div class="activity-item">
                                    <div class="activity-dot {{ $activity['color'] }}"></div>
                                    <div>
                                        <div class="activity-title">{{ $activity['title'] }}</div>
                                        <div class="activity-meta">
                                            <span><i class="fas {{ $activity['icon'] }}"></i>{{ $activity['subject'] }}</span>
                                            <span><i class="far fa-clock"></i>{{ $activity['time'] }}</span>
                                        </div>
                                    </div>
                                </div>
                            @empty
                                <div class="activity-item">
                                    <div class="activity-dot blue"></div>
                                    <div>
                                        <div class="activity-title">No recent activity yet</div>
                                        <div class="activity-meta">
                                            <span><i class="fas fa-database"></i>Records will appear here as data changes.</span>
                                        </div>
                                    </div>
                                </div>
                            @endforelse
                        </div>

                        <a href="{{ route('admin.dashboard') }}" class="panel-link">View Full Log</a>
                    </aside>
                </section>
            </div>
        </main>
    </div>
</body>
</html>
