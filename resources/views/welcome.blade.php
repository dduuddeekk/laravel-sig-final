<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="api-token" content="{{ session('api_token') }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <title>Laravel Leaflet - Draw & Detect</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
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

    {{-- MODAL FORM INPUT DATA --}}
    <div id="formModal" class="modal-overlay hidden">
        <div class="modal-container">
            <div class="modal-header">
                <h3>Tambah Data Ruas Jalan</h3>
                <button id="closeModalBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="ruasJalanForm">
                    <input type="hidden" name="paths" id="inputPaths">
                    <input type="hidden" name="desa_id" id="inputDesaId">
                    <input type="hidden" name="panjang" id="inputPanjang">

                    <div class="form-group">
                        <label>Kode Ruas</label>
                        <input type="text" name="kode_ruas" class="form-control" required placeholder="Contoh: 001">
                    </div>

                    <div class="form-group">
                        <label>Nama Ruas</label>
                        <input type="text" name="nama_ruas" class="form-control" required placeholder="Contoh: Jl. Melati">
                    </div>
                    
                    <div class="form-group">
                        <label>Lebar (meter)</label>
                        <input type="number" name="lebar" class="form-control" required value="3">
                    </div>

                    <div class="form-group">
                        <label>Jenis Jalan</label>
                        <select name="jenisjalan_id" id="selectJenis" class="form-control" required>
                            <option value="">Loading...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Kondisi Jalan</label>
                        <select name="kondisi_id" id="selectKondisi" class="form-control" required>
                            <option value="">Loading...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Perkerasan Eksisting</label>
                        <select name="eksisting_id" id="selectEksisting" class="form-control" required>
                            <option value="">Loading...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Keterangan</label>
                        <textarea name="keterangan" class="form-control" rows="2"></textarea>
                    </div>

                    <button type="submit" class="btn-submit-form">Simpan Data</button>
                </form>
            </div>
        </div>
    </div>

    {{-- TOP RIGHT AUTH BUTTONS --}}
    <div class="top-right-bar">
        @if(session()->has('api_token') && isset($user))
            {{-- TAMPILAN JIKA SUDAH LOGIN --}}
            <div class="profile-container">
                <div class="profile-btn" id="profileBtn">
                    <i class="fa-solid fa-user"></i>
                </div>
                
                {{-- Dropdown Profile --}}
                <div id="dropdownData" class="profile-dropdown">
                    <div class="user-details">
                        <div class="user-avatar-large">
                            {{ substr($user['name'] ?? 'U', 0, 1) }}
                        </div>
                        <p class="user-name">{{ $user['name'] ?? 'User' }}</p>
                        <p class="user-email">{{ $user['email'] ?? '-' }}</p>
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
            {{-- TAMPILAN JIKA BELUM LOGIN --}}
            <a href="{{ route('login') }}" class="btn btn-login">Masuk</a>
            <a href="{{ route('register') }}" class="btn btn-register">Daftar</a>
        @endif
    </div>

    {{-- FAB DRAW BUTTON (Hanya muncul jika login) --}}
    @if(session()->has('api_token'))
    <div class="fab-container">
        <button id="drawBtn" class="fab-btn" title="Mulai Gambar"><i class="fa-solid fa-plus"></i></button>
    </div>
    @endif

    <div id="map"></div>
</body>
</html>