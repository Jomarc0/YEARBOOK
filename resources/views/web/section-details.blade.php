<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $sectionName }} | Masterlist</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root { 
            --nu-blue: #1d2b4b; 
            --nu-blue-bright: #3f51b5;
            --dark-bg: #0f172a; 
            --card-bg: #ffffff;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background-color: #f8fafc; color: #1e293b; min-height: 100vh; }

        /* --- NAVIGATION --- */
        nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px 8%; background: white; border-bottom: 1px solid #e2e8f0;
        }
        .logo h3 { color: var(--nu-blue); font-weight: 800; letter-spacing: -1px; }

        /* --- HEADER SECTION --- */
        .detail-header {
            background: white; padding: 40px 8%; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: flex-end;
        }
        .breadcrumb { font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .breadcrumb a { color: var(--nu-blue-bright); text-decoration: none; font-weight: 700; }
        .section-title { font-size: 2.2rem; font-weight: 800; color: var(--nu-blue); }
        
        .stats-pill {
            background: #f1f5f9; padding: 10px 20px; border-radius: 50px;
            font-size: 0.85rem; font-weight: 600; color: #475569;
        }

        /* --- TABLE STYLE --- */
        .content-wrap { padding: 40px 8%; max-width: 1400px; margin: 0 auto; }
        
        .table-container {
            background: white; border-radius: 15px; overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;
        }

        table { width: 100%; border-collapse: collapse; text-align: left; }
        thead { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
        th { padding: 18px 25px; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; }
        td { padding: 15px 25px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        
        tr:hover { background-color: #fcfcfd; }

        .student-info { display: flex; align-items: center; gap: 15px; }
        .student-avatar {
            width: 45px; height: 45px; border-radius: 12px;
            object-fit: cover; background: #e2e8f0;
        }
        .student-name { font-weight: 700; color: var(--nu-blue); display: block; }
        .student-id { font-size: 0.75rem; color: #94a3b8; }

        .status-badge {
            padding: 5px 12px; border-radius: 20px; font-size: 0.7rem;
            font-weight: 700; background: #ecfdf5; color: #059669;
        }

        .action-btn {
            padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;
            background: white; color: var(--nu-blue); text-decoration: none;
            font-size: 0.8rem; font-weight: 600; transition: 0.3s;
        }
        .action-btn:hover { background: var(--nu-blue); color: white; border-color: var(--nu-blue); }

        /* --- EMPTY STATE --- */
        .empty-state { padding: 100px; text-align: center; color: #94a3b8; }
        .empty-state i { font-size: 3rem; margin-bottom: 20px; opacity: 0.3; }

    </style>
</head>
<body>

    <nav>
        <div class="logo">
            <h3>NU Lipa <span style="font-weight: 300; font-size: 0.65rem; display: block; margin-top: -3px; color: #64748b;">SINAG-BUGHAW ARCHIVE</span></h3>
        </div>
    </nav>

    <header class="detail-header">
        <div>
            <div class="breadcrumb">
                <a href="{{ route('sections') }}">Sections</a> / {{ $sectionName }}
            </div>
            <h1 class="section-title">{{ $sectionName }} Masterlist</h1>
        </div>
        <div class="stats-pill">
            <i class="fas fa-graduation-cap me-2"></i> {{ $students->count() }} Registered Students
        </div>
    </header>

    <main class="content-wrap">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Student Information</th>
                        <th>Email Address</th>
                        <th>Status</th>
                        <th style="text-align: right;">Profile</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($students as $student)
                    <tr>
                        <td>
                            <div class="student-info">
                                <img src="https://ui-avatars.com/api/?name={{ urlencode($student->name) }}&background=1d2b4b&color=fff" class="student-avatar">
                                <div>
                                    <span class="student-name">{{ $student->name }}</span>
                                    <span class="student-id">NU-LIPA-{{ 2026000 + $student->id }}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span style="color: #64748b;">{{ $student->email }}</span>
                        </td>
                        <td>
                            <span class="status-badge">Verified</span>
                        </td>
                        <td style="text-align: right;">
                            <a href="{{ route('profile.view', $student->id) }}" class="action-btn">
                                View Full Profile
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="4">
                            <div class="empty-state">
                                <i class="fas fa-folder-open"></i>
                                <p>No students enrolled in this section yet.</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </main>

</body>
</html>