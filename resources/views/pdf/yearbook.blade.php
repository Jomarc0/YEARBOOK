<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>{{ $meta['title'] }} · {{ $meta['year'] }}</title>
<style>
  /*
   * DOMPDF-compatible CSS.
   * Rules: no flexbox, no grid, no CSS variables.
   * Use floats, tables, and absolute positioning only.
   * Font: built-in "serif" maps to DejaVu Serif in DOMPDF.
   */

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: serif;
    font-size: 11pt;
    color: #1a1a2e;
    background: #fff;
  }

  /* ── Page break helpers ───────────────────────────────────── */
  .page-break   { page-break-after: always; }
  .keep-together { page-break-inside: avoid; }

  /* ── Cover page ───────────────────────────────────────────── */
  .cover {
    width: 100%;
    height: 260mm;
    background: #1a1a2e;
    text-align: center;
    padding: 60pt 40pt 40pt;
    color: #fff;
  }

  .cover-emblem {
    width: 60pt;
    height: 60pt;
    border: 1.5pt solid #c9a84c;
    border-radius: 50%;
    margin: 0 auto 20pt;
    line-height: 60pt;
    font-size: 24pt;
    color: #c9a84c;
  }

  .cover-title {
    font-family: serif;
    font-size: 18pt;
    font-style: italic;
    color: rgba(255,255,255,0.85);
    margin-bottom: 6pt;
  }

  .cover-year {
    font-family: serif;
    font-size: 64pt;
    font-weight: bold;
    color: #c9a84c;
    line-height: 1;
    margin-bottom: 10pt;
  }

  .cover-rule {
    width: 120pt;
    height: 0.5pt;
    background: rgba(255,255,255,0.2);
    margin: 16pt auto;
  }

  .cover-school {
    font-size: 8pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
  }

  /* ── Section heading ──────────────────────────────────────── */
  .section-heading {
    background: #1a1a2e;
    color: #fff;
    padding: 20pt 24pt;
    margin-bottom: 16pt;
  }

  .section-heading .tag {
    font-size: 7pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 4pt;
  }

  .section-heading h2 {
    font-family: serif;
    font-size: 22pt;
    font-weight: bold;
    color: #fff;
    line-height: 1.2;
  }

  .section-heading .strand {
    display: inline-block;
    border: 0.5pt solid #c9a84c;
    color: #c9a84c;
    font-size: 8pt;
    padding: 2pt 8pt;
    border-radius: 10pt;
    margin-top: 6pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  /* ── Student portrait grid ────────────────────────────────── */
  .portrait-grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 8pt;
  }

  .portrait-grid td {
    width: 25%;
    vertical-align: top;
    text-align: center;
    background: #fff;
    border: 0.5pt solid #ece5d4;
    border-radius: 6pt;
    padding: 10pt 6pt;
  }

  .portrait-avatar {
    width: 52pt;
    height: 52pt;
    border-radius: 50%;
    margin: 0 auto 6pt;
    overflow: hidden;
    display: block;
  }

  .portrait-avatar img {
    width: 52pt;
    height: 52pt;
    object-fit: cover;
    border-radius: 50%;
  }

  .portrait-initials {
    width: 52pt;
    height: 52pt;
    border-radius: 50%;
    line-height: 52pt;
    text-align: center;
    font-family: serif;
    font-size: 16pt;
    font-weight: bold;
    margin: 0 auto 6pt;
  }

  .portrait-name {
    font-size: 8.5pt;
    font-weight: bold;
    color: #1a1a2e;
    line-height: 1.3;
  }

  .portrait-course {
    font-size: 7pt;
    color: #aaa;
    margin-top: 2pt;
  }

  .portrait-id {
    font-size: 6.5pt;
    color: #ccc;
    margin-top: 2pt;
    letter-spacing: 0.06em;
  }

  /* ── Quote strip ──────────────────────────────────────────── */
  .quote-page {
    padding: 16pt 24pt;
    background: #f9f6f0;
  }

  .quote-tag {
    font-size: 7pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 10pt;
  }

  .quote-item {
    border-left: 2pt solid #c9a84c;
    padding: 6pt 10pt;
    margin-bottom: 8pt;
    background: #fff;
  }

  .quote-text {
    font-family: serif;
    font-style: italic;
    font-size: 9.5pt;
    color: #333;
    line-height: 1.55;
  }

  .quote-attr {
    font-size: 8pt;
    color: #aaa;
    margin-top: 3pt;
  }

  /* ── Faculty ──────────────────────────────────────────────── */
  .faculty-heading {
    font-family: serif;
    font-size: 18pt;
    color: #1a1a2e;
    margin-bottom: 16pt;
    padding: 0 24pt;
  }

  .faculty-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8pt;
    padding: 0 24pt;
  }

  .faculty-table td {
    vertical-align: middle;
    padding: 8pt 10pt;
    background: #fff;
    border: 0.5pt solid #ece5d4;
    border-radius: 6pt;
  }

  .faculty-avatar {
    width: 36pt;
    height: 36pt;
    border-radius: 50%;
    background: #f0ece0;
    line-height: 36pt;
    text-align: center;
    font-size: 10pt;
    font-weight: bold;
    color: #8a6a3a;
    display: block;
  }

  .faculty-name {
    font-size: 10pt;
    font-weight: bold;
    color: #1a1a2e;
  }

  .faculty-role {
    font-size: 8pt;
    color: #aaa;
    margin-top: 2pt;
  }

  /* ── Stats ────────────────────────────────────────────────── */
  .stats-page {
    padding: 20pt 24pt;
    background: #f7f3ec;
  }

  .stats-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 8pt;
    margin-top: 12pt;
  }

  .stats-table td {
    width: 50%;
    text-align: center;
    background: #f0ebe0;
    border-radius: 5pt;
    padding: 10pt 6pt;
  }

  .stat-num {
    font-family: serif;
    font-size: 20pt;
    font-weight: bold;
    color: #1a1a2e;
  }

  .stat-lbl {
    font-size: 7.5pt;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-top: 2pt;
  }

  /* ── Closing ──────────────────────────────────────────────── */
  .closing {
    background: #1a1a2e;
    color: #fff;
    text-align: center;
    padding: 60pt 40pt;
    height: 180mm;
  }

  .closing-star {
    color: #c9a84c;
    font-size: 20pt;
    margin-bottom: 16pt;
  }

  .closing-title {
    font-family: serif;
    font-size: 26pt;
    color: #fff;
    line-height: 1.25;
    margin-bottom: 14pt;
  }

  .closing-body {
    font-size: 11pt;
    color: rgba(255,255,255,0.42);
    line-height: 1.85;
    margin-bottom: 20pt;
  }

  .closing-foot {
    font-size: 8pt;
    color: rgba(255,255,255,0.18);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border-top: 0.5pt solid rgba(255,255,255,0.1);
    padding-top: 12pt;
  }

  /* ── Page number footer ───────────────────────────────────── */
  .page-num {
    font-size: 8pt;
    color: #ccc;
    text-align: center;
    margin-top: 16pt;
  }
