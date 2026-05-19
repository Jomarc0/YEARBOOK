@forelse($students as $student)
    <div class="student-card" 
         data-course="{{ $student->course ?? 'General' }}" 
         data-name="{{ $student->name }}"
         style="animation: fadeInUp 0.5s ease forwards;">
         
        <div class="card-img-wrap">
            <span class="batch-badge">
                <i class="fas fa-graduation-cap"></i> {{ $student->batch ?? '2026' }}
            </span>
            
            <img src="{{ $student->profile_picture ? asset('storage/'.$student->profile_picture) : 'https://ui-avatars.com/api/?name='.urlencode($student->name).'&background=1d2b4b&color=fdb813' }}" 
                 alt="{{ $student->name }}"
                 loading="lazy">
            
            <div class="card-overlay">
                <div class="overlay-content">
                    <i class="fas fa-eye"></i>
                    <span>Quick View</span>
                </div>
            </div>
        </div>

        <div class="card-body">
            <h4 style="letter-spacing: -0.5px;">{{ $student->name }}</h4>
            
            <div class="course-badge-container">
                <span class="student-course">{{ $student->course ?? 'Pioneer Batch' }}</span>
            </div>
            
            <div class="card-footer-actions">
                <a href="{{ route('profile.view', $student->id) }}" class="view-link">
                    <span>View Full Profile</span>
                    <i class="fas fa-chevron-right"></i>
                </a>
            </div>
        </div>
    </div>
@empty
    <div id="noResults" class="empty-state-container">
        <div class="empty-state-icon">
            <i class="fas fa-user-ninja"></i>
        </div>
        <h3>Walang Nahanap, Lodi</h3>
        <p>Mukhang wala pa sa listahan ang hinahanap mo. Subukan mong i-check ang spelling o baguhin ang filter.</p>
        <button onclick="window.location.reload()" class="reset-search-btn">
            <i class="fas fa-redo-alt"></i> Reset Directory
        </button>
    </div>
@endforelse

<style>
    /* Tip: Kung gusto mo mas mabilis ang search, ilipat mo 'tong <style> 
       sa main directory.blade.php para hindi siya paulit-ulit nire-render ng AJAX.
    */

    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .course-badge-container {
        margin: 10px 0;
    }

    .student-course {
        background: rgba(63, 81, 181, 0.08);
        color: #3f51b5;
        display: inline-block;
        padding: 6px 15px;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    letter-spacing: 0.5px;
    }

    .card-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(29, 43, 75, 0.6);
        backdrop-filter: blur(3px); /* Glassmorphism effect */
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        color: white;
    }

    .overlay-content {
        text-align: center;
        transform: translateY(10px);
        transition: 0.4s;
    }

    .overlay-content i { font-size: 1.8rem; display: block; margin-bottom: 8px; }
    .overlay-content span { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }

    .student-card:hover .card-overlay { opacity: 1; }
    .student-card:hover .overlay-content { transform: translateY(0); }
    
    .card-footer-actions {
        margin-top: 15px;
        border-top: 1px solid rgba(0,0,0,0.05);
        padding-top: 20px;
    }

    /* Empty State / No Results Styling */
    .empty-state-container {
        grid-column: 1 / -1;
        text-align: center;
        padding: 80px 20px;
        background: white;
        border-radius: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.02);
    }

    .empty-state-icon {
        font-size: 4.5rem;
        color: rgba(29, 43, 75, 0.05);
        margin-bottom: 20px;
    }

    .reset-search-btn {
        margin-top: 25px;
        padding: 12px 30px;
        border-radius: 15px;
        border: 1px solid #eee;
        background: white;
        cursor: pointer;
        font-weight: 700;
        color: #1d2b4b;
        transition: 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }

    .reset-search-btn:hover {
        background: #1d2b4b;
        color: white;
        transform: translateY(-3px);
    }
</style>