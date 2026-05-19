<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $faculty->name }} | Faculty Profile</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { margin:0; font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; color:#1d2b4b; }
        .wrap { max-width:920px; margin:0 auto; padding:40px 20px 80px; }
        .card { background:#fff; border-radius:28px; box-shadow:0 20px 50px rgba(29,43,75,.1); overflow:hidden; }
        .hero { background:linear-gradient(135deg,#1d2b4b,#2a3d66); color:#fff; padding:38px; display:grid; grid-template-columns:220px minmax(0,1fr); gap:28px; align-items:center; }
        .hero img { width:220px; height:220px; object-fit:cover; border-radius:28px; border:4px solid rgba(255,255,255,.14); background:#dbe4f0; }
        .pill { display:inline-block; background:#fdb813; color:#1d2b4b; font-weight:800; padding:8px 14px; border-radius:999px; font-size:.78rem; text-transform:uppercase; }
        h1 { margin:14px 0 8px; font-size:2.4rem; }
        .sub { margin:0; opacity:.86; font-size:1rem; }
        .body { padding:34px 38px; line-height:1.7; color:#4b5a77; }
        .back { display:inline-block; margin-top:22px; color:#1d2b4b; font-weight:700; text-decoration:none; }
        @media (max-width:760px) { .hero { grid-template-columns:1fr; } .hero img { width:100%; height:280px; } }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <div class="hero">
                <img src="{{ $faculty->image ? asset('storage/'.$faculty->image) : 'https://via.placeholder.com/420x420?text=Faculty' }}" alt="{{ $faculty->name }}">
                <div>
                    <span class="pill">{{ $faculty->title }}</span>
                    <h1>{{ $faculty->name }}</h1>
                    <p class="sub">{{ $faculty->department }}</p>
                </div>
            </div>
            <div class="body">
                <p>{{ $faculty->bio ?: 'This faculty profile does not have a biography yet.' }}</p>
                <a class="back" href="{{ route('faculty') }}">Back to Faculty Directory</a>
            </div>
        </div>
    </div>
</body>
</html>
