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
  thresholdCentroKm?: number;
  thresholdPeriferiaKm?: number;
  thresholdCampagnaKm?: number;
}

// Map database row to ComuneConfig format
export function mapRowToComuneConfig(row: any): ComuneConfig {
  return {
    name: row.name || "Naro",
    center: { 
      lat: parseFloat(row.lat) || 37.2957, 
      lng: parseFloat(row.lng) || 13.7936 
    },
    radiusKm: parseFloat(row.radius_km) || 8.0,
    bounds: {
      latMin: parseFloat(row.lat_min) || 37.25,
      latMax: parseFloat(row.lat_max) || 37.35,
      lngMin: parseFloat(row.lng_min) || 13.74,
      lngMax: parseFloat(row.lng_max) || 13.85,
    },
    codiceCatastale: row.codice_catastale,
    superficieTotaleKm2: row.superficie_totale_km2 ? parseFloat(row.superficie_totale_km2) : undefined,
    foglioCatastaleHub: row.foglio_catastale_hub,
    particellaCatastaleHub: row.particella_catastale_hub,
    estensioneEttariHub: row.estensione_ettari_hub ? parseFloat(row.estensione_ettari_hub) : undefined,
    datiCatastaliCompleti: row.dati_catastali_completi,
    thresholdCentroKm: row.threshold_centro_km ? parseFloat(row.threshold_centro_km) : undefined,
    thresholdPeriferiaKm: row.threshold_periferia_km ? parseFloat(row.threshold_periferia_km) : undefined,
    thresholdCampagnaKm: row.threshold_campagna_km ? parseFloat(row.threshold_campagna_km) : undefined
  };
}

// Load COMUNI dictionary dynamically from localStorage cache
export function getDynComuni(): Record<string, ComuneConfig> {
  const map: Record<string, ComuneConfig> = {};
  
  // Default fallback if database values are not yet loaded in localStorage
  const defaultNaro: ComuneConfig = {
    name: "Naro",
    center: { lat: 37.2957, lng: 13.7936 },
    radiusKm: 8,
    bounds: { latMin: 37.25, latMax: 37.35, lngMin: 13.74, lngMax: 13.85 },
    codiceCatastale: "F845",
    superficieTotaleKm2: 207.49,
    foglioCatastaleHub: "72",
    particellaCatastaleHub: "145",
    estensioneEttariHub: 1.85,
    datiCatastaliCompleti: "Ente Urbano destinato a Centro di Soccorso e Servizi Sanitari Zootecnici."
  };

  try {
    const cached = localStorage.getItem('cached_comuni');
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        list.forEach((row: any) => {
          if (row && row.key_name) {
            map[row.key_name.toLowerCase()] = mapRowToComuneConfig(row);
          }
        });
      }
    }
  } catch (e) {
    console.error("Errore nel parsing dei comuni memorizzati:", e);
  }

  // Always guarantee "naro" exists in the map
  if (!map.naro) {
    map.naro = defaultNaro;
  }

  return map;
}

// Backward-compatible COMUNI proxy that gets current dynamic dictionary
export const COMUNI = new Proxy({} as Record<string, ComuneConfig>, {
  get(target, prop) {
    const dyn = getDynComuni();
    const key = String(prop).toLowerCase();
    return dyn[key] || dyn.naro;
  },
  ownKeys() {
    return Object.keys(getDynComuni());
  },
  getOwnPropertyDescriptor(target, prop) {
    return {
      enumerable: true,
      configurable: true
    };
  }
});

export function getActiveComune(): ComuneConfig {
  const activeKey = (localStorage.getItem('active_comune') || 'naro').toLowerCase();
  const dyn = getDynComuni();
  return dyn[activeKey] || dyn.naro;
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
  const active = getActiveComune();
  const dist = haversineKm(lat, lng, active.center.lat, active.center.lng);
  
  // Proportional dynamic thresholds based on the total radius if not explicitly set
  const radius = active.radiusKm || 8.0;
  
  // Se non specificati esplicitamente, usiamo percentuali proporzionali del raggio del comune
  // (es. per raggio 8km: Centro = 1.0km, Periferia = 3.0km, Campagna = 6.0km)
  const centroThresh = active.thresholdCentroKm || (radius * 0.125); 
  const periferiaThresh = active.thresholdPeriferiaKm || (radius * 0.375); 
  const campagnaThresh = active.thresholdCampagnaKm || (radius * 0.75); 

  if (dist < centroThresh) return "CENTRO";
  if (dist < periferiaThresh) return "PERIFERIA";
  if (dist < campagnaThresh) return "CAMPAGNA";
  return "CONTRADA";
}
