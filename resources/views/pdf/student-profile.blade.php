{{-- resources/views/pdf/student-profile.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Profile – {{ $user->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            background: #f2f4f7;
            color: #333;
            font-size: 13px;
        }

        .page {
            width: 100%;
            padding: 40px;
        }

        /* ── Header bar ── */
        .header {
            background: #1d2b4b;
            color: white;
            padding: 24px 32px;
            border-radius: 12px;
            margin-bottom: 24px;
            display: flex;           /* NOTE: DomPDF has limited flex support */
        }

        .school-name {
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #a0aec0;
            margin-bottom: 4px;
        }

        .doc-title {
            font-size: 20px;
            font-weight: bold;
            color: #fdb813;
        }

        /* ── Profile card ── */
        .profile-card {
            background: white;
            border-radius: 12px;
            padding: 28px 32px;
            margin-bottom: 20px;
            border-left: 5px solid #1d2b4b;
        }

        .student-name {
            font-size: 22px;
            font-weight: bold;
            color: #1d2b4b;
            margin-bottom: 4px;
        }

        .student-course {
            font-size: 13px;
            color: #3f51b5;
            font-weight: bold;
            margin-bottom: 16px;
        }

        .info-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .info-grid td {
            padding: 7px 10px;
            border-bottom: 1px solid #f0f0f0;
            width: 50%;
        }

        .info-label {
            color: #888;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            color: #1d2b4b;
            font-weight: bold;
            font-size: 13px;
        }

        /* ── Bio / Quote ── */
        .quote-box {
            background: #f8f9ff;
            border-left: 4px solid #3f51b5;
            padding: 14px 18px;
            border-radius: 8px;
            margin: 16px 0 0;
            font-style: italic;
            color: #555;
        }

        /* ── Section heading ── */
        .section-heading {
            font-size: 13px;
            font-weight: bold;
            color: #1d2b4b;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #fdb813;
            padding-bottom: 6px;
            margin-bottom: 14px;
        }

        /* ── Achievements ── */
        .achievement-card {
            background: white;
            border-radius: 10px;
            padding: 20px 24px;
            margin-bottom: 20px;
        }

        .achievement-item {
            padding: 8px 0;
            border-bottom: 1px solid #f5f5f5;
        }

        .achievement-item:last-child {
            border-bottom: none;
        }

        .achievement-title {
            font-weight: bold;
            color: #222;
            font-size: 13px;
        }

        .achievement-sub {
            color: #888;
            font-size: 11px;
            margin-top: 2px;
        }

        /* ── Footer ── */
        .footer {
            text-align: center;
            color: #aaa;
            font-size: 10px;
            letter-spacing: 1px;
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <div class="header">
        <div>
            <div class="school-name">National University Lipa</div>
            <div class="doc-title">Student Profile — Yearbook Export</div>
        </div>
    </div>

    {{-- Profile Info --}}
    <div class="profile-card">
        <div class="student-name">{{ $user->name }}</div>
        <div class="student-course">
            {{ $user->course ?? 'Bachelor of Science in Computer Science' }}
            &bull; Batch {{ $user->section?->batch_year ?? now()->year }}
        </div>

        <table class="info-grid">
            <tr>
                <td>
                    <div class="info-label">Student ID</div>
                    <div class="info-value">{{ $user->student_id ?? 'N/A' }}</div>
                </td>
                <td>
                    <div class="info-label">Section</div>
                    <div class="info-value">{{ $user->section?->name ?? 'N/A' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="info-label">Email</div>
                    <div class="info-value">{{ $user->email }}</div>
                </td>
                <td>
                    <div class="info-label">Batch Year</div>
                    <div class="info-value">{{ $user->section?->batch_year ?? 'N/A' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="info-label">Membership</div>
                    <div class="info-value">{{ $user->is_premium ? 'Premium' : 'Free Plan' }}</div>
                </td>
                <td>
                    <div class="info-label">Generated</div>
                    <div class="info-value">{{ now()->format('M d, Y') }}</div>
                </td>
            </tr>
        </table>

        @if($user->bio)
            <div class="quote-box">
                "{{ $user->bio }}"
            </div>
        @endif
    </div>

    {{-- Achievements --}}
    @if($achievements->isNotEmpty())
    <div class="achievement-card">
        <div class="section-heading">&#127942; Achievements</div>
        @foreach($achievements as $achievement)
            <div class="achievement-item">
                <div class="achievement-title">{{ $achievement->title }}</div>
                <div class="achievement-sub">
                    {{ $achievement->subtitle ?? '' }}
                    @if($achievement->date_awarded)
                        &bull; {{ \Carbon\Carbon::parse($achievement->date_awarded)->format('M d, Y') }}
                    @endif
                </div>
            </div>
        @endforeach
    </div>
    @endif

    {{-- Footer --}}
    <div class="footer">
        &copy; {{ now()->year }} NATIONAL UNIVERSITY LIPA &bull; SINAG-BUGHAW PROJECT &bull;
        Generated {{ now()->format('F j, Y \a\t g:i A') }}
    </div>

</div>
</body>
</html>