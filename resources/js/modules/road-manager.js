import L from 'leaflet';
import { decodePolyline } from './polyline-utils';

let allRoadsData = [];
let globalApiToken = null;

export function getAllRoadsData() {
    return allRoadsData;
}

export function initRoadList(config) {
    const { apiToken, csrfToken, map, roadLayerGroup, onEdit } = config;
    globalApiToken = apiToken;

    const burgerBtn = document.getElementById('burgerBtn');
    const leftSidebar = document.getElementById('leftSidebar');
    const closeLeftSidebar = document.getElementById('closeLeftSidebar');
    const roadListContainer = document.getElementById('roadListContainer');
    const searchRoadInput = document.getElementById('searchRoadInput');

    if (burgerBtn && leftSidebar) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(config.onSidebarOpen) config.onSidebarOpen();
            leftSidebar.classList.add('active');
            fetchRoadsData();
        });

        closeLeftSidebar.addEventListener('click', () => {
            leftSidebar.classList.remove('active');
            roadLayerGroup.clearLayers(); 
            if(config.onSidebarClose) config.onSidebarClose();
        });
    }

    if(searchRoadInput) {
        searchRoadInput.addEventListener('keyup', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = allRoadsData.filter(item => 
                item.nama_ruas.toLowerCase().includes(keyword) || 
                item.kode_ruas.toLowerCase().includes(keyword)
            );
            renderList(filtered);
        });
    }

    function fetchRoadsData() {
        roadListContainer.innerHTML = '<li style="padding:15px; text-align:center; color:#777;">Mengambil data...</li>';
        const timestamp = new Date().getTime();
        
        fetch(`/ruasjalan?t=${timestamp}`, { 
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${apiToken}` } 
        })
        .then(res => res.json())
        .then(data => {
            // console.log("Data Ruas Jalan Raw:", data); // DEBUG 1
            if (data.status === 'success' && Array.isArray(data.ruasjalan)) {
                allRoadsData = data.ruasjalan;
                renderList(allRoadsData);
                displayAllRoads(allRoadsData, roadLayerGroup, map, apiToken);
            } else {
                roadListContainer.innerHTML = '<li style="padding:15px; text-align:center; color:red;">Gagal memuat data.</li>';
            }
        })
        .catch(err => {
            console.error(err);
            roadListContainer.innerHTML = '<li style="padding:15px; text-align:center; color:red;">Terjadi kesalahan server.</li>';
        });
    }

    function renderList(data) {
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
                    showRoadOnMap(road, roadLayerGroup, map, apiToken);
                }
            });

            const editBtn = li.querySelector('.btn-edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(onEdit) onEdit(road);
            });

            const delBtn = li.querySelector('.delete');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRoad(road.id);
            });

            roadListContainer.appendChild(li);
        });
    }

    function deleteRoad(id) {
        if(!confirm('Apakah Anda yakin ingin menghapus ruas jalan ini?')) return;

        fetch(`/ruasjalan/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })
        .then(res => res.json())
        .then(data => {
            if(data.status !== 'error') {
                alert('Data berhasil dihapus');
                fetchRoadsData();
            } else {
                alert('Gagal menghapus: ' + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus data.');
        });
    }

    return { fetchRoadsData }; 
}

// === FUNGSI FETCH REGION DENGAN DEBUGGING ===
async function getRegionDetails(desaId, token) {
    if (!desaId) {
        console.warn("Region Debug: Desa ID kosong atau null."); 
        return null;
    }
    
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
    const details = { desa: '-', kecamatan: '-', kabupaten: '-', provinsi: '-' };

    try {
        console.log(`Region Debug: Fetching /kecamatanbydesaid/${desaId}...`);
        const response = await fetch(`/kecamatanbydesaid/${desaId}`, { headers });
        
        if(!response.ok) {
            console.error("Region Debug: HTTP Error", response.status);
            return details;
        }

        const data = await response.json();
        console.log("Region Debug: Response API:", data); // LIHAT INI DI CONSOLE

        if (data) {
            // Kita coba handle jika response dibungkus 'data' atau langsung
            const source = data.data ? data.data : data;

            details.desa = source.desa?.desa || '-';
            details.kecamatan = source.kecamatan?.kecamatan || '-';
            details.kabupaten = source.kabupaten?.kabupaten || '-';
            details.provinsi = source.provinsi?.provinsi || '-';
        }
        return details;
    } catch (e) {
        console.error("Region Debug: Gagal fetch data:", e);
        return details;
    }
}

function bindPopupWithRegion(layer, road, token) {
    layer.bindPopup(() => {
        const div = document.createElement('div');
        div.style.minWidth = "220px";
        
        // DEBUG: Tampilkan Desa ID di popup sementara
        div.innerHTML = `
            <div style="margin-bottom:5px;"><b>${road.nama_ruas}</b></div>
            <div style="font-size:12px; color:#666;">Kode: ${road.kode_ruas}</div>
            <div style="font-size:12px; color:#666;">Lebar: ${road.lebar} m</div>
            <div style="font-size:10px; color:#999;">Desa ID: ${road.desa_id || 'NULL'}</div> 
            <hr style="margin:5px 0; border:0; border-top:1px solid #eee;">
            <div id="region-info-${road.id}" style="font-size:11px; color:#444;">
                <i class="fa-solid fa-spinner fa-spin"></i> Memuat data wilayah...
            </div>
        `;

        getRegionDetails(road.desa_id, token).then(details => {
            const infoDiv = div.querySelector(`#region-info-${road.id}`);
            if (infoDiv && details) {
                infoDiv.innerHTML = `
                    <div style="margin-bottom:2px;"><b>Desa:</b> ${details.desa}</div>
                    <div style="margin-bottom:2px;"><b>Kecamatan:</b> ${details.kecamatan}</div>
                    <div style="margin-bottom:2px;"><b>Kabupaten:</b> ${details.kabupaten}</div>
                    <div><b>Provinsi:</b> ${details.provinsi}</div>
                `;
            } else if (infoDiv) {
                infoDiv.innerHTML = `<span style="color:red;">Data wilayah tidak ditemukan (ID: ${road.desa_id}).</span>`;
            }
        });

        return div;
    });
}

export function displayAllRoads(data, layerGroup, map, token) {
    layerGroup.clearLayers();
    const bounds = L.latLngBounds();
    let hasLayer = false;

    const apiToken = token || globalApiToken;

    data.forEach(road => {
        try {
            const coordinates = decodePolyline(road.paths);
            if (coordinates.length > 0) {
                const weightVal = parseInt(road.lebar) || 3; 
                const polyline = L.polyline(coordinates, {
                    color: '#3b82f6', weight: weightVal, opacity: 0.6
                }).addTo(layerGroup);
                
                bindPopupWithRegion(polyline, road, apiToken);

                bounds.extend(polyline.getBounds());
                hasLayer = true;
            }
        } catch (e) {}
    });

    if (hasLayer && bounds.isValid()) map.fitBounds(bounds);
}

function showRoadOnMap(roadData, layerGroup, map, token) {
    layerGroup.clearLayers();
    try {
        const coordinates = decodePolyline(roadData.paths);
        if (coordinates.length > 0) {
            const weightVal = parseInt(roadData.lebar) || 4; 
            const polyline = L.polyline(coordinates, {
                color: 'red', weight: weightVal, opacity: 1
            }).addTo(layerGroup);

            bindPopupWithRegion(polyline, roadData, token);
            polyline.openPopup();

            map.fitBounds(polyline.getBounds());
        }
    } catch (error) {}
}