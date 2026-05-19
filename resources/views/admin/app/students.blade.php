<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Profiles | NU Lipa Yearbook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <style>
        :root {
            --bg: #e9edf4;
            --surface: #ffffff;
            --border: #d9e1ef;
            --text: #1f2a44;
            --muted: #71809d;
            --nav: #131d35;
            --primary: #4254c5;
            --primary-soft: #eef1ff;
            --green: #16a34a;
            --green-soft: #dcfce7;
            --amber: #d97706;
            --amber-soft: #fef3c7;
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
            background: #ff3647;
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

        .table-card {
            margin-top: 24px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
            box-shadow: var(--shadow);
            overflow: hidden;
        }

        .flash-success {
            margin-top: 20px;
            background: #ecfdf3;
            border: 1px solid #b7efcd;
            color: #15803d;
            border-radius: 14px;
            padding: 14px 16px;
            font-weight: 600;
        }

        .table-toolbar {
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            border-bottom: 1px solid #e5ebf5;
        }

        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .toolbar-form {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            flex-wrap: wrap;
        }

        .search-box,
        .filter-select {
            height: 44px;
            border: 1px solid #cfdaec;
            border-radius: 12px;
            background: #fff;
            color: var(--text);
            font-size: 0.95rem;
        }

        .search-box {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 14px;
            min-width: 280px;
            flex: 1;
        }

        .search-box input {
            border: 0;
            outline: none;
            width: 100%;
            font-size: 0.95rem;
            color: var(--text);
        }

        .filter-select {
            padding: 0 14px;
            min-width: 160px;
        }

        .toolbar-right {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .btn {
            height: 44px;
            border-radius: 12px;
            border: 1px solid #cfdaec;
            background: #fff;
            color: #4f5e7b;
            padding: 0 16px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
        }

        .btn-primary {
            background: var(--primary);
            color: #fff;
            border-color: var(--primary);
            box-shadow: 0 10px 18px rgba(66, 84, 197, 0.22);
        }

        .table-wrap {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px;
        }

        thead th {
            text-align: left;
            padding: 14px 24px;
            color: #6d7b96;
            font-size: 0.86rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            border-bottom: 1px solid #dfe7f2;
            background: #fbfcff;
        }

        tbody td {
            padding: 16px 24px;
            border-bottom: 1px solid #eef2f8;
            vertical-align: middle;
        }

        tbody tr:last-child td {
            border-bottom: 0;
        }

        .student-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .avatar-badge {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #e8eef8;
            color: #67789a;
            display: grid;
            place-items: center;
            font-weight: 700;
            font-size: 0.85rem;
            flex-shrink: 0;
        }

        .student-name {
            font-weight: 600;
            margin-bottom: 4px;
        }

        .student-sub {
            color: #7483a0;
            font-size: 0.86rem;
        }

        .program-main {
            color: #4a5a79;
            margin-bottom: 4px;
        }

        .program-sub {
            color: #7f8da7;
            font-size: 0.86rem;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 0.84rem;
            font-weight: 600;
        }

        .status-active {
            color: var(--green);
            background: var(--green-soft);
        }

        .status-incomplete {
            color: var(--amber);
            background: var(--amber-soft);
        }

        .action-cell {
            display: flex;
            align-items: center;
            gap: 14px;
            color: #8fa0bf;
        }

        .action-cell a,
        .action-cell span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
        }

        .table-footer {
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border-top: 1px solid #e5ebf5;
            color: #6f7f9c;
            font-size: 0.9rem;
        }

        .pager {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .pager-link {
            min-width: 42px;
            height: 34px;
            border-radius: 8px;
            border: 1px solid #d8e0ee;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            background: #fff;
            color: #71809d;
        }

        .pager-link.disabled {
            opacity: 0.5;
            pointer-events: none;
        }

        .empty-state {
            padding: 48px 24px;
            text-align: center;
            color: #7d8ba6;
        }

        @media (max-width: 980px) {
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

            .topbar-right,
            .table-toolbar,
            .toolbar-form {
                width: 100%;
            }

            .table-toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .toolbar-right {
                justify-content: flex-end;
            }
        }

        @media (max-width: 640px) {
            .dashboard-body,
            .topbar {
                padding-left: 16px;
                padding-right: 16px;
            }

            .search-box,
            .filter-select,
            .btn {
                width: 100%;
            }

            .toolbar-right {
                flex-direction: column;
            }

            .table-footer {
                flex-direction: column;
                align-items: flex-start;
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
                <a href="{{ route('admin.dashboard') }}" class="menu-item">
                    <i class="fas fa-table-cells-large"></i>
                    <span>Dashboard</span>
                </a>
                <a href="{{ route('admin.students') }}" class="menu-item active">
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

        <main>
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
                    <h1>Students</h1>
                    <p>Manage your yearbook system data efficiently.</p>
                </div>

                @if (session('success'))
                    <div class="flash-success">{{ session('success') }}</div>
                @endif

                <section class="table-card">
                    <div class="table-toolbar">
                        <div class="toolbar-left">
                            <form method="GET" action="{{ route('admin.students') }}" class="toolbar-form">
                                <label class="search-box">
                                    <i class="fas fa-magnifying-glass" style="color: #8ea0bf;"></i>
                                    <input type="text" name="search" value="{{ $search }}" placeholder="Search students...">
                                </label>

                                <select name="course" class="filter-select" onchange="this.form.submit()">
                                    <option value="">All Programs</option>
                                    @foreach ($courses as $courseOption)
                                        <option value="{{ $courseOption }}" @selected($course === $courseOption)>{{ $courseOption }}</option>
                                    @endforeach
                                </select>

                                <button type="submit" class="btn">
                                    <i class="fas fa-filter"></i>
                                    <span>Filter</span>
                                </button>
                            </form>
                        </div>

                        <div class="toolbar-right">
                            <a href="{{ route('admin.students.create') }}" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                <span>Add Student</span>
                            </a>
                        </div>
                    </div>

                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID Number</th>
                                    <th>Name</th>
                                    <th>Program & Year</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($students as $student)
                                    @php
                                        $initials = collect(explode(' ', trim($student->name)))
                                            ->filter()
                                            ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
                                            ->take(2)
                                            ->implode('');
                                        $program = $student->section->course ?? 'Unassigned Program';
                                        $yearLevel = $student->section->name ?? 'No section yet';
                                        $hasCompleteProfile = filled($student->student_id) && filled($student->email) && $student->section;
                                    @endphp
                                    <tr>
                                        <td>{{ $student->student_id ?: 'N/A' }}</td>
                                        <td>
                                            <div class="student-cell">
                                                <div class="avatar-badge">{{ $initials ?: 'S' }}</div>
                                                <div>
                                                    <div class="student-name">{{ $student->name }}</div>
                                                    <div class="student-sub">{{ $student->email }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="program-main">{{ $program }}</div>
                                            <div class="program-sub">{{ $yearLevel }}</div>
                                        </td>
                                        <td>
                                            <span class="status-badge {{ $hasCompleteProfile ? 'status-active' : 'status-incomplete' }}">
                                                {{ $hasCompleteProfile ? 'Active' : 'Incomplete' }}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="action-cell">
                                                <a href="{{ route('profile.view', $student->id) }}" title="View profile">
                                                    <i class="far fa-pen-to-square"></i>
                                                </a>
                                                <span title="Delete unavailable">
                                                    <i class="far fa-trash-can"></i>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="5" class="empty-state">
                                            No students matched your current filters.
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div>
                            @if ($students->total() > 0)
                                Showing {{ $students->firstItem() }} to {{ $students->lastItem() }} of {{ $students->total() }} entries
                            @else
                                Showing 0 entries
                            @endif
                        </div>

                        <div class="pager">
                            <a href="{{ $students->previousPageUrl() ?: '#' }}" class="pager-link {{ $students->onFirstPage() ? 'disabled' : '' }}">Prev</a>
                            <a href="{{ $students->nextPageUrl() ?: '#' }}" class="pager-link {{ $students->hasMorePages() ? '' : 'disabled' }}">Next</a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
</body>
</html>
