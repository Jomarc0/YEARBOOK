<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $album->title }} | Gallery</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { margin:0; font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; color:#1d2b4b; }
        .hero { background:linear-gradient(135deg,#1d2b4b,#2a3d66); color:#fff; padding:60px 20px; }
        .inner { max-width:1120px; margin:0 auto; }
        h1 { margin:0 0 10px; font-size:2.6rem; }
        .meta { opacity:.82; }
        .grid { max-width:1120px; margin:0 auto; padding:34px 20px 80px; display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:24px; }
        .photo { background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 18px 40px rgba(29,43,75,.09); }
        .media { position:relative; }
        .photo img { width:100%; height:240px; object-fit:cover; background:#e2e8f0; display:block; }
        .face-box { position:absolute; border:2px solid #fdb813; border-radius:8px; box-shadow:0 0 0 1px rgba(29,43,75,.25) inset; }
        .caption { padding:16px 18px; color:#52627f; }
        .match-list { padding:0 18px 18px; display:grid; gap:8px; }
        .match-chip { display:inline-flex; align-items:center; gap:8px; padding:8px 10px; border-radius:999px; background:#eef4ff; color:#1d2b4b; font-size:.82rem; font-weight:600; margin:0 8px 8px 0; }
        .note { padding:0 18px 18px; color:#7c8aa6; font-size:.82rem; line-height:1.5; }
        .back { display:inline-block; margin-top:18px; color:#fdb813; font-weight:700; text-decoration:none; }
    </style>
</head>
<body>
    <section class="hero">
        <div class="inner">
            <h1>{{ $album->title }}</h1>
            <div class="meta">{{ \Illuminate\Support\Carbon::parse($album->event_date)->format('F j, Y') }} • {{ $album->photos->count() }} photos</div>
            @if ($album->description)<p>{{ $album->description }}</p>@endif
            <a class="back" href="{{ route('gallery') }}">Back to Gallery</a>
        </div>
    </section>

    <section class="grid">
        @forelse ($album->photos as $photo)
            <article class="photo">
                <div class="media">
                    <img src="{{ asset('storage/'.$photo->file_path) }}" alt="{{ $photo->caption ?: $album->title }}">
                    @foreach (data_get($photo->ai_metadata, 'faces', []) as $face)
                        <span
                            class="face-box"
                            style="
                                left: {{ data_get($face, 'bounding_box.left', 0) * 100 }}%;
                                top: {{ data_get($face, 'bounding_box.top', 0) * 100 }}%;
                                width: {{ data_get($face, 'bounding_box.width', 0) * 100 }}%;
                                height: {{ data_get($face, 'bounding_box.height', 0) * 100 }}%;
                            "
                        ></span>
                    @endforeach
                </div>
                <div class="caption">{{ $photo->caption ?: 'Untitled photo' }}</div>
                @if (data_get($photo->ai_metadata, 'matches', []) !== [])
                    <div class="match-list">
                        @foreach (data_get($photo->ai_metadata, 'matches', []) as $match)
                            <span class="match-chip">
                                <strong>{{ $match['name'] }}</strong>
                                <span>{{ number_format((float) $match['similarity'], 2) }}%</span>
                            </span>
                        @endforeach
                    </div>
                @endif
                @if (data_get($photo->ai_metadata, 'limitations', []) !== [])
                    <div class="note">
                        {{ implode(' ', data_get($photo->ai_metadata, 'limitations', [])) }}
                    </div>
                @endif
            </article>
        @empty
            <p>No photos in this album yet.</p>
        @endforelse
    </section>
</body>
</html>