</style>
</head>
<body>

{{-- ══════════════════════════════════════════════════════════ --}}
{{-- COVER PAGE                                                 --}}
{{-- ══════════════════════════════════════════════════════════ --}}
<div class="cover">
  <div class="cover-emblem">✦</div>
  <div class="cover-title">{{ $meta['title'] }}</div>
  <div class="cover-year">{{ $meta['year'] }}</div>
  <div class="cover-rule"></div>
  <div class="cover-school">{{ $meta['school'] }}</div>
</div>
<div class="page-break"></div>

{{-- ══════════════════════════════════════════════════════════ --}}
{{-- DEDICATION PAGE                                            --}}
{{-- ══════════════════════════════════════════════════════════ --}}
<div style="text-align:center; padding: 80pt 48pt; background:#12121f; height:260mm;">
  <div style="color:#c9a84c; font-size:18pt; margin-bottom:24pt;">✦</div>
  <p style="font-family:serif; font-style:italic; font-size:13pt; color:rgba(255,255,255,0.7); line-height:1.8; max-width:320pt; margin:0 auto 20pt;">
    Dedicated to every student who turned struggles into stories<br>
    and memories into milestones.
  </p>
  <div style="height:0.5pt; background:rgba(255,255,255,0.12); width:100pt; margin:0 auto 16pt;"></div>
  <p style="font-size:8pt; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.2);">
    {{ $meta['school'] }} · {{ $meta['year'] }}
  </p>
</div>
<div class="page-break"></div>

