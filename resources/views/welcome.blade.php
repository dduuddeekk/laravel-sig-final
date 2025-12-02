<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Leaflet Map</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        #map { height: 100vh; width: 100%; z-index: 1; }
        
        /* Interface Tombol Overlay */
        .auth-buttons {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000; /* Harus lebih besar dari z-index map */
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .btn {
            text-decoration: none;
            padding: 8px 15px;
            border-radius: 4px;
            font-family: sans-serif;
            font-weight: bold;
            font-size: 14px;
            margin-left: 5px;
            cursor: pointer;
            border: none;
        }
        .btn-login { background-color: #3b82f6; color: white; }
        .btn-register { background-color: #10b981; color: white; }
        .btn-logout { background-color: #ef4444; color: white; }
        
        .user-info {
            font-family: sans-serif;
            margin-right: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    
    <div class="auth-buttons">
        @if(session()->has('api_token'))
            <span class="user-info">Halo, {{ session('user_email') }}</span>
            <form action="{{ route('logout') }}" method="POST" style="display:inline;">
                @csrf
                <button type="submit" class="btn btn-logout">Keluar</button>
            </form>
        @else
            <a href="{{ route('login') }}" class="btn btn-login">Masuk</a>
            <a href="{{ route('register') }}" class="btn btn-register">Daftar</a>
        @endif
    </div>

    <div id="map"></div>
</body>
</html>