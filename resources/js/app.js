import './bootstrap';

// 1. Import Leaflet dan CSS-nya
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 2. Inisialisasi Peta
// Koordinat [-8.409518, 115.188919] adalah contoh (Bali). Ganti sesuai kebutuhan.
// Angka 13 adalah tingkat zoom awal.
const map = L.map('map').setView([-8.409518, 115.188919], 13);

// 3. Tambahkan Tile Layer (Peta Dasar)
// Kita menggunakan OpenStreetMap yang gratis
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// 4. (Opsional) Tambahkan Marker sederhana untuk tes
L.marker([-8.409518, 115.188919]).addTo(map)
    .bindPopup('Halo, ini project Laravel + Leaflet pertamaku!')
    .openPopup();