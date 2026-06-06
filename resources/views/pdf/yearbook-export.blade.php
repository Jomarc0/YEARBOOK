<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $schoolName }} - Yearbook {{ $batchYear }}</title>
    <style>
        * { box-sizing: border-box; }
        @page { size: A4 landscape; margin: 0; }
        body { margin: 0; background: #fbf7ef; color: #172033; font-family: "DejaVu Serif", Georgia, serif; }
        .page { width: 297mm; height: 210mm; position: relative; overflow: hidden; page-break-after: always; padding: 14mm 16mm; }
        .page:last-child { page-break-after: auto; }
        .paper { background: #fbf7ef; }
        .cream { background: #f7f1e6; }
        .navy { background: #071a33; color: #f7f1e6; }
        .bg-img { position: absolute; inset: 0; width: 297mm; height: 210mm; object-fit: cover; opacity: .32; }
        .navy-overlay { position: absolute; inset: 0; background: rgba(3,18,37,.84); }
        .frame { position: absolute; top: 7mm; right: 7mm; bottom: 7mm; left: 7mm; border: .35mm solid rgba(200,155,60,.78); }
        .inner-frame { position: absolute; top: 11mm; right: 11mm; bottom: 11mm; left: 11mm; border: .15mm solid rgba(255,255,255,.14); }
        .z { position: relative; z-index: 2; }
        .gold { color: #c89b3c; }
        .eyebrow { color: #c89b3c; font-family: DejaVu Sans, Arial, sans-serif; font-size: 7.3pt; font-weight: bold; letter-spacing: 2.1pt; text-transform: uppercase; }
        .title { font-size: 31pt; line-height: .98; font-weight: bold; color: #071a33; }
        .title-lg { font-size: 43pt; line-height: .92; font-weight: bold; }
        .title-dark { color: #f7f1e6; }
        .rule { width: 24mm; height: .35mm; background: #c89b3c; margin: 5mm 0; }
        .body { font-size: 9.2pt; line-height: 1.75; color: rgba(23,32,51,.76); }
        .small { font-family: DejaVu Sans, Arial, sans-serif; font-size: 6.7pt; letter-spacing: 1.4pt; text-transform: uppercase; color: rgba(23,32,51,.58); }
        .page-no { position: absolute; left: 16mm; right: 16mm; bottom: 8mm; font-family: DejaVu Sans, Arial, sans-serif; font-size: 6.5pt; letter-spacing: 1.4pt; text-transform: uppercase; color: #9b927e; }
        .page-no:before { content: ""; display: inline-block; width: 28mm; height: .2mm; margin-right: 4mm; vertical-align: middle; background: currentColor; opacity: .4; }
        .page-no.right { text-align: right; }
        .page-no.right:before { display: none; }
        .page-no.right:after { content: ""; display: inline-block; width: 28mm; height: .2mm; margin-left: 4mm; vertical-align: middle; background: currentColor; opacity: .4; }
        .metric { border: .2mm solid rgba(216,199,162,.55); background: rgba(255,255,255,.55); padding: 5mm; }
        .metric.dark { border-color: rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: #f7f1e6; }
        .metric-num { color: #c89b3c; font-size: 23pt; line-height: 1; font-weight: bold; }
        .metric-label { margin-top: 2mm; font-family: DejaVu Sans, Arial, sans-serif; font-size: 6.2pt; font-weight: bold; letter-spacing: 1.2pt; text-transform: uppercase; color: rgba(23,32,51,.56); }
        .metric.dark .metric-label { color: rgba(255,255,255,.62); }
        .feature { border-left: .6mm solid #c89b3c; background: rgba(255,255,255,.62); padding: 4mm 5mm; margin-bottom: 3mm; }
        .feature-name { font-size: 13.5pt; line-height: 1; font-weight: bold; color: #071a33; }
        .feature-text { margin-top: 2mm; font-size: 8pt; line-height: 1.55; color: rgba(23,32,51,.72); }
        .label { color: #c89b3c; font-family: DejaVu Sans, Arial, sans-serif; font-size: 5.8pt; font-weight: bold; letter-spacing: 1.1pt; text-transform: uppercase; }
        .field { margin-top: 1mm; font-size: 7.2pt; line-height: 1.45; color: rgba(23,32,51,.72); }
        .quote-card { position: relative; border: .2mm solid rgba(216,199,162,.48); background: rgba(255,255,255,.62); padding: 5mm; margin-bottom: 4mm; }
        .quote-mark { position: absolute; top: 1mm; left: 3mm; color: rgba(200,155,60,.45); font-size: 28pt; line-height: 1; }
        .quote-text { padding-left: 7mm; font-size: 9pt; line-height: 1.65; font-style: italic; color: rgba(23,32,51,.82); }
        .student-card { border: .2mm solid rgba(216,199,162,.55); background: rgba(255,255,255,.72); margin-bottom: 4mm; }
        .student-photo-cell { width: 92mm; height: 118mm; text-align: center; vertical-align: middle; background: #e8dfcc; padding: 4mm; }
        .student-photo { max-width: 84mm; max-height: 110mm; width: auto; height: auto; object-fit: contain; background: #e8dfcc; }
        .placeholder { width: 84mm; height: 110mm; line-height: 110mm; text-align: center; background: #e8dfcc; color: #071a33; font-size: 30pt; font-weight: bold; }
        .student-name { font-size: 19pt; line-height: 1.02; font-weight: bold; color: #071a33; text-transform: uppercase; }
        .honor { display: inline-block; margin-top: 2mm; padding: 1.4mm 2.5mm; background: #c89b3c; color: #fff; font-family: DejaVu Sans, Arial, sans-serif; font-size: 5.6pt; font-weight: bold; letter-spacing: .7pt; text-transform: uppercase; }
        .faculty-photo { width: 35mm; height: 45mm; object-fit: cover; background: #e8dfcc; }
        .directory { width: 100%; border-collapse: collapse; margin-top: 6mm; }
        .directory td { border-bottom: .2mm solid rgba(216,199,162,.55); padding: 2mm 3mm 2mm 0; vertical-align: top; }
        .dir-name { font-size: 8pt; font-weight: bold; color: #071a33; }
        .dir-meta { margin-top: .8mm; font-family: DejaVu Sans, Arial, sans-serif; font-size: 5.9pt; letter-spacing: .6pt; text-transform: uppercase; color: rgba(23,32,51,.55); }
    </style>
</head>
<body>
@php
    $pageNum = 1;
    $limit = fn ($text, $length = 150) => \Illuminate\Support\Str::limit((string) $text, $length);
    $initials = function ($name) {
        $parts = preg_split('/\s+/', trim($name));
        return strtoupper(substr($parts[0] ?? '', 0, 1) . substr($parts[count($parts) - 1] ?? '', 0, 1));
    };
@endphp

<div class="page navy">
    @if($buildingBase64)<img src="{{ $buildingBase64 }}" class="bg-img" alt="">@endif
    <div class="navy-overlay"></div><div class="frame"></div><div class="inner-frame"></div>
    @if($logoBase64)<img src="{{ $logoBase64 }}" class="z" style="width:22mm;height:22mm;object-fit:contain;margin:5mm auto 8mm;display:block;" alt="">@endif
    <div class="z" style="text-align:center;">
        <div class="eyebrow">{{ $schoolName }}</div>
        <div style="margin:8mm auto 0; font-size:42pt; line-height:.92; letter-spacing:4pt; color:#e4c36a; text-transform:uppercase; font-weight:bold;">{{ $yearbookTitle }}</div>
        <div class="rule" style="margin:6mm auto;"></div>
        <div style="font-family:DejaVu Sans,Arial,sans-serif;font-size:8.5pt;letter-spacing:3.2pt;text-transform:uppercase;color:rgba(255,255,255,.82);line-height:1.9;">{{ $classTheme }}</div>
        <div style="margin-top:9mm;font-size:21pt;font-style:italic;color:#fff;">Class of</div>
        <div style="font-size:58pt;line-height:.85;color:#e4c36a;font-weight:bold;">{{ $batchYear }}</div>
        <div style="display:inline-block;margin-top:6mm;border-top:.25mm solid rgba(200,155,60,.65);border-bottom:.25mm solid rgba(200,155,60,.65);padding:2.2mm 12mm;font-family:DejaVu Sans,Arial,sans-serif;font-size:8pt;font-weight:bold;letter-spacing:3pt;text-transform:uppercase;color:#e4c36a;">Senior Yearbook</div>
    </div>
    <div class="z" style="position:absolute;left:17mm;bottom:14mm;border-left:.35mm solid #c89b3c;padding-left:5mm;">
        <div style="font-family:DejaVu Sans,Arial,sans-serif;font-size:6pt;letter-spacing:1.5pt;text-transform:uppercase;color:rgba(255,255,255,.7);">Academic Year</div>
        <div style="font-size:15pt;color:#e4c36a;margin-top:1mm;">{{ $academicYear ?: (($batchYear - 1).'-'.$batchYear) }}</div>
    </div>
</div>
@php $pageNum++; @endphp

<div class="page paper">
    <div class="eyebrow">Table of</div>
    <div class="title" style="font-size:38pt;color:#c89b3c;">Contents</div>
    <div class="rule"></div>
    <table style="width:100%;border-collapse:collapse;margin-top:8mm;">
        @foreach($toc as $item)
            <tr>
                <td style="width:18mm;font-size:17pt;font-weight:bold;color:#071a33;padding:2.2mm 0;">{{ str_pad((string) $loop->iteration, 2, '0', STR_PAD_LEFT) }}</td>
                <td style="border-bottom:.2mm solid rgba(216,199,162,.55);padding:2.2mm 0;">
                    <div style="font-family:DejaVu Sans,Arial,sans-serif;font-size:8pt;font-weight:bold;letter-spacing:1pt;text-transform:uppercase;color:#071a33;">{{ $item }}</div>
                </td>
            </tr>
        @endforeach
    </table>
    <div style="position:absolute;right:16mm;bottom:16mm;font-size:60pt;color:rgba(216,199,162,.22);">{{ $batchYear }}</div>
    <div class="page-no right">{{ $pageNum++ }}</div>
</div>

@foreach([
    ['University Message', 'A Tradition of Purpose', 'To the Class of '.$batchYear.', this yearbook gathers more than portraits. It preserves the discipline, friendship, service, and courage that shaped your years at '.$schoolName.'.', $schoolName],
    ['Dean Message', 'Scholarship With Character', 'Your achievements are not measured by honors alone, but by the integrity with which you carried your work and the generosity you offered one another.', 'Office of the Dean'],
    ['Department Chair Message', 'The Work Continues', 'May the habits you formed here become the foundation for service, leadership, and excellent work wherever the next chapter calls you.', 'Department Chair'],
] as [$eyebrow, $heading, $message, $sign])
<div class="page {{ $loop->odd ? 'cream' : 'paper' }}">
    <table style="width:100%;height:160mm;border-collapse:collapse;">
        <tr>
            <td style="vertical-align:middle;padding-right:10mm;">
                <div class="eyebrow">{{ $eyebrow }}</div>
                <div class="title" style="margin-top:3mm;">{{ $heading }}</div>
                <div class="rule"></div>
                <p class="body" style="font-size:10pt;">{{ $message }}</p>
                <div style="margin-top:12mm;border-top:.2mm solid rgba(216,199,162,.55);padding-top:5mm;">
                    <div style="font-size:15pt;color:#071a33;">{{ $sign }}</div>
                    <div class="eyebrow" style="font-size:6pt;margin-top:1.5mm;">Class of {{ $batchYear }}</div>
                </div>
            </td>
            <td style="width:50mm;vertical-align:middle;">
                @if($facultyBase64)<img src="{{ $facultyBase64 }}" style="width:50mm;height:76mm;object-fit:cover;filter:grayscale(100%);opacity:.82;" alt="">@endif
            </td>
        </tr>
    </table>
    <div class="page-no {{ $loop->even ? 'right' : '' }}">{{ $pageNum++ }}</div>
</div>
@endforeach

<div class="page paper">
    @if($buildingBase64)<img src="{{ $buildingBase64 }}" style="position:absolute;right:0;top:0;width:92mm;height:58mm;object-fit:cover;opacity:.10;filter:grayscale(100%);" alt="">@endif
    <div class="eyebrow">Program Overview</div><div class="title">Academic Profile</div><div class="rule"></div>
    <p class="body" style="width:132mm;">A graduating community shaped by National University tradition, academic discipline, and service.</p>
    <table style="width:100%;border-collapse:separate;border-spacing:3mm;margin-top:12mm;background:#071a33;padding:2mm;">
        <tr>
            <td class="metric dark"><div class="metric-num">{{ $stats['total_graduates'] }}</div><div class="metric-label">Graduates</div></td>
            <td class="metric dark"><div class="metric-num">{{ $stats['honors_count'] }}</div><div class="metric-label">With Honors</div></td>
            <td class="metric dark"><div class="metric-num">{{ $stats['sections'] }}</div><div class="metric-label">Sections</div></td>
            <td class="metric dark"><div class="metric-num">{{ count($stats['courses']) }}</div><div class="metric-label">Programs</div></td>
        </tr>
    </table>
    @foreach(array_slice($stats['courses'], 0, 8, true) as $course => $count)
        <div style="border-bottom:.2mm solid rgba(216,199,162,.55);padding:3mm 0;">
            <span style="font-family:DejaVu Sans,Arial,sans-serif;font-size:7pt;font-weight:bold;letter-spacing:.8pt;text-transform:uppercase;color:#071a33;">{{ $course }}</span>
            <span style="float:right;font-size:13pt;color:#c89b3c;">{{ $count }}</span>
        </div>
    @endforeach
    <div class="page-no right">{{ $pageNum++ }}</div>
</div>

<div class="page cream">
    <div class="eyebrow">Class Statistics</div><div class="title">{{ $batchYear }} at a Glance</div><div class="rule"></div>
    <table style="width:100%;border-collapse:separate;border-spacing:3mm;margin:5mm -3mm 8mm;">
        <tr>
            <td class="metric"><div class="metric-num">{{ $stats['total_graduates'] }}</div><div class="metric-label">Total Graduates</div></td>
            <td class="metric"><div class="metric-num">{{ $stats['honors_count'] }}</div><div class="metric-label">Latin Honors</div></td>
            <td class="metric"><div class="metric-num">{{ $stats['organization_count'] }}</div><div class="metric-label">Organizations</div></td>
        </tr>
    </table>
    @foreach(['Honors Distribution' => $stats['honors'], 'Course Distribution' => $stats['courses']] as $heading => $rows)
        <div class="eyebrow" style="color:#071a33;margin-top:7mm;">{{ $heading }}</div>
        @foreach(array_slice($rows, 0, 6, true) as $label => $count)
            <div style="padding:2mm 0;border-bottom:.2mm solid rgba(216,199,162,.55);font-size:8pt;">
                {{ $label }} <span style="float:right;color:#c89b3c;font-weight:bold;">{{ $count }}</span>
            </div>
        @endforeach
    @endforeach
    <div class="page-no">{{ $pageNum++ }}</div>
</div>

@foreach([
    ['Academic Excellence', 'Distinction and Service', $featured['achievements'], 'achievements', false],
    ['Organizations', 'Leadership in Community', $featured['organizations'], 'organizations', false],
    ['Memories', 'The Days We Keep', $featured['memories'], 'fondest_memory', true],
    ['Future Aspirations', 'Where We Are Going', $featured['aspirations'], 'future_plans', false],
] as [$eyebrow, $heading, $items, $field, $quote])
<div class="page {{ $loop->odd ? 'paper' : 'cream' }}">
    <div class="eyebrow">{{ $eyebrow }}</div><div class="title">{{ $heading }}</div><div class="rule"></div>
    @forelse($items as $student)
        @if($quote)
            <div class="quote-card"><div class="quote-mark">“</div><div class="quote-text">{{ $limit($student[$field] ?: ($student['motto'] ?? ''), 240) }}</div><div style="border-top:.2mm solid rgba(216,199,162,.5);margin-top:3mm;padding-top:2mm;"><div class="small" style="color:#071a33;">{{ $student['name'] }}</div><div class="small">{{ $student['course'] }}</div></div></div>
        @else
            <div class="feature"><div class="feature-name">{{ $student['name'] }}</div><div class="feature-text">{{ $limit($student[$field] ?? '', 260) }}</div><div class="label" style="margin-top:2mm;">{{ $student['honors'] ?: $student['course'] }}</div></div>
        @endif
    @empty
        <p class="body">This section will grow as more yearbook entries are completed.</p>
    @endforelse
    <div class="page-no {{ $loop->even ? 'right' : '' }}">{{ $pageNum++ }}</div>
</div>
@endforeach

@foreach($sections as $section)
    @if($section['student_count'] === 0) @continue @endif
    <div class="page navy">
        @if($buildingBase64)<img src="{{ $buildingBase64 }}" class="bg-img" style="opacity:.25;" alt="">@endif
        <div class="navy-overlay"></div><div class="frame"></div><div class="inner-frame"></div>
        <div class="z" style="position:absolute;left:0;right:0;top:32mm;text-align:center;font-size:74pt;line-height:1;color:rgba(255,255,255,.04);font-weight:bold;">{{ strtoupper(substr($section['name'], 0, 8)) }}</div>
        <div class="z" style="text-align:center;margin-top:54mm;">
            <div class="eyebrow">Section</div>
            <div style="font-size:54pt;line-height:.9;color:#e4c36a;font-weight:bold;">{{ $section['name'] }}</div>
            <div style="margin-top:6mm;font-family:DejaVu Sans,Arial,sans-serif;font-size:8pt;font-weight:bold;letter-spacing:2pt;text-transform:uppercase;color:rgba(255,255,255,.7);">{{ $section['student_count'] }} Graduates</div>
            <div class="rule" style="margin:11mm auto;"></div>
            <div style="font-size:17pt;font-style:italic;line-height:1.6;color:rgba(255,255,255,.88);">“Dream. Build. Lead.<br>Inspire the future.”</div>
            @if($section['adviser'])<div class="small" style="color:rgba(255,255,255,.45);margin-top:12mm;">Adviser: {{ $section['adviser'] }}</div>@endif
        </div>
        <div class="page-no right" style="color:rgba(255,255,255,.38);">{{ $pageNum++ }}</div>
    </div>

    @foreach($section['students'] as $student)
    <div class="page {{ $loop->odd ? 'paper' : 'cream' }}">
        <div class="eyebrow">{{ $section['name'] }}</div><div class="title">Graduate Profile</div><div class="rule"></div>
            <div class="student-card">
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td class="student-photo-cell">
                            @if($student['photo'])<img src="{{ $student['photo'] }}" class="student-photo" alt="">@else<div class="placeholder">{{ $initials($student['name']) }}</div>@endif
                        </td>
                        <td style="vertical-align:top;padding:6mm 7mm;">
                            <div class="student-name" style="{{ strlen($student['name']) > 24 ? 'font-size:16pt;' : '' }}">{{ $student['name'] }}</div>
                            <div class="small" style="margin-top:2mm;">{{ $student['course'] ?: $student['student_id'] }}</div>
                            @if($student['honors'])<span class="honor">{{ $student['honors'] }}</span>@endif
                            @if($student['quote'] || $student['motto'])<div class="field" style="margin-top:3mm;border-left:.5mm solid #c89b3c;padding-left:3mm;font-style:italic;">“{{ $limit($student['quote'] ?: $student['motto'], 190) }}”</div>@endif
                            <table style="width:100%;border-collapse:separate;border-spacing:3mm;margin-top:3mm;">
                                <tr>
                                    <td><div class="label">Nickname</div><div class="field">{{ $student['nickname'] ?: '—' }}</div></td>
                                    <td><div class="label">Hometown</div><div class="field">{{ $student['hometown'] ?: '—' }}</div></td>
                                    <td><div class="label">Most Likely To</div><div class="field">{{ $student['most_likely_to'] ?: '—' }}</div></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><div class="label">Achievements</div><div class="field">{{ $limit($student['achievements'], 145) ?: '—' }}</div></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><div class="label">Future Plans</div><div class="field">{{ $limit($student['future_plans'] ?: $student['ambition'], 145) ?: '—' }}</div></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><div class="label">Messages</div><div class="field">{{ $limit(trim(($student['message_to_batchmates'] ?? '').' '.($student['message_to_parents'] ?? '')), 160) ?: '—' }}</div></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        <div class="page-no {{ $loop->even ? 'right' : '' }}">{{ $pageNum++ }}</div>
    </div>
    @endforeach
@endforeach

@foreach($facultyChunks as $chunk)
<div class="page {{ $loop->odd ? 'paper' : 'cream' }}">
    <div class="eyebrow">Our Faculty</div><div class="title">Mentors and Guides</div><div class="rule"></div>
    @foreach(array_chunk($chunk, 2) as $row)
        <table style="width:100%;border-collapse:separate;border-spacing:4mm;margin-bottom:2mm;"><tr>
        @foreach($row as $faculty)
            <td style="width:50%;border:.2mm solid rgba(216,199,162,.5);background:rgba(255,255,255,.62);padding:4mm;vertical-align:top;">
                <table style="width:100%;border-collapse:collapse;"><tr>
                    <td style="width:35mm;vertical-align:top;">@if($faculty['photo'])<img src="{{ $faculty['photo'] }}" class="faculty-photo" alt="">@else<div class="faculty-photo" style="line-height:45mm;text-align:center;color:#071a33;font-weight:bold;">{{ $initials($faculty['name']) }}</div>@endif</td>
                    <td style="vertical-align:top;padding-left:4mm;"><div style="font-size:14pt;line-height:1;font-weight:bold;color:#071a33;">{{ $faculty['name'] }}</div><div class="label" style="margin-top:2mm;">{{ $faculty['title'] }}</div><div class="field">{{ $faculty['department'] }}</div><div class="field">{{ $limit($faculty['bio'], 190) }}</div></td>
                </tr></table>
            </td>
        @endforeach
        @if(count($row) === 1)<td style="width:50%;"></td>@endif
        </tr></table>
    @endforeach
    <div class="page-no {{ $loop->even ? 'right' : '' }}">{{ $pageNum++ }}</div>
</div>
@endforeach

@foreach($students->chunk(30) as $chunk)
<div class="page {{ $loop->odd ? 'paper' : 'cream' }}">
    <div class="eyebrow">Graduate Directory</div><div class="title">Class Roster</div><div class="rule"></div>
    <table class="directory">
        @foreach($chunk->chunk(2) as $row)
            <tr>
                @foreach($row as $student)<td><div class="dir-name">{{ $student['name'] }}</div><div class="dir-meta">{{ $student['student_id'] ?: $student['course'] }}</div></td>@endforeach
                @if(count($row) === 1)<td></td>@endif
            </tr>
        @endforeach
    </table>
    <div class="page-no {{ $loop->even ? 'right' : '' }}">{{ $pageNum++ }}</div>
</div>
@endforeach

<div class="page paper">
    <div style="margin-top:74mm;width:120mm;">
        <div class="eyebrow">To the Class of {{ $batchYear }}</div><div class="title">The Next Chapter Begins</div><div class="rule"></div>
        <p class="body">You have written your story with courage, hard work, and heart. May your journey ahead be filled with purpose, success, and happiness.</p>
        <p class="body">The future is bright, and it belongs to you. Congratulations, graduates.</p>
    </div>
    <div class="page-no">{{ $pageNum++ }}</div>
</div>

<div class="page navy">
    @if($buildingBase64)<img src="{{ $buildingBase64 }}" class="bg-img" alt="">@endif
    <div class="navy-overlay"></div><div class="frame"></div><div class="inner-frame"></div>
    <div class="z" style="text-align:center;margin-top:83mm;">
        @if($logoBase64)<img src="{{ $logoBase64 }}" style="width:27mm;height:27mm;object-fit:contain;margin:0 auto 12mm;display:block;" alt="">@endif
        <div class="eyebrow">{{ $schoolName }}</div>
        <div style="font-size:20pt;letter-spacing:3pt;text-transform:uppercase;margin-top:12mm;">Sinag-Bughaw</div>
        <div style="font-family:DejaVu Sans,Arial,sans-serif;font-size:8pt;letter-spacing:2.5pt;text-transform:uppercase;color:#e4c36a;margin-top:4mm;">Senior Yearbook {{ $batchYear }}</div>
        <div style="font-family:DejaVu Sans,Arial,sans-serif;font-size:6.5pt;letter-spacing:1.6pt;color:rgba(255,255,255,.55);margin-top:8mm;">www.nul.edu.ph</div>
    </div>
</div>
</body>
</html>