{{-- ══════════════════════════════════════════════════════════ --}}
{{-- SECTION SPREADS                                            --}}
{{-- ══════════════════════════════════════════════════════════ --}}
@foreach ($sections as $section)

  {{-- Section header page --}}
  <div class="section-heading" style="height:auto; min-height:60pt;">
    <div class="tag">Class of {{ $meta['year'] }}</div>
    <h2>{{ $section->name }}</h2>
    @if ($section->strand)
      <span class="strand">{{ $section->strand }}</span>
    @endif
  </div>

  {{-- Portrait grid — 4 per row, one table row per 4 students --}}
  @php
    $students = $section->students;
    $chunks   = $students->chunk(4);
    $pageNum  = $loop->index * 2 + 4;

    $avatarColors = [
      ['bg' => '#e4f0d8', 'tc' => '#2a5618'],
      ['bg' => '#d8e8f5', 'tc' => '#173660'],
      ['bg' => '#f5e4d8', 'tc' => '#5c2a10'],
      ['bg' => '#e8d8f5', 'tc' => '#38185c'],
    ];
  @endphp

  @foreach ($chunks as $chunk)
    <div class="keep-together">
      <table class="portrait-grid">
        <tr>
          @foreach ($chunk as $student)
            @php
              $colorIdx    = (int) preg_replace('/\D/', '', $student->student_id ?? '0') % 4;
              $color       = $avatarColors[$colorIdx];
              $initials    = strtoupper(
                substr($student->name, 0, 1) .
                (str_contains($student->name, ' ')
                  ? substr(strrchr($student->name, ' '), 1, 1)
                  : '')
              );
              // Pre-compute the inline style string — keeps Blade expressions
              // out of the HTML attribute value, which DOMPDF parses more reliably.
              $avatarStyle = 'background:' . $color['bg'] . ';color:' . $color['tc'] . ';';
            @endphp
            <td>
              @if ($student->profile_picture)
                <img class="portrait-avatar"
                     src="{{ $student->profile_picture }}"
                     alt="{{ $student->name }}" />
              @else
                <div class="portrait-initials" style="{{ $avatarStyle }}">
                  {{ $initials }}
                </div>
              @endif

              <div class="portrait-name">{{ $student->name }}</div>
              @if ($student->course)
                <div class="portrait-course">{{ $student->course }}</div>
              @endif
              @if ($student->student_id)
                <div class="portrait-id">{{ $student->student_id }}</div>
              @endif
            </td>
          @endforeach

          {{-- Pad to 4 columns --}}
          @for ($pad = $chunk->count(); $pad < 4; $pad++)
            <td style="border:0.5pt dashed #e8e0d0; background:#fafaf8;"></td>
          @endfor
        </tr>
      </table>
    </div>
    <div class="page-num">— {{ $pageNum++ }} —</div>

    {{-- Senior quotes for the same 4 students --}}
    <div class="quote-page keep-together">
      <div class="quote-tag">Senior Quotes</div>
      @foreach ($chunk as $student)
        @if ($student->bio)
          <div class="quote-item">
            <div class="quote-text">"{{ $student->bio }}"</div>
            <div class="quote-attr">— {{ $student->name }}</div>
          </div>
        @endif
      @endforeach
    </div>
    <div class="page-num">— {{ $pageNum++ }} —</div>
    <div class="page-break"></div>
  @endforeach

@endforeach

{{-- ══════════════════════════════════════════════════════════ --}}
{{-- FACULTY PAGE                                               --}}
{{-- ══════════════════════════════════════════════════════════ --}}
@if ($faculty->isNotEmpty())
<div style="padding:20pt 0 0;">
  <div style="font-size:7pt; letter-spacing:0.2em; text-transform:uppercase; color:#c9a84c; padding:0 24pt; margin-bottom:6pt;">Faculty</div>
  <div class="faculty-heading">Our Advisers</div>
  <table class="faculty-table">
    <tbody>
      @foreach ($faculty as $f)
        @php
          $fi = strtoupper(
            collect(explode(' ', $f->name))
              ->map(fn($w) => $w[0] ?? '')
              ->take(2)
              ->implode('')
          );
        @endphp
        <tr>
          <td style="width:44pt; border:none; padding:0;">
            @if ($f->profile_picture)
              <img src="{{ $f->profile_picture }}" alt="{{ $f->name }}"
                style="width:36pt;height:36pt;border-radius:50%;object-fit:cover;" />
            @else
              <div class="faculty-avatar">{{ $fi }}</div>
            @endif
          </td>
          <td>
            <div class="faculty-name">{{ $f->name }}</div>
            <div class="faculty-role">{{ $f->position ?? 'Faculty' }}</div>
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>
</div>
<div class="page-break"></div>
@endif

{{-- ══════════════════════════════════════════════════════════ --}}
{{-- STATS PAGE                                                 --}}
{{-- ══════════════════════════════════════════════════════════ --}}
@php
  $totalStudents = $sections->flatMap(fn($s) => $s->students)->count();
  $totalSections = $sections->count();
@endphp
<div class="stats-page">
  <div style="font-size:7pt; letter-spacing:0.2em; text-transform:uppercase; color:#c9a84c; margin-bottom:6pt;">By the numbers</div>
  <div style="font-family:serif; font-size:18pt; color:#1a1a2e; line-height:1.2; margin-bottom:12pt;">
    {{ $meta['year'] }} at a Glance
  </div>
  <table class="stats-table">
    <tr>
      <td><div class="stat-num">{{ $totalStudents }}</div><div class="stat-lbl">Graduates</div></td>
      <td><div class="stat-num">{{ $totalSections }}</div><div class="stat-lbl">Sections</div></td>
    </tr>
    <tr>
      <td><div class="stat-num">4</div><div class="stat-lbl">Years</div></td>
      <td><div class="stat-num">{{ $meta['school'] }}</div><div class="stat-lbl">Institution</div></td>
    </tr>
  </table>
</div>
<div class="page-break"></div>

{{-- ══════════════════════════════════════════════════════════ --}}
{{-- CLOSING / BACK COVER                                       --}}
{{-- ══════════════════════════════════════════════════════════ --}}
<div class="closing">
  <div class="closing-star">✦</div>
  <div class="closing-title">The End of<br>a Chapter</div>
  <p class="closing-body">
    You carried these years with grace.<br>
    Now carry them forward.
  </p>
  <div class="closing-foot">
    {{ $meta['school'] }} · {{ $meta['year'] }}
  </div>
</div>

</body>
</html>