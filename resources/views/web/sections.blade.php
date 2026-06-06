<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Sections | Sinag-Bughaw</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        nu: {
                            navy: '#1d2b4b',
                            blue: '#3f51b5',
                            gold: '#fdb813',
                            soft: '#f4f7fe',
                        },
                    },
                },
            },
        };
    </script>
</head>
<body class="min-h-screen bg-nu-soft font-sans text-nu-navy antialiased">
    <nav class="sticky top-0 z-50 border-b border-white/10 bg-nu-navy/95 shadow-lg shadow-nu-navy/10 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <a href="/" class="flex items-center gap-3 no-underline">
                <img src="/images/NU_logo.png" alt="NU Lipa" class="h-9 w-9 object-contain">
                <div class="leading-tight">
                    <p class="m-0 text-xs font-black uppercase tracking-widest text-white">Sinag-Bughaw</p>
                    <p class="m-0 text-[9px] font-bold uppercase tracking-[0.22em] text-nu-gold">National University Lipa</p>
                </div>
            </a>

            <div class="hidden items-center gap-1 md:flex">
                <a href="/" class="rounded-lg px-3 py-2 text-sm font-semibold text-white/65 no-underline hover:bg-white/10 hover:text-white">Home</a>
                <a href="/directory" class="rounded-lg px-3 py-2 text-sm font-semibold text-white/65 no-underline hover:bg-white/10 hover:text-white">Directory</a>
                <a href="/faculty" class="rounded-lg px-3 py-2 text-sm font-semibold text-white/65 no-underline hover:bg-white/10 hover:text-white">Faculty</a>
                <a href="/gallery" class="rounded-lg px-3 py-2 text-sm font-semibold text-white/65 no-underline hover:bg-white/10 hover:text-white">Gallery</a>
                <a href="/sections" class="rounded-lg bg-white/12 px-3 py-2 text-sm font-black text-nu-gold no-underline">Sections</a>
            </div>

            <div class="flex items-center gap-3">
                <div class="hidden text-right sm:block">
                    <p class="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">Pioneer</p>
                    <p class="m-0 text-sm font-black text-white">{{ Auth::user()->name ?? 'Student' }}</p>
                </div>
                <img
                    src="https://ui-avatars.com/api/?name={{ urlencode(Auth::user()->name ?? 'Student') }}&background=1d2b4b&color=fdb813"
                    alt="Profile"
                    class="h-10 w-10 rounded-xl border border-white/15 object-cover"
                >
            </div>
        </div>
    </nav>

    <header class="bg-gradient-to-br from-nu-navy to-nu-blue px-5 py-12 text-center text-white sm:px-8">
        <div class="mx-auto max-w-3xl">
            <span class="inline-flex items-center gap-2 rounded-full border border-nu-gold/30 bg-nu-gold/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-nu-gold">
                <i class="fas fa-layer-group text-[10px]"></i>
                Academic Sections
            </span>
            <h1 class="m-0 mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Sections &amp; <span class="text-nu-gold">Batches</span>
            </h1>
            <p class="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Browse student sections, advisors, and academic groups in one clean yearbook archive.
            </p>

            <div class="relative mx-auto mt-7 max-w-xl">
                <i class="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-nu-gold"></i>
                <input
                    type="text"
                    id="sectionSearch"
                    class="h-12 w-full rounded-xl border border-white/15 bg-white/10 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder-white/45 transition focus:border-nu-gold/70 focus:bg-white/15"
                    placeholder="Search by section, advisor, or program..."
                >
            </div>
        </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p class="m-0 text-[11px] font-black uppercase tracking-widest text-nu-blue">Pioneer Batch</p>
                <h2 class="m-0 mt-1 text-2xl font-black text-nu-navy">Academic Sections</h2>
                <p class="m-0 mt-1 text-sm text-slate-500">College of Computing and Information Technologies</p>
            </div>
            <span class="inline-flex w-max items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-sm ring-1 ring-slate-200">
                <i class="fas fa-users text-nu-gold"></i>
                Showing {{ $sections->count() }} sections
            </span>
        </div>

        <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" id="sectionsGrid">
            @forelse($sections as $section)
                <article class="section-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-nu-navy/10">
                    <div class="relative h-44 overflow-hidden bg-nu-navy">
                        <img
                            src="{{ $section->banner ?? 'https://images.unsplash.com/photo-1523240715181-2f0f9f224a49?auto=format&fit=crop&w=800' }}"
                            class="h-full w-full object-cover opacity-80 transition duration-500 hover:scale-105"
                            alt="{{ $section->name }}"
                        >
                        <div class="absolute inset-0 bg-gradient-to-t from-nu-navy/80 via-transparent to-transparent"></div>
                        <span class="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-nu-navy">
                            <i class="fas fa-users text-nu-gold"></i>
                            {{ $section->students_count }} students
                        </span>
                    </div>

                    <div class="p-5">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="m-0 text-[10px] font-black uppercase tracking-widest text-nu-blue">Section</p>
                                <h3 class="m-0 mt-1 text-xl font-black text-nu-navy">{{ $section->name }}</h3>
                            </div>
                            <span class="rounded-full bg-nu-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                Active
                            </span>
                        </div>

                        <div class="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                            <img
                                src="https://ui-avatars.com/api/?name={{ urlencode($section->advisor) }}&background=1d2b4b&color=fdb813"
                                alt="{{ $section->advisor }}"
                                class="h-10 w-10 rounded-xl object-cover"
                            >
                            <div class="min-w-0">
                                <p class="m-0 text-[10px] font-black uppercase tracking-widest text-slate-400">Class Advisor</p>
                                <p class="m-0 truncate text-sm font-black text-nu-navy">{{ $section->advisor }}</p>
                            </div>
                        </div>

                        <div class="mt-5">
                            <p class="m-0 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Preview</p>
                            <div class="flex items-center">
                                @foreach($section->students->take(5) as $student)
                                    <img
                                        src="https://ui-avatars.com/api/?name={{ urlencode($student->name) }}&background=1d2b4b&color=fff"
                                        title="{{ $student->name }}"
                                        alt="{{ $student->name }}"
                                        class="-ml-2 h-9 w-9 rounded-full border-2 border-white object-cover first:ml-0"
                                    >
                                @endforeach

                                @if($section->students_count > 5)
                                    <span class="-ml-2 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-nu-gold text-xs font-black text-nu-navy">
                                        +{{ $section->students_count - 5 }}
                                    </span>
                                @endif
                            </div>
                        </div>
                    </div>

                    <div class="border-t border-slate-100 p-4">
                        <a href="{{ route('sections.show', $section->id) }}" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nu-navy px-4 py-3 text-sm font-black text-nu-gold no-underline transition hover:bg-[#2a3d66]">
                            Open Masterlist
                            <i class="fas fa-arrow-right text-xs"></i>
                        </a>
                    </div>
                </article>
            @empty
                <div class="col-span-full rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
                    <i class="fas fa-folder-open mb-4 block text-5xl text-slate-200"></i>
                    <h3 class="m-0 text-lg font-black text-nu-navy">No sections found</h3>
                    <p class="m-0 mt-2 text-sm text-slate-500">Sections will appear here once they are added.</p>
                </div>
            @endforelse
        </section>
    </main>

    <footer class="mt-auto bg-[#0b1220] px-5 py-8 text-white sm:px-8">
        <div class="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
                <p class="m-0 text-sm font-black uppercase tracking-widest text-white">Sinag-Bughaw</p>
                <p class="m-0 mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                    The official digital yearbook archive of National University Lipa.
                </p>
            </div>
            <div>
                <p class="m-0 text-xs font-black uppercase tracking-widest text-nu-gold">Quick Links</p>
                <div class="mt-3 flex flex-col gap-2 text-sm text-slate-400">
                    <a href="/directory" class="text-slate-400 no-underline hover:text-white">Student Directory</a>
                    <a href="/faculty" class="text-slate-400 no-underline hover:text-white">Faculty</a>
                    <a href="/gallery" class="text-slate-400 no-underline hover:text-white">Gallery</a>
                </div>
            </div>
            <div>
                <p class="m-0 text-xs font-black uppercase tracking-widest text-nu-gold">Contact</p>
                <p class="m-0 mt-3 text-sm leading-relaxed text-slate-400">
                    <i class="fas fa-location-dot mr-2 text-nu-gold"></i>Lipa City, Batangas<br>
                    <i class="fas fa-envelope mr-2 mt-3 text-nu-gold"></i>sinagbughaw@nu-lipa.edu.ph
                </p>
            </div>
        </div>
    </footer>

    <script>
        document.getElementById('sectionSearch').addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            document.querySelectorAll('.section-card').forEach((card) => {
                card.classList.toggle('hidden', !card.innerText.toLowerCase().includes(filter));
            });
        });
    </script>
</body>
</html>
