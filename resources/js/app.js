import './bootstrap';
import { initMap } from './modules/map-setup';
import { initDropdowns } from './modules/dropdowns';
import { initRoadList, displayAllRoads, getAllRoadsData } from './modules/road-manager';
import { initDrawEditor } from './modules/draw-editor';

document.addEventListener('DOMContentLoaded', () => {
    const apiToken = document.querySelector('meta[name="api-token"]')?.getAttribute('content');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const mapConfig = initMap();
    if (!mapConfig) return; 

    const { map, drawnItems, roadLayerGroup } = mapConfig;

    if (apiToken) {
        initDropdowns(apiToken);
    }

    const editor = initDrawEditor({
        map,
        drawnItems,
        roadLayerGroup,
        apiToken,
        csrfToken,
        onSaveSuccess: () => {
            const data = getAllRoadsData();
            if(data.length > 0) displayAllRoads(data, roadLayerGroup, map, apiToken);
            
            const roadListManager = initRoadList({
                 apiToken, csrfToken, map, roadLayerGroup, 
                 onEdit: editor.enterEditMode 
            });
            roadListManager.fetchRoadsData();
        }
    });

    const roadListManager = initRoadList({
        apiToken,
        csrfToken,
        map,
        roadLayerGroup,
        onEdit: (road) => editor.enterEditMode(road),
        onSidebarOpen: () => editor.exitEditMode(),
        onSidebarClose: () => editor.exitEditMode()
    });

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) profileBtn.addEventListener('click', (e) => { e.stopPropagation(); document.getElementById("dropdownData").classList.toggle("show"); });
    window.onclick = (event) => { if (!event.target.closest('.profile-container')) document.getElementById("dropdownData")?.classList.remove('show'); };
});