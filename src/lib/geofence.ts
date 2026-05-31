export const NARO = {
  center: { lat: 37.2957, lng: 13.7936 },
  radiusKm: 8,
  bounds: { latMin: 37.25, latMax: 37.35, lngMin: 13.74, lngMax: 13.85 },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInTerritorio(lat: number, lng: number): boolean {
  const { center, radiusKm } = NARO;
  return haversineKm(lat, lng, center.lat, center.lng) <= radiusKm;
}

export function getZona(lat: number, lng: number): string {
  const dist = haversineKm(lat, lng, NARO.center.lat, NARO.center.lng);
  if (dist < 1) return "CENTRO";
  if (dist < 3) return "PERIFERIA";
  if (dist < 6) return "CAMPAGNA";
  return "CONTRADA";
}
