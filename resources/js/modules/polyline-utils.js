export function encodePolyline(coordinates) {
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

export function decodePolyline(encoded) {
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