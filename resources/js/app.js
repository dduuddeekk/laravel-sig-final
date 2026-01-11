import './bootstrap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';

// ============================================================
// 1. HELPER FUNCTIONS (Encode/Decode)
// ============================================================

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

function decodePolyline(encoded) {
    if (!encoded) return [];
    var poly = [];
    var index = 0, len = encoded.length;
    var lat = 0, lng = 0;

    while (index < len) {
        var b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        var p = [lat / 1e5, lng / 1e5];
        poly.push(p);
    }
    return poly;
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

    // ============================================================
    // 2. LOAD DROPDOWN DATA
    // ============================================================
    if(apiToken) {
        loadDropdown('/mjenisjalan', 'selectJenis', 'id', 'jenisjalan', 'eksisting'); 
        loadDropdown('/mkondisi', 'selectKondisi', 'id', 'kondisi', 'eksisting');
        loadDropdown('/meksisting', 'selectEksisting', 'id', 'eksisting', 'eksisting');

        loadDropdown('/mjenisjalan', 'editSelectJenis', 'id', 'jenisjalan', 'eksisting'); 
        loadDropdown('/mkondisi', 'editSelectKondisi', 'id', 'kondisi', 'eksisting');
        loadDropdown('/meksisting', 'editSelectEksisting', 'id', 'eksisting', 'eksisting');
    }

    function loadDropdown(url, elementId, valueKey, textKey, responseKey) {
        fetch(url, { headers })
        .then(res => res.json())
        .then(data => {
            let items = [];
            if (responseKey && data[responseKey]) items = data[responseKey];
            else if (data.data) items = data.data;
            else if (Array.isArray(data)) items = data;

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

    // ============================================================
    // 3. INITIALIZE MAP & LAYERS
    // ============================================================
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: import.meta.glob('leaflet/dist/images/marker-icon-2x.png', { as: 'url', eager: true }),
        iconUrl: import.meta.glob('leaflet/dist/images/marker-icon.png', { as: 'url', eager: true }),
        shadowUrl: import.meta.glob('leaflet/dist/images/marker-shadow.png', { as: 'url', eager: true }),
    });

    const map = L.map('map', { zoomControl: false }).setView([-8.409518, 115.188919], 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: 'OpenStreetMap' }).addTo(map);

    const drawnItems = new L.FeatureGroup(); 
    map.addLayer(drawnItems);
    
    const roadLayerGroup = L.layerGroup().addTo(map); 

    // ============================================================
    // 4. STATE VARIABLES
    // ============================================================
    let isDrawing = false;
    let isEditing = false;
    let baliGeoJSON = null; 
    let currentLayer = null;        
    let currentWidthHandle = null;  
    let currentWidth = 5; 
    let currentDetectedDesaId = null;
    let allRoadsData = []; 

    const loading = document.getElementById('loading');
    const drawBtn = document.getElementById('drawBtn');
    const sidebar = document.getElementById('resultSidebar');
    const sidebarContent = document.getElementById('sidebarContent');
    const formModal = document.getElementById('formModal');
    const form = document.getElementById('ruasJalanForm'); 

    const burgerBtn = document.getElementById('burgerBtn');
    const leftSidebar = document.getElementById('leftSidebar');
    const closeLeftSidebar = document.getElementById('closeLeftSidebar');
    const listViewContainer = document.getElementById('listViewContainer');
    const editFormContainer = document.getElementById('editFormContainer');
    const sidebarTitle = document.getElementById('sidebarTitle');
    
    // ============================================================
    // 5. SIDEBAR LOGIC
    // ============================================================
    if (burgerBtn && leftSidebar) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exitEditMode(); 
            leftSidebar.classList.add('active');
            
            // Selalu fetch ulang data biar tidak kena cache
            fetchRoadsData();
        });

        closeLeftSidebar.addEventListener('click', () => {
            leftSidebar.classList.remove('active');
            roadLayerGroup.clearLayers(); 
            drawnItems.clearLayers();
            if(currentWidthHandle) map.removeLayer(currentWidthHandle);
        });
    }

    // ============================================================
    // 6. FETCH & RENDER DATA (ANTI CACHE)
    // ============================================================
    function fetchRoadsData() {
        const roadListContainer = document.getElementById('roadListContainer');
        roadListContainer.innerHTML = '<li style="padding:15px; text-align:center; color:#777;">Mengambil data...</li>';
        
        // TAMBAHKAN TIMESTAMP AGAR BROWSER TIDAK MENGAMBIL DARI CACHE LOKAL
        const timestamp = new Date().getTime();
        fetch(`/ruasjalan?t=${timestamp}`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && Array.isArray(data.ruasjalan)) {
                    allRoadsData = data.ruasjalan;
                    renderRoadList(allRoadsData);
                    displayAllRoads(allRoadsData);
                } else {
                    roadListContainer.innerHTML = '<li style="padding:15px; text-align:center; color:red;">Gagal memuat data.</li>';
                }
            })
            .catch(err => {
                console.error(err);
                roadListContainer.innerHTML = '<li style="padding:15px; text-align:center; color:red;">Terjadi kesalahan server.</li>';
            });
    }

    function renderRoadList(data) {
        const roadListContainer = document.getElementById('roadListContainer');
        roadListContainer.innerHTML = '';
        
        if (data.length === 0) {
            roadListContainer.innerHTML = '<li style="padding:15px; text-align:center;">Tidak ada data ditemukan.</li>';
            return;
        }

        data.forEach(road => {
            const li = document.createElement('li');
            li.className = 'road-item';
            li.innerHTML = `
                <h4>${road.nama_ruas}</h4>
                <div style="font-size: 0.8rem; color:#666;">
                    <span>${road.kode_ruas}</span> • <span>L: ${road.lebar}m</span>
                </div>
                <div class="road-actions">
                    <button class="btn-icon btn-edit" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon delete" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            li.addEventListener('click', (e) => {
                if(!e.target.closest('.btn-icon')) {
                   showRoadOnMap(road);
                }
            });

            const editBtn = li.querySelector('.btn-edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                enterEditMode(road);
            });

            const delBtn = li.querySelector('.delete');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert("Fitur hapus belum diimplementasikan.");
            });

            roadListContainer.appendChild(li);
        });
    }

    const searchRoadInput = document.getElementById('searchRoadInput');
    if(searchRoadInput) {
        searchRoadInput.addEventListener('keyup', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = allRoadsData.filter(item => 
                item.nama_ruas.toLowerCase().includes(keyword) || 
                item.kode_ruas.toLowerCase().includes(keyword)
            );
            renderRoadList(filtered);
        });
    }

    // ============================================================
    // 7. EDIT MODE LOGIC
    // ============================================================
    function enterEditMode(roadData) {
        isEditing = true;
        
        listViewContainer.classList.add('hidden');
        editFormContainer.classList.remove('hidden');
        sidebarTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Ruas Jalan';

        document.getElementById('editId').value = roadData.id;
        document.getElementById('editPaths').value = roadData.paths;
        document.getElementById('editKodeRuas').value = roadData.kode_ruas;
        document.getElementById('editNamaRuas').value = roadData.nama_ruas;
        document.getElementById('editDesaId').value = roadData.desa_id;
        document.getElementById('editPanjang').value = roadData.panjang;
        document.getElementById('editLebar').value = roadData.lebar;
        document.getElementById('editDisplayLebar').value = roadData.lebar;
        document.getElementById('editKeterangan').value = roadData.keterangan || '';
        
        document.getElementById('editSelectJenis').value = roadData.jenisjalan_id;
        document.getElementById('editSelectKondisi').value = roadData.kondisi_id;
        document.getElementById('editSelectEksisting').value = roadData.eksisting_id;

        roadLayerGroup.clearLayers(); 
        drawnItems.clearLayers(); 
        if(currentWidthHandle) { map.removeLayer(currentWidthHandle); currentWidthHandle = null; }

        try {
            const coordinates = decodePolyline(roadData.paths);
            if (coordinates.length > 0) {
                currentWidth = parseInt(roadData.lebar) || 5;

                const polyline = L.polyline(coordinates, {
                    color: '#f357a1', 
                    weight: currentWidth,
                    opacity: 0.8
                }).addTo(drawnItems);

                polyline.editing.enable(); 

                map.fitBounds(polyline.getBounds());
                currentLayer = polyline;

                createWidthHandle(polyline, true); 
                polyline.on('edit', updateEditGeometry);
            }
        } catch (e) {
            console.error("Error setup edit mode:", e);
        }
    }

    function exitEditMode() {
        isEditing = false;
        listViewContainer.classList.remove('hidden');
        editFormContainer.classList.add('hidden');
        sidebarTitle.innerHTML = '<i class="fa-solid fa-road"></i> Data Ruas Jalan';
        
        drawnItems.clearLayers();
        if(currentWidthHandle) { map.removeLayer(currentWidthHandle); currentWidthHandle = null; }
        
        if(allRoadsData.length > 0) displayAllRoads(allRoadsData);
    }

    document.getElementById('btnCancelEdit').addEventListener('click', exitEditMode);

    function updateEditGeometry() {
        if(!currentLayer) return;
        
        // Update Panjang
        const geoJSON = currentLayer.toGeoJSON();
        const lengthKm = turf.length(geoJSON, {units: 'kilometers'});
        document.getElementById('editPanjang').value = Math.round(lengthKm * 1000);
        
        detectRegion(geoJSON, true); 

        // Update Path di Input (Visual Feedback)
        let latlngs = currentLayer.getLatLngs();
        
        // Flatten
        const flattenDeep = (arr) => {
            return arr.reduce((acc, val) => {
                if (Array.isArray(val)) return acc.concat(flattenDeep(val));
                else if (val && typeof val.lat !== 'undefined') return acc.concat(val);
                return acc;
            }, []);
        };

        if(Array.isArray(latlngs)) {
            latlngs = flattenDeep(latlngs);
        }

        const coords = latlngs.map(p => [p.lng, p.lat]);
        const encodedPath = encodePolyline(coords);
        
        const inputPaths = document.getElementById('editPaths');
        if(inputPaths) {
            inputPaths.value = encodedPath;
            inputPaths.style.backgroundColor = "#fff3cd"; 
            setTimeout(() => inputPaths.style.backgroundColor = "#e9ecef", 300);
        }
    }

    // --- SUBMIT EDIT FORM (FINAL FIX) ---
    const editForm = document.getElementById('editRuasForm');
    if(editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btnSave = editForm.querySelector('.btn-save');
            const originalText = btnSave.innerText;
            const formData = new FormData(editForm);
            const id = formData.get('id');

            // 1. Force Update Path from Map
            let finalEncodedPath = formData.get('paths'); 
            if(currentLayer) {
                let latlngs = currentLayer.getLatLngs();
                const flattenDeep = (arr) => {
                    return arr.reduce((acc, val) => {
                        if (Array.isArray(val)) return acc.concat(flattenDeep(val));
                        else if (val && typeof val.lat !== 'undefined') return acc.concat(val);
                        return acc;
                    }, []);
                };
                if (Array.isArray(latlngs)) latlngs = flattenDeep(latlngs);
                const coords = latlngs.map(p => [p.lng, p.lat]);
                finalEncodedPath = encodePolyline(coords);
            }

            // 2. Prepare Payload JSON (NO ID IN BODY, TYPE CASTING)
            const payload = {
                paths: finalEncodedPath, 
                desa_id: parseInt(formData.get('desa_id')),
                kode_ruas: formData.get('kode_ruas'),
                nama_ruas: formData.get('nama_ruas'),
                panjang: parseFloat(formData.get('panjang')),
                lebar: parseFloat(formData.get('lebar')),
                eksisting_id: parseInt(formData.get('eksisting_id')),
                kondisi_id: parseInt(formData.get('kondisi_id')),
                jenisjalan_id: parseInt(formData.get('jenisjalan_id')),
                keterangan: formData.get('keterangan')
            };

            btnSave.innerText = "Menyimpan...";
            btnSave.disabled = true;

            fetch(`/ruasjalan/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json', // KIRIM JSON
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if(data.status === 'error') {
                    alert("Gagal update: " + (data.message || 'Unknown error'));
                } else {
                    alert("Berhasil memperbarui data!");
                    fetchRoadsData(); // Fetch ulang (sudah ada anti-cache)
                    exitEditMode();
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan sistem saat update.");
            })
            .finally(() => {
                btnSave.innerText = originalText;
                btnSave.disabled = false;
            });
        });
    }

    // ============================================================
    // 8. DISPLAY FUNCTIONS
    // ============================================================
    function displayAllRoads(data) {
        if(isEditing) return; 
        roadLayerGroup.clearLayers();
        const bounds = L.latLngBounds();
        let hasLayer = false;

        data.forEach(road => {
            try {
                const coordinates = decodePolyline(road.paths);
                if (coordinates.length > 0) {
                    const weightVal = parseInt(road.lebar) || 3; 
                    const polyline = L.polyline(coordinates, {
                        color: '#3b82f6', 
                        weight: weightVal,
                        opacity: 0.6
                    }).addTo(roadLayerGroup);
                    polyline.bindPopup(`<b>${road.nama_ruas}</b><br>Kode: ${road.kode_ruas}`);
                    bounds.extend(polyline.getBounds());
                    hasLayer = true;
                }
            } catch (e) {}
        });

        if (hasLayer && bounds.isValid()) map.fitBounds(bounds);
    }

    function showRoadOnMap(roadData) {
        if(isEditing) return;
        roadLayerGroup.clearLayers();
        try {
            const coordinates = decodePolyline(roadData.paths);
            if (coordinates.length > 0) {
                const weightVal = parseInt(roadData.lebar) || 4; 
                const polyline = L.polyline(coordinates, {
                    color: 'red', weight: weightVal, opacity: 1
                }).addTo(roadLayerGroup);
                polyline.bindPopup(`<b>${roadData.nama_ruas}</b><br>L: ${roadData.lebar}m`).openPopup();
                map.fitBounds(polyline.getBounds());
            }
        } catch (error) {}
    }

    // ============================================================
    // 9. DRAWING LOGIC (ADD NEW)
    // ============================================================
    if (loading) loading.style.display = 'block';
    fetch('/geojson/bali_complete_universal.geojson')
        .then(res => res.json())
        .then(data => {
            baliGeoJSON = data; 
            if (loading) loading.style.display = 'none';
        })
        .catch(err => { if (loading) loading.innerHTML = "Gagal memuat data."; });

    const drawHandler = new L.Draw.Polyline(map, {
        shapeOptions: { color: '#f357a1', weight: 5, opacity: 0.8 },
        icon: new L.DivIcon({ iconSize: new L.Point(10, 10), className: 'leaflet-div-icon leaflet-editing-icon' }),
        touchIcon: new L.DivIcon({ iconSize: new L.Point(10, 10), className: 'leaflet-div-icon leaflet-editing-icon' })
    });

    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            if (!isDrawing) {
                if(isEditing) exitEditMode();
                
                drawHandler.enable();
                isDrawing = true;
                drawBtn.classList.add('active');
                drawBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                if(leftSidebar) leftSidebar.classList.remove('active'); 
                drawnItems.clearLayers(); 
                if(currentWidthHandle) { map.removeLayer(currentWidthHandle); currentWidthHandle = null; }
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
        currentWidth = 5; 
        layer.setStyle({ weight: currentWidth }); 
        drawnItems.addLayer(layer);

        isDrawing = false;
        if (drawBtn) {
            drawBtn.classList.remove('active');
            drawBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        }

        const drawnGeoJSON = layer.toGeoJSON();
        const lengthKm = turf.length(drawnGeoJSON, {units: 'kilometers'});
        const lengthM = Math.round(lengthKm * 1000);
        document.getElementById('inputPanjang').value = lengthM;

        createWidthHandle(layer, false); 
        detectRegion(drawnGeoJSON, false);
    });

    // ============================================================
    // 10. SHARED LOGIC
    // ============================================================
    function createWidthHandle(layer, isEditMode = false) {
        if(currentWidthHandle) map.removeLayer(currentWidthHandle);

        let latlngs = layer.getLatLngs();
        
        const flattenDeep = (arr) => {
            return arr.reduce((acc, val) => {
                if (Array.isArray(val)) return acc.concat(flattenDeep(val));
                else if (val && typeof val.lat !== 'undefined') return acc.concat(val);
                return acc;
            }, []);
        };

        if(Array.isArray(latlngs)) latlngs = flattenDeep(latlngs);
        if(!latlngs || latlngs.length === 0) return;

        const midIndex = Math.floor(latlngs.length / 2);
        const centerPos = latlngs[midIndex];

        const resizeIcon = L.divIcon({
            className: 'resize-handle',
            html: '<i class="fa-solid fa-arrows-left-right"></i>',
            iconSize: [24, 24], iconAnchor: [12, 12]
        });

        currentWidthHandle = L.marker(centerPos, {
            draggable: true, icon: resizeIcon, zIndexOffset: 1000
        }).addTo(map);

        currentWidthHandle.on('drag', function(e) {
            const handlePos = e.latlng;
            let currentLL = layer.getLatLngs();
            if(Array.isArray(currentLL)) currentLL = flattenDeep(currentLL);
            const currentCenter = currentLL[Math.floor(currentLL.length / 2)];
            
            const linePoint = map.latLngToLayerPoint(currentCenter);
            const handlePoint = map.latLngToLayerPoint(handlePos);
            const dist = linePoint.distanceTo(handlePoint);
            
            const newWeight = Math.max(2, Math.round(dist * 2));
            currentWidth = newWeight;
            layer.setStyle({ weight: currentWidth });
            
            currentWidthHandle.bindTooltip(`Lebar: ${currentWidth}`, {permanent: true, direction: 'top'}).openTooltip();
        });

        currentWidthHandle.on('dragend', function(e) {
             let currentLL = layer.getLatLngs();
             if(Array.isArray(currentLL)) currentLL = flattenDeep(currentLL);
             const currentCenter = currentLL[Math.floor(currentLL.length / 2)];
             currentWidthHandle.setLatLng(currentCenter);
             
             const idVal = isEditMode ? 'editLebar' : 'inputLebar';
             const dispVal = isEditMode ? 'editDisplayLebar' : 'displayLebar';
             document.getElementById(idVal).value = currentWidth;
             document.getElementById(dispVal).value = currentWidth;
        });
    }

    function detectRegion(roadGeoJSON, isEditMode = false) {
        if (!baliGeoJSON) return;
        const results = { desa: new Set(), kecamatan: new Set(), kabupaten: new Set(), provinsi: new Set() };
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

        const targetId = isEditMode ? 'editDesaId' : 'inputDesaId';
        const el = document.getElementById(targetId);
        if(el) el.value = currentDetectedDesaId || "";

        if(!isEditMode) renderResultSidebar(results, roadGeoJSON);
    }

    function renderResultSidebar(results, geojsonData) {
        let html = '';
        const item = (label, set) => `<div class="result-group"><div class="result-label">${label}</div><div class="result-value">${Array.from(set).join(", ") || "-"}</div></div>`;
        html += item("Kabupaten", results.kabupaten) + item("Kecamatan", results.kecamatan) + item("Desa", results.desa);
        html += `<div class="sidebar-actions"><button id="btnCancelResult" class="btn-action btn-cancel">Hapus</button><button id="btnSaveResult" class="btn-action btn-save">Lanjut</button></div>`;
        html += `<div style="margin-top:10px; font-size:12px; color:#666; text-align:center;"><i class="fa-solid fa-circle-info"></i> Tarik handle di peta untuk atur lebar.</div>`;

        if (sidebarContent) {
            sidebarContent.innerHTML = html;
            document.getElementById('btnCancelResult').addEventListener('click', () => {
                drawnItems.clearLayers();
                if(currentWidthHandle) map.removeLayer(currentWidthHandle);
                sidebar.classList.remove('open');
            });
            document.getElementById('btnSaveResult').addEventListener('click', () => {
                const coords = geojsonData.geometry.coordinates;
                const encodedPath = encodePolyline(coords);
                document.getElementById('inputPaths').value = encodedPath;
                if(!currentDetectedDesaId) { alert("Wilayah tidak terdeteksi."); return; }
                formModal.classList.remove('hidden');
            });
        }
        if (sidebar) sidebar.classList.add('open');
    }

    // ============================================================
    // 11. FORM SUBMIT ADD (NEW)
    // ============================================================
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const btnSubmit = form.querySelector('button[type="submit"]');
            btnSubmit.innerText = "Menyimpan...";
            btnSubmit.disabled = true;

            fetch('/ruasjalan', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: formData
            }).then(res => res.json()).then(data => {
                if(data.status !== 'error') {
                    alert("Berhasil!"); formModal.classList.add('hidden'); sidebar.classList.remove('open');
                    drawnItems.clearLayers(); if(currentWidthHandle) map.removeLayer(currentWidthHandle);
                    form.reset();
                } else alert("Gagal: " + data.message);
            }).finally(() => { btnSubmit.innerText = "Simpan Data"; btnSubmit.disabled = false; });
        });
    }

    // ============================================================
    // 12. UTILS UI
    // ============================================================
    const closeModalBtn = document.getElementById('closeModalBtn');
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => formModal.classList.add('hidden'));
    
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) profileBtn.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById("dropdownData").classList.toggle("show"); });
    window.onclick = (event) => { if (!event.target.closest('.profile-container')) document.getElementById("dropdownData")?.classList.remove('show'); };
});