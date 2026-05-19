<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Student | NU Lipa Yearbook</title>
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
            --shadow: 0 18px 40px rgba(18, 31, 68, 0.08);
            --error-bg: #fff1f2;
            --error-border: #fecdd3;
            --error-text: #be123c;
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

        .form-card {
            max-width: 780px;
            margin-top: 24px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
            box-shadow: var(--shadow);
            padding: 24px;
        }

        .error-box {
            background: var(--error-bg);
            border: 1px solid var(--error-border);
            color: var(--error-text);
            border-radius: 14px;
            padding: 14px 16px;
            margin-bottom: 20px;
            font-weight: 600;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .form-group {
            margin-bottom: 18px;
        }

        .form-group.full {
            grid-column: 1 / -1;
        }

        label {
            display: block;
            font-size: 0.84rem;
            font-weight: 700;
            color: #55637f;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .input-wrap {
            position: relative;
        }

        .input-wrap i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #95a3be;
        }

        input {
            width: 100%;
            height: 48px;
            border: 1px solid #cfdaec;
            border-radius: 12px;
            padding: 0 16px 0 44px;
            font-size: 0.95rem;
            color: var(--text);
            outline: none;
            transition: 0.2s ease;
        }

        input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(66, 84, 197, 0.12);
        }

        .actions {
            display: flex;
            gap: 12px;
            margin-top: 8px;
        }

        .btn {
            height: 46px;
            border-radius: 12px;
            padding: 0 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #cfdaec;
        }

        .btn-primary {
            background: var(--primary);
            color: #fff;
            border-color: var(--primary);
            box-shadow: 0 10px 18px rgba(66, 84, 197, 0.22);
        }

        .btn-secondary {
            background: #fff;
            color: #5a6986;
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

            .topbar-right {
                width: 100%;
                justify-content: space-between;
            }
        }

        @media (max-width: 720px) {
            .dashboard-body,
            .topbar {
                padding-left: 16px;
                padding-right: 16px;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .actions {
                flex-direction: column;
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
                    <h1>Add Student</h1>
                    <p>Create a new student account without leaving the admin panel.</p>
                </div>

                <section class="form-card">
                    @if ($errors->any())
                        <div class="error-box">{{ $errors->first() }}</div>
                    @endif

                    <form action="{{ route('admin.students.store') }}" method="POST">
                        @csrf

                        <div class="form-grid">
                            <div class="form-group">
                                <label>First Name</label>
                                <div class="input-wrap">
                                    <i class="fas fa-user"></i>
                                    <input type="text" name="first_name" value="{{ old('first_name') }}" placeholder="Juan" required autofocus>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Last Name</label>
                                <div class="input-wrap">
                                    <i class="fas fa-user"></i>
                                    <input type="text" name="last_name" value="{{ old('last_name') }}" placeholder="Dela Cruz" required>
                                </div>
                            </div>

                            <div class="form-group full">
                                <label>Email Address</label>
                                <div class="input-wrap">
                                    <i class="far fa-envelope"></i>
                                    <input type="email" name="email" value="{{ old('email') }}" placeholder="student@nu-lipa.edu.ph" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Password</label>
                                <div class="input-wrap">
                                    <i class="fas fa-lock"></i>
                                    <input type="password" name="password" placeholder="Minimum 8 characters" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Confirm Password</label>
                                <div class="input-wrap">
                                    <i class="fas fa-shield-alt"></i>
                                    <input type="password" name="password_confirmation" placeholder="Repeat password" required>
                                </div>
                            </div>

                            <div class="form-group full">
                                <label>Course</label>
                                <div class="input-wrap">
                                    <i class="fas fa-book"></i>
                                    <input type="text" name="course" value="{{ old('course') }}" placeholder="BS Computer Science">
                                </div>
                            </div>

                            <div class="form-group full">
                                <label>Student ID / Alumni ID</label>
                                <div class="input-wrap">
                                    <i class="fas fa-hashtag"></i>
                                    <input type="text" name="student_id" value="{{ old('student_id') }}" placeholder="202X-XXXX" required>
                                </div>
                            </div>
                        </div>

                        <div class="actions">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                <span>Create Student</span>
                            </button>
                            <a href="{{ route('admin.students') }}" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i>
                                <span>Back to Students</span>
                            </a>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    </div>
</body>
</html>
