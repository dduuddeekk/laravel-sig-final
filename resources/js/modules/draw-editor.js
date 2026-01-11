import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { encodePolyline, decodePolyline } from './polyline-utils';

export function initDrawEditor(config) {
    const { map, drawnItems, roadLayerGroup, apiToken, csrfToken, onSaveSuccess } = config;

    let isDrawing = false;
    let isEditing = false;
    let currentLayer = null;
    let currentWidthHandle = null;
    let currentWidth = 5;
    let currentDetectedDesaId = null;
    let baliGeoJSON = null;

    const drawBtn = document.getElementById('drawBtn');
    const sidebar = document.getElementById('resultSidebar');
    const sidebarContent = document.getElementById('sidebarContent');
    const formModal = document.getElementById('formModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const form = document.getElementById('ruasJalanForm');
    
    const listViewContainer = document.getElementById('listViewContainer');
    const editFormContainer = document.getElementById('editFormContainer');
    const sidebarTitle = document.getElementById('sidebarTitle');
    const editForm = document.getElementById('editRuasForm');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';

    // Ini buat ambil data wilayah dll di sini berdasarkan koordinat, biar otomatis gitu cuyy
    fetch('/geojson/bali_complete_universal.geojson')
        .then(res => res.json())
        .then(data => {
            baliGeoJSON = data; 
            if (loading) loading.style.display = 'none';
        })
        .catch(err => { if (loading) loading.innerHTML = "Gagal memuat data."; });

    // Ini buat gambar (default weight = 5)
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
                document.getElementById('leftSidebar')?.classList.remove('active'); 
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
        document.getElementById('inputPanjang').value = Math.round(lengthKm * 1000);

        createWidthHandle(layer, false); 
        detectRegion(drawnGeoJSON, false);
    });

    function createWidthHandle(layer, isEditMode = false) {
        if(currentWidthHandle) map.removeLayer(currentWidthHandle);

        let latlngs = layer.getLatLngs();
        const flattenDeep = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : (val && typeof val.lat !== 'undefined' ? acc.concat(val) : acc), []);
        
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
                    if(onSaveSuccess) onSaveSuccess();
                } else alert("Gagal: " + data.message);
            }).finally(() => { btnSubmit.innerText = "Simpan Data"; btnSubmit.disabled = false; });
        });
    }

    if(closeModalBtn) closeModalBtn.addEventListener('click', () => formModal.classList.add('hidden'));

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
                    color: '#f357a1', weight: currentWidth, opacity: 0.8
                }).addTo(drawnItems);

                polyline.editing.enable(); 
                map.fitBounds(polyline.getBounds());
                currentLayer = polyline;
                createWidthHandle(polyline, true); 
                polyline.on('edit', updateEditGeometry);
            }
        } catch (e) { console.error("Error setup edit mode:", e); }
    }

    function exitEditMode() {
        isEditing = false;
        listViewContainer.classList.remove('hidden');
        editFormContainer.classList.add('hidden');
        sidebarTitle.innerHTML = '<i class="fa-solid fa-road"></i> Data Ruas Jalan';
        drawnItems.clearLayers();
        if(currentWidthHandle) { map.removeLayer(currentWidthHandle); currentWidthHandle = null; }
        if(onSaveSuccess) onSaveSuccess(); 
    }

    if(btnCancelEdit) btnCancelEdit.addEventListener('click', exitEditMode);

    function updateEditGeometry() {
        if(!currentLayer) return;
        
        const geoJSON = currentLayer.toGeoJSON();
        const lengthKm = turf.length(geoJSON, {units: 'kilometers'});
        document.getElementById('editPanjang').value = Math.round(lengthKm * 1000);
        
        detectRegion(geoJSON, true); 

        let latlngs = currentLayer.getLatLngs();
        const flattenDeep = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : (val && typeof val.lat !== 'undefined' ? acc.concat(val) : acc), []);
        if(Array.isArray(latlngs)) latlngs = flattenDeep(latlngs);

        const coords = latlngs.map(p => [p.lng, p.lat]);
        const encodedPath = encodePolyline(coords);
        
        const inputPaths = document.getElementById('editPaths');
        if(inputPaths) {
            inputPaths.value = encodedPath;
            inputPaths.style.backgroundColor = "#fff3cd"; 
            setTimeout(() => inputPaths.style.backgroundColor = "#e9ecef", 300);
        }
    }

    if(editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSave = editForm.querySelector('.btn-save');
            const originalText = btnSave.innerText;
            const formData = new FormData(editForm);
            const id = formData.get('id');

            let finalEncodedPath = formData.get('paths'); 
            if(currentLayer) {
                let latlngs = currentLayer.getLatLngs();
                const flattenDeep = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : (val && typeof val.lat !== 'undefined' ? acc.concat(val) : acc), []);
                if (Array.isArray(latlngs)) latlngs = flattenDeep(latlngs);
                const coords = latlngs.map(p => [p.lng, p.lat]);
                finalEncodedPath = encodePolyline(coords);
            }

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
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if(data.status === 'error') {
                    alert("Gagal update: " + (data.message || 'Unknown error'));
                } else {
                    alert("Berhasil memperbarui data!");
                    exitEditMode(); 
                }
            })
            .finally(() => { btnSave.innerText = originalText; btnSave.disabled = false; });
        });
    }

    return { enterEditMode, exitEditMode };
}