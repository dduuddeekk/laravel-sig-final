<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Leaflet - Draw & Detect</title>
    
    {{-- Vite me-load CSS & JS yang baru kita buat --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    {{-- Font Awesome (Boleh CDN atau NPM, CDN lebih simpel untuk icon) --}}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <div id="loading">Sedang memproses data wilayah...</div>

    {{-- SIDEBAR RESULT --}}
    <div id="resultSidebar" class="sidebar-result">
        <div class="sidebar-header">
            <h3><i class="fa-solid fa-map-location-dot"></i> Detail Lokasi</h3>
            <div class="close-sidebar" id="closeSidebarBtn"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="sidebar-content" id="sidebarContent">
            <div class="empty-state">Belum ada data. Silakan gambar jalan.</div>
        </div>
    </div>

    {{-- AUTH BUTTONS --}}
    <div class="top-right-bar">
        @if(session()->has('api_token') && isset($user))
            <div class="profile-container">
                <div class="profile-btn" id="profileBtn">
                    <i class="fa-solid fa-user"></i>
                </div>
                <div id="dropdownData" class="profile-dropdown">
                    <div class="user-details">
                        <div class="user-avatar-large">
                            {{ substr($user['name'], 0, 1) }}
                        </div>
                        <p class="user-name">{{ $user['name'] }}</p>
                        <p class="user-email">{{ $user['email'] }}</p>
                    </div>
                    <form action="{{ route('logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="btn-logout">
                            <i class="fa-solid fa-right-from-bracket"></i> Keluar
                        </button>
                    </form>
                </div>
            </div>
        @else
            <a href="{{ route('login') }}" class="btn btn-login">Masuk</a>
            <a href="{{ route('register') }}" class="btn btn-register">Daftar</a>
        @endif
    </div>

    {{-- FAB DRAW BUTTON --}}
    @if(session()->has('api_token') && isset($user))
    <div class="fab-container">
        <button id="drawBtn" class="fab-btn" title="Mulai Gambar Jalan">
            <i class="fa-solid fa-plus"></i>
        </button>
    </div>
    @endif

    {{-- CONTAINER MAP --}}
    <div id="map"></div>

</body>
</html>