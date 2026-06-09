export interface ComuneConfig {
  name: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number };
  codiceCatastale?: string;
  superficieTotaleKm2?: number;
  foglioCatastaleHub?: string;
  particellaCatastaleHub?: string;
  estensioneEttariHub?: number;
  datiCatastaliCompleti?: string;
}

export const COMUNI: Record<string, ComuneConfig> = {
  naro: {
    name: "Naro",
    center: { lat: 37.2957, lng: 13.7936 },
    radiusKm: 8,
    bounds: { latMin: 37.25, latMax: 37.35, lngMin: 13.74, lngMax: 13.85 },
    codiceCatastale: "F845",
    superficieTotaleKm2: 162.24,
    foglioCatastaleHub: "72",
    particellaCatastaleHub: "145",
    estensioneEttariHub: 1.85,
    datiCatastaliCompleti: "Ente Urbano destinato a Centro di Soccorso e Servizi Sanitari Zootecnici. Connessione integrata con canile municipale di contrada Zaffuti. Esente IMU usi pubblici."
  },
  agrigento: {
    name: "Agrigento",
    center: { lat: 37.3111, lng: 13.5765 },
    radiusKm: 12,
    bounds: { latMin: 37.20, latMax: 37.40, lngMin: 13.45, lngMax: 13.70 },
    codiceCatastale: "A089",
    superficieTotaleKm2: 245.43,
    foglioCatastaleHub: "118",
    particellaCatastaleHub: "239",
    estensioneEttariHub: 2.45,
    datiCatastaliCompleti: "Hub di Soccorso Sanitario e Clinica della Valle dei Templi. Sezione Centralizzata Polizia Locale Agrigento."
  },
  canicatti: {
    name: "Canicattì",
    center: { lat: 37.3591, lng: 13.8496 },
    radiusKm: 10,
    bounds: { latMin: 37.30, latMax: 37.42, lngMin: 13.75, lngMax: 13.95 },
    codiceCatastale: "B602",
    superficieTotaleKm2: 92.06,
    foglioCatastaleHub: "45",
    particellaCatastaleHub: "512",
    estensioneEttariHub: 1.20,
    datiCatastaliCompleti: "Oasi Felina di Canicattì, rifugi sanitari convenzionati. Monitoraggio in convenzione ASP Agrigento."
  },
  favara: {
    name: "Favara",
    center: { lat: 37.3151, lng: 13.6628 },
    radiusKm: 9,
    bounds: { latMin: 37.26, latMax: 37.37, lngMin: 13.60, lngMax: 13.72 },
    codiceCatastale: "D514",
    superficieTotaleKm2: 81.88,
    foglioCatastaleHub: "31",
    particellaCatastaleHub: "809",
    estensioneEttariHub: 0.95,
    datiCatastaliCompleti: "Presidio Ambulatoriale e tutela benessere animale di Favara. Gestione microchip attiva."
  },
  palermo: {
    name: "Palermo",
    center: { lat: 38.1157, lng: 13.3614 },
    radiusKm: 15,
    bounds: { latMin: 38.00, latMax: 38.25, lngMin: 13.20, lngMax: 13.50 },
    codiceCatastale: "G273",
    superficieTotaleKm2: 160.59,
    foglioCatastaleHub: "92",
    particellaCatastaleHub: "1004",
    estensioneEttariHub: 4.50,
    datiCatastaliCompleti: "Rifugio Sanitario Canile Favorita di Palermo. Centro d'eccellenza veterinaria accreditato."
  },
  montallegro: {
    name: "Montallegro",
    center: { lat: 37.3915, lng: 13.3512 },
    radiusKm: 6,
    bounds: { latMin: 37.35, latMax: 37.43, lngMin: 13.28, lngMax: 13.42 },
    codiceCatastale: "F514",
    superficieTotaleKm2: 27.41,
    foglioCatastaleHub: "12",
    particellaCatastaleHub: "335",
    estensioneEttariHub: 0.78,
    datiCatastaliCompleti: "Presidio ed Hub di Degenza Randagismo e Avifauna Torre Salsa. Sorveglianza convenzionata Ente Parco."
  },
  portoempedocle: {
    name: "Porto Empedocle",
    center: { lat: 37.2911, lng: 13.5283 },
    radiusKm: 7,
    bounds: { latMin: 37.25, latMax: 37.33, lngMin: 13.47, lngMax: 13.58 },
    codiceCatastale: "G914",
    superficieTotaleKm2: 25.11,
    foglioCatastaleHub: "8",
    particellaCatastaleHub: "202",
    estensioneEttariHub: 1.10,
    datiCatastaliCompleti: "Hub costiero Soccorso Animali Marina di Porto Empedocle. Supporto veterinario transitorio Guardia Costiera."
  },
  sciacca: {
    name: "Sciacca",
    center: { lat: 37.5081, lng: 13.0881 },
    radiusKm: 11,
    bounds: { latMin: 37.42, latMax: 37.58, lngMin: 12.96, lngMax: 13.20 },
    codiceCatastale: "I533",
    superficieTotaleKm2: 191.01,
    foglioCatastaleHub: "84",
    particellaCatastaleHub: "402",
    estensioneEttariHub: 3.20,
    datiCatastaliCompleti: "Santuario Felino e Canile Sanitario Sciacca Est. Sala operatoria per sterilizzazioni e primo soccorso animali randagi."
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
