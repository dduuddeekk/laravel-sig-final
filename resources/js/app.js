import './bootstrap';

// --- 1. IMPORT LIBRARY ---
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import * as turf from '@turf/turf';

// --- 2. FIX ICON MARKER ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: import.meta.glob('leaflet/dist/images/marker-icon-2x.png', { as: 'url', eager: true }),
    iconUrl: import.meta.glob('leaflet/dist/images/marker-icon.png', { as: 'url', eager: true }),
    shadowUrl: import.meta.glob('leaflet/dist/images/marker-shadow.png', { as: 'url', eager: true }),
});

// --- 3. LOGIKA UTAMA ---
document.addEventListener('DOMContentLoaded', () => {
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // A. INISIALISASI MAP
    const map = L.map('map', { zoomControl: false }).setView([-8.409518, 115.188919], 9);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'OpenStreetMap'
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // B. SETUP VARIABEL
    let isDrawing = false;
    let baliGeoJSON = null; 
    let currentLayer = null; // <--- MENYIMPAN LAYER YANG BARU DIGAMBAR

    const loading = document.getElementById('loading');
    const drawBtn = document.getElementById('drawBtn');
    const sidebar = document.getElementById('resultSidebar');
    const sidebarContent = document.getElementById('sidebarContent');

    // C. LOAD GEOJSON (MEMORY ONLY)
    if (loading) loading.style.display = 'block';
    
    fetch('/geojson/bali_complete_universal.geojson')
        .then(res => res.json())
        .then(data => {
            baliGeoJSON = data; 
            if (loading) loading.style.display = 'none';
        })
        .catch(err => {
            console.error(err);
            if (loading) loading.innerHTML = "Gagal memuat data wilayah.";
        });

    // D. SETUP DRAW TOOLS
    const drawHandler = new L.Draw.Polyline(map, {
        shapeOptions: {
            color: '#f357a1',
            weight: 5,
            opacity: 0.8
        },
        icon: new L.DivIcon({ 
            iconSize: new L.Point(10, 10), 
            className: 'leaflet-div-icon leaflet-editing-icon' 
        }),
        touchIcon: new L.DivIcon({
            iconSize: new L.Point(10, 10), 
            className: 'leaflet-div-icon leaflet-editing-icon' 
        })
    });

    // E. LOGIC TOMBOL FAB (+)
    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            if (!isDrawing) {
                // START DRAW
                drawHandler.enable();
                isDrawing = true;
                drawBtn.classList.add('active');
                drawBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                
                if(sidebar) sidebar.classList.remove("open");

                // Bersihkan gambar sebelumnya jika user klik tombol tambah lagi
                drawnItems.clearLayers(); 

            } else {
                // CANCEL DRAW
                drawHandler.disable();
                isDrawing = false;
                drawBtn.classList.remove('active');
                drawBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
            }
        });
    }

    // F. SAAT SELESAI GAMBAR
    map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        
        // Simpan layer ke variabel global agar bisa dihapus tombol "Hapus"
        currentLayer = layer; 
        
        drawnItems.addLayer(layer);

        // Reset tombol UI
        isDrawing = false;
        if (drawBtn) {
            drawBtn.classList.remove('active');
            drawBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        }

        // Jalankan Deteksi
        const drawnGeoJSON = layer.toGeoJSON();
        detectRegion(drawnGeoJSON);
    });

    // G. FUNGSI DETEKSI
    function detectRegion(roadGeoJSON) {
        if (!baliGeoJSON) {
            alert("Data wilayah sedang dimuat..."); return;
        }

        const results = {
            provinsi: new Set(), kabupaten: new Set(), kecamatan: new Set(), desa: new Set()
        };

        baliGeoJSON.features.forEach((feature) => {
            let isIntersect = false;
            try { 
                isIntersect = turf.booleanIntersects(roadGeoJSON, feature); 
            } catch (e) { console.warn(e); }

            if (isIntersect) {
                const p = feature.properties;
                if (p.level === 'desa') results.desa.add(p.name);
                else if (p.level === 'kecamatan') results.kecamatan.add(p.name);
                else if (p.level === 'kabupaten') results.kabupaten.add(p.name);
                results.provinsi.add("Bali");
            }
        });

        // Simpan hasil deteksi sementara di object layer (opsional, untuk dikirim nanti)
        // roadGeoJSON.properties = { detected_regions: results };

        renderSidebar(results, roadGeoJSON);
    }

    // H. RENDER HASIL & TOMBOL AKSI
    function renderSidebar(results, geojsonData) {
        let html = '';
        const item = (label, set) => {
            const arr = Array.from(set);
            const val = arr.length > 0 ? arr.join(", ") : "-";
            return `<div class="result-group">
                        <div class="result-label">${label}</div>
                        <div class="result-value">${val}</div>
                    </div>`;
        };

        html += item("Provinsi", results.provinsi);
        html += item("Kabupaten / Kota", results.kabupaten);
        html += item("Kecamatan", results.kecamatan);
        html += item("Desa / Kelurahan", results.desa);

        // --- TAMBAHAN: TOMBOL AKSI ---
        html += `
            <div class="sidebar-actions">
                <button id="btnCancelResult" class="btn-action btn-cancel">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
                <button id="btnSaveResult" class="btn-action btn-save">
                    <i class="fa-solid fa-floppy-disk"></i> Simpan
                </button>
            </div>
        `;

        if (sidebarContent) {
            sidebarContent.innerHTML = html;
            
            // --- EVENT LISTENER TOMBOL HAPUS ---
            document.getElementById('btnCancelResult').addEventListener('click', () => {
                // 1. Hapus layer dari peta
                if (currentLayer) {
                    drawnItems.removeLayer(currentLayer);
                    currentLayer = null;
                }
                // 2. Tutup sidebar
                sidebar.classList.remove('open');
            });

            // --- EVENT LISTENER TOMBOL SIMPAN ---
            document.getElementById('btnSaveResult').addEventListener('click', () => {
                // Di sini nanti logika kirim ke Backend (AJAX/Fetch)
                console.log("Data Geometri:", JSON.stringify(geojsonData));
                console.log("Data Wilayah:", results);
                
                alert("Tombol Simpan ditekan! Data sudah siap dikirim (Cek Console).");
            });
        }

        if (sidebar) sidebar.classList.add('open');
    }

    // I. EVENT HANDLER LAINNYA
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById("dropdownData").classList.toggle("show");
        });
    }

    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove("open");
        });
    }

    window.onclick = (event) => {
        if (!event.target.closest('.profile-container')) {
            const dropdown = document.getElementById("dropdownData");
            if (dropdown && dropdown.classList.contains('show')) dropdown.classList.remove('show');
        }
    };
});