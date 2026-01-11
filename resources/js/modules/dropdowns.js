export function initDropdowns(apiToken) {
    if(!apiToken) return;

    const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${apiToken}` };

    loadDropdown('/mjenisjalan', 'selectJenis', 'id', 'jenisjalan', 'eksisting', headers); 
    loadDropdown('/mkondisi', 'selectKondisi', 'id', 'kondisi', 'eksisting', headers);
    loadDropdown('/meksisting', 'selectEksisting', 'id', 'eksisting', 'eksisting', headers);

    loadDropdown('/mjenisjalan', 'editSelectJenis', 'id', 'jenisjalan', 'eksisting', headers); 
    loadDropdown('/mkondisi', 'editSelectKondisi', 'id', 'kondisi', 'eksisting', headers);
    loadDropdown('/meksisting', 'editSelectEksisting', 'id', 'eksisting', 'eksisting', headers);
}

function loadDropdown(url, elementId, valueKey, textKey, responseKey, headers) {
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