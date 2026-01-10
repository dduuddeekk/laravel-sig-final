import './bootstrap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';

function encodePolyline(coordinates) {
    let str = '';
    let lastLat = 0, lastLng = 0;

    for (const point of coordinates) {
        let lat = point[1]; 
        let lng = point[0];

        let latE5 = Math.round(lat * 1e5);
        let lngE5 = Math.round(lng * 1e5);

        let dLat = latE5 - lastLat;
        let dLng = lngE5 - lastLng;

        lastLat = latE5;
        lastLng = lngE5;

        str += encodeSigned(dLat) + encodeSigned(dLng);
    }
    return str;
}

function encodeSigned(v) {
    v = v < 0 ? ~(v << 1) : (v << 1);
    return encodeNumber(v);
}

function encodeNumber(v) {
    let str = '';
    while (v >= 0x20) {
        str += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
        v >>= 5;
    }
    str += String.fromCharCode(v + 63);
    return str;
}

document.addEventListener('DOMContentLoaded', () => {
    
    const apiToken = document.querySelector('meta[name="api-token"]')?.getAttribute('content');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'); 
    const mapElement = document.getElementById('map');
    
    if (!mapElement) return;

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiToken}`
    };

    // --- LOAD DROPDOWN ---
    if(apiToken) {
        loadDropdown('/mjenisjalan', 'selectJenis', 'id', 'jenisjalan', 'eksisting'); 
        loadDropdown('/mkondisi', 'selectKondisi', 'id', 'kondisi', 'eksisting');
        loadDropdown('/meksisting', 'selectEksisting', 'id', 'eksisting', 'eksisting');
    }

    function loadDropdown(url, elementId, valueKey, textKey, responseKey) {
        fetch(url, { headers })
        .then(res => res.json())
        .then(data => {
            let items = [];
            if (responseKey && data[responseKey]) {
                items = data[responseKey];
            } else if (data.data) {
                items = data.data;
            } else if (Array.isArray(data)) {
                items = data;
            }

            const select = document.getElementById(elementId);
            if(select) {
                select.innerHTML = '<option value="">Pilih...</option>';
                if(Array.isArray(items)) {
                    items.forEach(item => {
                        const text = item[textKey] || item['nama'] || item['keterangan'] || '-';
                        select.innerHTML += `<option value="${item[valueKey]}">${text}</option>`;
                    });
                }
            }
        })
        .catch(err => console.error(`Gagal load ${url}:`, err));
    }

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: import.meta.glob('leaflet/dist/images/marker-icon-2x.png', { as: 'url', eager: true }),
        iconUrl: import.meta.glob('leaflet/dist/images/marker-icon.png', { as: 'url', eager: true }),
        shadowUrl: import.meta.glob('leaflet/dist/images/marker-shadow.png', { as: 'url', eager: true }),
    });

    const map = L.map('map', { zoomControl: false }).setView([-8.409518, 115.188919], 9);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'OpenStreetMap'
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    let isDrawing = false;
    let baliGeoJSON = null; 
    let currentLayer = null; 
    let currentDetectedDesaId = null;

    const loading = document.getElementById('loading');
    const drawBtn = document.getElementById('drawBtn');
    const sidebar = document.getElementById('resultSidebar');
    const sidebarContent = document.getElementById('sidebarContent');
    const formModal = document.getElementById('formModal');
    const form = document.getElementById('ruasJalanForm');

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

    const drawHandler = new L.Draw.Polyline(map, {
        shapeOptions: { color: '#f357a1', weight: 5, opacity: 0.8 },
        icon: new L.DivIcon({ iconSize: new L.Point(10, 10), className: 'leaflet-div-icon leaflet-editing-icon' }),
        touchIcon: new L.DivIcon({ iconSize: new L.Point(10, 10), className: 'leaflet-div-icon leaflet-editing-icon' })
    });

    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            if (!isDrawing) {
                drawHandler.enable();
                isDrawing = true;
                drawBtn.classList.add('active');
                drawBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                
                if(sidebar) sidebar.classList.remove("open");
                drawnItems.clearLayers(); 
            } else {
                drawHandler.disable();
                isDrawing = false;
                drawBtn.classList.remove('active');
                drawBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
            }
        });
    }

    map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        currentLayer = layer; 
        drawnItems.addLayer(layer);

        isDrawing = false;
        if (drawBtn) {
            drawBtn.classList.remove('active');
            drawBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        }

        const drawnGeoJSON = layer.toGeoJSON();
        
        const lengthKm = turf.length(drawnGeoJSON, {units: 'kilometers'});
        const lengthM = Math.round(lengthKm * 1000);
        
        const inputPanjang = document.getElementById('inputPanjang');
        if(inputPanjang) inputPanjang.value = lengthM;

        detectRegion(drawnGeoJSON);
    });

    function detectRegion(roadGeoJSON) {
        if (!baliGeoJSON) {
            alert("Data wilayah sedang dimuat..."); return;
        }

        const results = {
            provinsi: new Set(), kabupaten: new Set(), kecamatan: new Set(), desa: new Set()
        };

        currentDetectedDesaId = null;

        baliGeoJSON.features.forEach((feature) => {
            let isIntersect = false;
            try { isIntersect = turf.booleanIntersects(roadGeoJSON, feature); } catch (e) {}

            if (isIntersect) {
                const p = feature.properties;
                if (p.level === 'desa') {
                    results.desa.add(p.name);
                    if(!currentDetectedDesaId && p.id) currentDetectedDesaId = p.id;
                }
                else if (p.level === 'kecamatan') results.kecamatan.add(p.name);
                else if (p.level === 'kabupaten') results.kabupaten.add(p.name);
                results.provinsi.add("Bali");
            }
        });

        const inputDesaId = document.getElementById('inputDesaId');
        if(inputDesaId) {
            inputDesaId.value = currentDetectedDesaId || "";
        }

        renderSidebar(results, roadGeoJSON);
    }

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

        html += `
            <div class="sidebar-actions">
                <button id="btnCancelResult" class="btn-action btn-cancel">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
                <button id="btnSaveResult" class="btn-action btn-save">
                    <i class="fa-solid fa-floppy-disk"></i> Lanjut Simpan
                </button>
            </div>
        `;

        if (sidebarContent) {
            sidebarContent.innerHTML = html;
            
            document.getElementById('btnCancelResult').addEventListener('click', () => {
                if (currentLayer) {
                    drawnItems.removeLayer(currentLayer);
                    currentLayer = null;
                }
                sidebar.classList.remove('open');
            });

            document.getElementById('btnSaveResult').addEventListener('click', () => {
                const coords = geojsonData.geometry.coordinates;
                const encodedPath = encodePolyline(coords);
                
                const inputPaths = document.getElementById('inputPaths');
                if(inputPaths) inputPaths.value = encodedPath;

                if(!currentDetectedDesaId) {
                    alert("Wilayah desa tidak terdeteksi. Pastikan menggambar di dalam area yang valid.");
                    return;
                }
                
                formModal.classList.remove('hidden');
            });
        }
        if (sidebar) sidebar.classList.add('open');
    }

    const closeModalBtn = document.getElementById('closeModalBtn');
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            formModal.classList.add('hidden');
        });
    }

    // --- BAGIAN SUBMIT FORM DENGAN PREVIEW JSON ---
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if(!apiToken) { alert("Sesi kadaluarsa, silakan login kembali."); return; }

            // 1. Ambil data form
            const formData = new FormData(form);
            
            // 2. Konversi FormData ke Object biasa agar bisa dijadikan JSON String
            const dataObj = {};
            formData.forEach((value, key) => (dataObj[key] = value));

            // 3. Tampilkan Confirm Dialog dengan Preview JSON
            const userConfirmed = confirm(
                "PREVIEW DATA YANG AKAN DIKIRIM:\n\n" + 
                JSON.stringify(dataObj, null, 2) + 
                "\n\nLanjutkan simpan?"
            );

            // 4. Jika user klik Cancel, batalkan proses
            if (!userConfirmed) {
                return;
            }

            // 5. Jika OK, Lanjut kirim ke Server
            const btnSubmit = form.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerText;
            
            btnSubmit.innerText = "Menyimpan...";
            btnSubmit.disabled = true;

            fetch('/ruasjalan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if(data.status === 'error' || data.message) {
                     alert("Gagal: " + (data.message || JSON.stringify(data)));
                } else {
                    alert("Berhasil menyimpan data Ruas Jalan!");
                    formModal.classList.add('hidden');
                    sidebar.classList.remove('open');
                    drawnItems.clearLayers();
                    form.reset();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan sistem.");
            })
            .finally(() => {
                btnSubmit.innerText = originalText;
                btnSubmit.disabled = false;
            });
        });
    }

    // --- PROFILE & SIDEBAR UI ---
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