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

    @if (session()->has('api_token'))
        <button id="burgerBtn" class="burger-btn" title="Daftar Ruas Jalan">
            <i class="fa-solid fa-bars"></i>
        </button>

        <div id="leftSidebar" class="left-sidebar">
            <div class="ls-header">
                <h3 id="sidebarTitle"><i class="fa-solid fa-road"></i> Data Ruas Jalan</h3>
                <div id="closeLeftSidebar" class="close-ls-btn"><i class="fa-solid fa-xmark"></i></div>
            </div>

            <div id="listViewContainer">
                <div class="ls-search">
                    <input type="text" id="searchRoadInput" placeholder="Cari nama atau kode ruas...">
                </div>
                <ul id="roadListContainer" class="ls-list">
                    <li style="padding:15px; text-align:center; color:#999;">Memuat data...</li>
                </ul>
            </div>

            <div id="editFormContainer" class="edit-container hidden">
                <form id="editRuasForm">
                    <input type="hidden" name="id" id="editId">
                    <input type="hidden" name="desa_id" id="editDesaId">
                    <input type="hidden" name="panjang" id="editPanjang">
                    <input type="hidden" name="lebar" id="editLebar">

                    <div class="form-group">
                        <label>Enkripsi Path</label>
                        <input type="text" name="paths" id="editPaths" class="form-control" readonly
                            style="background: #e9ecef; color: #666; font-size: 11px; font-family: monospace;">
                    </div>

                    <div class="form-group">
                        <label>Kode Ruas</label>
                        <input type="text" name="kode_ruas" id="editKodeRuas" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label>Nama Ruas</label>
                        <input type="text" name="nama_ruas" id="editNamaRuas" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label>Lebar (meter)</label>
                        <input type="text" id="editDisplayLebar" class="form-control" readonly style="background: #f3f4f6;">
                        <small style="color:#666; font-size:11px;">*Tarik handle biru di peta untuk ubah</small>
                    </div>

                    <div class="form-group">
                        <label>Jenis Jalan</label>
                        <select name="jenisjalan_id" id="editSelectJenis" class="form-control" required></select>
                    </div>

                    <div class="form-group">
                        <label>Kondisi Jalan</label>
                        <select name="kondisi_id" id="editSelectKondisi" class="form-control" required></select>
                    </div>

                    <div class="form-group">
                        <label>Perkerasan Eksisting</label>
                        <select name="eksisting_id" id="editSelectEksisting" class="form-control" required></select>
                    </div>

                    <div class="form-group">
                        <label>Keterangan</label>
                        <textarea name="keterangan" id="editKeterangan" class="form-control" rows="2"></textarea>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" id="btnCancelEdit" class="btn-action btn-cancel">Batal</button>
                        <button type="submit" class="btn-action btn-save">Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
    @endif

    <div id="resultSidebar" class="sidebar-result">
        <div class="sidebar-header">
            <h3><i class="fa-solid fa-map-location-dot"></i> Detail Lokasi</h3>
            <div class="close-sidebar" id="closeSidebarBtn"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="sidebar-content" id="sidebarContent">
            <div class="empty-state">Belum ada data. Silakan gambar jalan.</div>
        </div>
    </div>

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
                    <input type="hidden" name="lebar" id="inputLebar" value="5">
                    
                    <div class="form-group"><label>Kode Ruas</label><input type="text" name="kode_ruas" class="form-control" required></div>
                    <div class="form-group"><label>Nama Ruas</label><input type="text" name="nama_ruas" class="form-control" required></div>
                    <div class="form-group"><label>Lebar (meter)</label><input type="text" id="displayLebar" class="form-control" readonly value="5"></div>
                    
                    <div class="form-group"><label>Jenis Jalan</label><select name="jenisjalan_id" id="selectJenis" class="form-control" required></select></div>
                    <div class="form-group"><label>Kondisi Jalan</label><select name="kondisi_id" id="selectKondisi" class="form-control" required></select></div>
                    <div class="form-group"><label>Perkerasan Eksisting</label><select name="eksisting_id" id="selectEksisting" class="form-control" required></select></div>
                    
                    <div class="form-group"><label>Keterangan</label><textarea name="keterangan" class="form-control" rows="2"></textarea></div>
                    
                    <button type="submit" class="btn-submit-form">Simpan Data</button>
                </form>
            </div>
        </div>
    </div>

    <div class="top-right-bar">
        @if (session()->has('api_token') && isset($user))
            <div class="profile-container">
                <div class="profile-btn" id="profileBtn"><i class="fa-solid fa-user"></i></div>
                <div id="dropdownData" class="profile-dropdown">
                    <div class="user-details">
                        <div class="user-avatar-large">{{ substr($user['name'] ?? 'U', 0, 1) }}</div>
                        <p class="user-name">{{ $user['name'] ?? 'User' }}</p>
                        <p class="user-email">{{ $user['email'] ?? '-' }}</p>
                    </div>
                    <form action="{{ route('logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="btn-logout">Keluar</button>
                    </form>
                </div>
            </div>
        @else
            <a href="{{ route('login') }}" class="btn btn-login">Masuk</a>
            <a href="{{ route('register') }}" class="btn btn-register">Daftar</a>
        @endif
    </div>

    @if (session()->has('api_token'))
        <div class="fab-container">
            <button id="drawBtn" class="fab-btn" title="Mulai Gambar"><i class="fa-solid fa-plus"></i></button>
        </div>
    @endif

    <div id="map"></div>
</body>

</html>