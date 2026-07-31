const LOCATION_COORDS = {
  shenzhen: [22.5431, 114.0579],
  'shenzhen, china': [22.5431, 114.0579],
  hamburg: [53.5511, 9.9937],
  germany: [51.1657, 10.4515],
  detroit: [42.3314, -83.0458],
  usa: [37.0902, -95.7129],
  'united states': [37.0902, -95.7129],
  taipei: [25.033, 121.5654],
  hsinchu: [24.8138, 120.9675],
  taiwan: [23.6978, 120.9605],
  wuhan: [30.5928, 114.3055],
  zhengzhou: [34.7466, 113.6254],
  gurgaon: [28.4595, 77.0266],
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  india: [20.5937, 78.9629],
  'ho chi minh': [10.8231, 106.6297],
  vietnam: [14.0583, 108.2772],
  shanghai: [31.2304, 121.4737],
  beijing: [39.9042, 116.4074],
  china: [35.8617, 104.1954],
  london: [51.5074, -0.1278],
  paris: [48.8566, 2.3522],
  tokyo: [35.6762, 139.6503],
  seoul: [37.5665, 126.978],
  singapore: [1.3521, 103.8198],
  mumbai: [19.076, 72.8777],
  berlin: [52.52, 13.405],
  munich: [48.1351, 11.582],
  amsterdam: [52.3676, 4.9041],
  mexico: [23.6345, -102.5528],
  brazil: [-14.235, -51.9253],
  canada: [56.1304, -106.3468],
  australia: [-25.2744, 133.7751],
};

const COUNTRY_COORDS = {
  china: [35.8617, 104.1954],
  germany: [51.1657, 10.4515],
  usa: [37.0902, -95.7129],
  'united states': [37.0902, -95.7129],
  taiwan: [23.6978, 120.9605],
  india: [20.5937, 78.9629],
  vietnam: [14.0583, 108.2772],
  japan: [36.2048, 138.2529],
  uk: [55.3781, -3.436],
  france: [46.2276, 2.2137],
  mexico: [23.6345, -102.5528],
  brazil: [-14.235, -51.9253],
  canada: [56.1304, -106.3468],
};

export function normalizeLng(lng) {
  let n = Number(lng);
  while (n > 180) n -= 360;
  while (n < -180) n += 360;
  return n;
}

function hashOffset(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 0.35 + (Math.abs(hash) % 10) * 0.08;
  return [Math.sin(angle) * radius, Math.cos(angle) * radius];
}

export function resolveCoordinates(entity) {
  if (entity?.latitude != null && entity?.longitude != null) {
    return {
      lat: Number(entity.latitude),
      lng: normalizeLng(entity.longitude),
    };
  }

  const location = `${entity?.location || ''}`.trim().toLowerCase();
  const country = `${entity?.country || ''}`.trim().toLowerCase();
  const combined = `${location}, ${country}`.trim();

  const pack = (lat, lng) => ({ lat, lng: normalizeLng(lng) });

  if (LOCATION_COORDS[combined]) {
    const [lat, lng] = LOCATION_COORDS[combined];
    return pack(lat, lng);
  }
  if (LOCATION_COORDS[location]) {
    const [lat, lng] = LOCATION_COORDS[location];
    return pack(lat, lng);
  }
  if (COUNTRY_COORDS[country]) {
    const [lat, lng] = COUNTRY_COORDS[country];
    const [dLat, dLng] = hashOffset(entity?.id || entity?.name || location || country);
    return pack(lat + dLat, lng + dLng);
  }

  const [dLat, dLng] = hashOffset(entity?.id || 'x');
  return pack(20 + dLat * 5, dLng * 30);
}
