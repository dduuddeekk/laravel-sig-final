import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function initMap() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: import.meta.glob('leaflet/dist/images/marker-icon-2x.png', { as: 'url', eager: true }),
        iconUrl: import.meta.glob('leaflet/dist/images/marker-icon.png', { as: 'url', eager: true }),
        shadowUrl: import.meta.glob('leaflet/dist/images/marker-shadow.png', { as: 'url', eager: true }),
    });

    const mapElement = document.getElementById('map');
    if (!mapElement) return null;

    const map = L.map('map', { zoomControl: false }).setView([-8.409518, 115.188919], 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: 'OpenStreetMap' }).addTo(map);

    const drawnItems = new L.FeatureGroup(); 
    map.addLayer(drawnItems);
    
    const roadLayerGroup = L.layerGroup().addTo(map); 

    return { map, drawnItems, roadLayerGroup };
}