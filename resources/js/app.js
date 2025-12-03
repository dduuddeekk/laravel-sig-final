import './bootstrap';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const map = L.map('map').setView([-8.409518, 115.188919], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.marker([-8.409518, 115.188919]).addTo(map)
    .bindPopup('Halo, ini project Laravel + Leaflet pertamaku!')
    .openPopup();