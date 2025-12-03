<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Leaflet Map</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; }
        #map { height: 100vh; width: 100%; z-index: 1; }

        /* --- Style Interface Pojok Kanan Atas --- */
        .top-right-bar {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Tombol Auth (Login/Register) */
        .btn {
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 30px; /* Rounded pill shape */
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: transform 0.1s;
        }
        .btn:active { transform: scale(0.95); }
        .btn-login { background-color: #ffffff; color: #3b82f6; }
        .btn-register { background-color: #3b82f6; color: white; }

        /* --- Style Profil & Dropdown --- */
        .profile-container {
            position: relative; /* Agar dropdown absolute relatif terhadap ini */
        }

        .profile-btn {
            width: 45px;
            height: 45px;
            background-color: white;
            border-radius: 50%; /* Lingkaran */
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            border: 2px solid #3b82f6;
            color: #3b82f6;
            font-size: 20px;
            transition: background 0.2s;
        }
        
        .profile-btn:hover { background-color: #f0f9ff; }

        /* Menu Dropdown */
        .profile-dropdown {
            display: none; /* Default sembunyi */
            position: absolute;
            top: 55px; /* Jarak dari tombol profil */
            right: 0;
            background: white;
            width: 250px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            padding: 15px;
            overflow: hidden;
            animation: fadeIn 0.2s ease-in-out;
        }

        .profile-dropdown.show { display: block; }

        /* Isi Dropdown */
        .user-details {
            text-align: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }
        .user-avatar-large {
            width: 60px;
            height: 60px;
            background-color: #e0e7ff;
            color: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin: 0 auto 10px auto;
        }
        .user-name { font-weight: bold; font-size: 16px; color: #333; margin: 0; }
        .user-email { font-size: 13px; color: #666; margin: 5px 0 0 0; }

        .btn-logout {
            display: block;
            width: 100%;
            background-color: #fee2e2;
            color: #ef4444;
            text-align: center;
            padding: 8px 0;
            border-radius: 6px;
            font-weight: bold;
            border: none;
            cursor: pointer;
        }
        .btn-logout:hover { background-color: #fecaca; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <div class="top-right-bar">
        
        @if(session()->has('api_token') && isset($user))
            <div class="profile-container">
                <div class="profile-btn" onclick="toggleDropdown()">
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

    <div id="map"></div>

    <script>
        function toggleDropdown() {
            var dropdown = document.getElementById("dropdownData");
            dropdown.classList.toggle("show");
        }

        // Tutup dropdown jika klik di luar area profil
        window.onclick = function(event) {
            if (!event.target.closest('.profile-container')) {
                var dropdown = document.getElementById("dropdownData");
                if (dropdown && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
        }
    </script>
</body>
</html>