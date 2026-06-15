@extends('layouts.auth') {{-- Siguraduhing may auth layout ka na nag-loload ng Bootstrap & FontAwesome --}}

@section('title', 'Admin Portal | NU Lipa Yearbook')

@section('content')
<style>
    /** Specific styling to match the Figma prototype
     * hortalezarp's team library design 
     */
    
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
        background-color: #E5E5E5; /* Light grey background from Figma */
        font-family: 'Inter', sans-serif;
    }

    .nu-admin-card {
        background: #ffffff;
        border-radius: 20px; /* Precise rounded corners */
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); /* Soft, premium shadow */
        padding: 50px 40px;
        width: 100%;
        max-width: 420px; /* Matching the card width in Figma */
        border: 1px solid #f0f0f0;
    }

    /* specific NU Lipa Blue */
    .nu-blue {
        color: #3F51B5;
    }

    /* Warning banner style from Figma */
    .security-notice-banner {
        background-color: #FFF8E1; /* Light yellow bg */
        border: 1px solid #FFE082; /* Muted yellow border */
        color: #856404; /* Dark yellow text */
        font-size: 0.75rem; /* Small font size as requested */
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 30px;
        display: flex;
        align-items: start;
        gap: 10px;
    }

    /* Labels styling to match design */
    .form-label-premium {
        font-size: 0.8rem;
        font-weight: 700;
        color: #555;
        text-transform: uppercase; /* Matching Figma's casing */
        letter-spacing: 0.5px;
        margin-bottom: 8px;
    }

    /* Form input fields with iconography */
    .form-control-nu {
        border-radius: 12px !important; /* Perfect rounded pill style */
        padding: 14px 20px 14px 50px !important; /* Spacing for the left icon */
        border: 1px solid #e0e0e0 !important;
        font-weight: 500;
        color: #333;
        transition: 0.3s;
    }

    .form-control-nu:focus {
        border-color: #3F51B5 !important;
        box-shadow: 0 0 0 4px rgba(63, 81, 181, 0.1) !important;
    }

    /* Wrapper for input group to position icons */
    .input-icon-group {
        position: relative;
    }

    .input-icon-wrapper {
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
        z-index: 10;
        font-size: 1rem;
    }

    /* The "Secure Login" button specific to the Figma layout */
    .btn-nu-secure {
        background-color: #3F51B5; /* The specific blue color code */
        border: none;
        border-radius: 12px;
        padding: 15px;
        font-weight: 700;
        color: white;
        transition: 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(63, 81, 181, 0.2);
    }

    .btn-nu-secure:hover {
        background-color: #303F9F;
        transform: translateY(-2px);
    }

    .footer-links {
        color: #888;
        font-size: 0.8rem;
        text-decoration: none;
        transition: 0.3s;
    }

    .footer-links:hover {
        color: #3F51B5;
    }

</style>

<div class="d-flex justify-content-center align-items-center vh-100">
    <div class="nu-admin-card animate__animated animate__zoomIn">
        
        <div class="text-center mb-4">
            <h3 class="fw-bold m-0" style="color: #333;">Admin Portal</h3>
            <p class="text-muted small">NU Lipa Digital Yearbook System</p>
        </div>

        <div class="security-notice-banner">
            <i class="fas fa-exclamation-triangle fa-lg mt-1"></i>
            <div>
                <strong>Security Notice:</strong> <br>
                This system is monitored. Unauthorized access attempts are logged and may be reported.
            </div>
        </div>

        <form action="{{ route('admin.login.submit') }}" method="POST">
            @csrf
            
            <div class="mb-3">
                <label class="form-label-premium">Admin Username</label>
                <div class="input-icon-group">
                    <div class="input-icon-wrapper">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <input type="text" name="username" class="form-control form-control-nu" placeholder="Enter username" required>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label-premium">Password</label>
                <div class="input-icon-group">
                    <div class="input-icon-wrapper">
                        <i class="fas fa-lock"></i>
                    </div>
                    <input type="password" name="password" class="form-control form-control-nu" placeholder="••••••••" required>
                </div>
            </div>

            <button type="submit" class="btn btn-nu-secure w-100 mb-3">
                <i class="fas fa-shield-alt"></i> SECURE LOGIN
            </button>

            <div class="text-center">
                <a href="#" class="footer-links">Forgot Password?</a>
            </div>
        </form>
    </div>
</div>
@endsection
