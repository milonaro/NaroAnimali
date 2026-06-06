export interface ComuneConfig {
  name: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number };
}

export const COMUNI: Record<string, ComuneConfig> = {
  naro: {
    name: "Naro",
    center: { lat: 37.2957, lng: 13.7936 },
    radiusKm: 8,
    bounds: { latMin: 37.25, latMax: 37.35, lngMin: 13.74, lngMax: 13.85 },
  },
  agrigento: {
    name: "Agrigento",
    center: { lat: 37.3111, lng: 13.5765 },
    radiusKm: 12,
    bounds: { latMin: 37.20, latMax: 37.40, lngMin: 13.45, lngMax: 13.70 },
  },
  canicatti: {
    name: "Canicattì",
    center: { lat: 37.3591, lng: 13.8496 },
    radiusKm: 10,
    bounds: { latMin: 37.30, latMax: 37.42, lngMin: 13.75, lngMax: 13.95 },
  },
  favara: {
    name: "Favara",
    center: { lat: 37.3151, lng: 13.6628 },
    radiusKm: 9,
    bounds: { latMin: 37.26, latMax: 37.37, lngMin: 13.60, lngMax: 13.72 },
  },
  palermo: {
    name: "Palermo",
    center: { lat: 38.1157, lng: 13.3614 },
    radiusKm: 15,
    bounds: { latMin: 38.00, latMax: 38.25, lngMin: 13.20, lngMax: 13.50 },
  }
};

export function getActiveComune(): ComuneConfig {
  const activeKey = (localStorage.getItem('active_comune') || 'naro').toLowerCase();
  return COMUNI[activeKey] || COMUNI.naro;
}

// Dynamic Object maintains 100% backward-compatibility with rest of codebase importing `NARO`
export const NARO = {
  get center() { return getActiveComune().center; },
  get radiusKm() { return getActiveComune().radiusKm; },
  get bounds() { return getActiveComune().bounds; },
  get name() { return getActiveComune().name; }
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
