import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { NARO } from '@/src/lib/geofence';
import { useEffect, useState, useMemo } from 'react';
import { WifiOff, AlertCircle, Filter, Dog, Cat, MousePointer2, Calendar, ArrowRight, ShieldAlert, CheckCircle2, Clock, Maximize2 } from 'lucide-react';
import { OfflineStore } from '@/src/lib/offline';
import { Link } from 'react-router-dom';
import Lightbox from '../ui/Lightbox';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Helper component to fix map render issues in SPAs
function MapFix({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    // Immediate invalidate
    map.invalidateSize();
    
    // Delayed invalidate for layout transitions
    const timers = [100, 250, 500, 1000].map(delay => 
      setTimeout(() => {
        map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, 18, { animate: true, duration: 1 });
    }
  }, [center, map]);

  return null;
}

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  specie?: string;
  urgenza?: 'Alta' | 'Normale' | 'Bassa';
  image?: string;
  date?: string;
  code?: string;
  status?: 'CREATA' | 'IN_CARICO' | 'PULIZIA' | 'RISOLTA';
  id?: string;
}

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: string) => void;
  markers?: MapMarker[];
  interactive?: boolean;
  hideFilters?: boolean;
  center?: [number, number];
}

// Function to generate high-fidelity, beautifully animated custom Leaflet markers
const createCustomMarker = (m: MapMarker) => {
  const isHigh = m.urgenza === 'Alta';
  const isMedium = m.urgenza === 'Normale';
  
  // Custom colors depending on urgency
  const color = isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';
  const ringColor = isHigh ? 'rgba(239,68,68,0.45)' : isMedium ? 'rgba(245,158,11,0.45)' : 'rgba(16,185,129,0.45)';
  
  // Custom animal emoji inside marker
  const label = m.specie === 'Gatto' ? '🐱' : m.specie === 'Cane' ? '🐶' : '🐾';
  const pingDuration = isHigh ? '1.5s' : '2.2s';
  
  const htmlContent = `
    <div class="relative flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform duration-300" style="width: 44px; height: 44px;">
      <!-- Active pulsing wave rings -->
      <div class="absolute inset-1 rounded-full animate-ping opacity-75" style="background-color: ${ringColor}; animation-duration: ${pingDuration};"></div>
      <div class="absolute inset-2 rounded-full animate-pulse opacity-40" style="background-color: ${ringColor}; animation-duration: 1.2s;"></div>
      
      <!-- Styled point pin -->
      <div class="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-base transition-all duration-300"
           style="background: linear-gradient(135deg, ${color} 0%, #1e3a5f 100%);">
        <span class="transform select-none" style="filter: drop-shadow(0px 1px 1.5px rgba(0,0,0,0.3)); font-size: 14px;">${label}</span>
      </div>
      
      <!-- Indicator marker tail -->
      <div class="absolute bottom-1 w-2.5 h-2.5 rotate-45 border-r border-b border-white shadow-sm z-0" 
           style="background-color: #1e3a5f; bottom: 5px;"></div>
    </div>
  `;
  
  return L.divIcon({
    html: htmlContent,
    className: 'custom-animated-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 38],
    popupAnchor: [0, -32]
  });
};

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Posizione selezionata</Popup>
    </Marker>
  );
}

export default function AppMap({ onLocationSelect, onMarkerClick, markers = [], interactive = false, hideFilters = false, center }: MapProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [specieFilter, setSpecieFilter] = useState<string>('Tutte');
  const [urgenzaFilter, setUrgenzaFilter] = useState<string>('Tutte');
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: ''
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setPendingCount(OfflineStore.getAll().length);

    const interval = setInterval(() => {
      setPendingCount(OfflineStore.getAll().length);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const filteredMarkers = useMemo(() => {
    return markers.filter(m => {
      const matchSpecie = specieFilter === 'Tutte' || m.specie === specieFilter;
      const matchUrgenza = urgenzaFilter === 'Tutte' || m.urgenza === urgenzaFilter;
      return matchSpecie && matchUrgenza;
    });
  }, [markers, specieFilter, urgenzaFilter]);

  return (
    <div className="relative h-full w-full group overflow-hidden rounded-lg bg-white border-4 border-white shadow-xl">
      {/* Filter Bar */}
      {!hideFilters && (
        <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-wrap gap-3 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-2 shadow-xl border border-gray-100 flex items-center gap-2 pointer-events-auto">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Filter className="h-4 w-4 text-gray-500" />
            </div>
            <select 
              value={specieFilter}
              onChange={(e) => setSpecieFilter(e.target.value)}
              className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none outline-none pr-8 cursor-pointer text-[#1e3a5f]"
            >
              <option value="Tutte">Tutte le specie</option>
              <option value="Cane">Cani</option>
              <option value="Gatto">Gatti</option>
              <option value="Altro">Altro</option>
            </select>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-lg p-2 shadow-xl border border-gray-100 flex items-center gap-2 pointer-events-auto">
            <div className="p-2 bg-gray-50 rounded-lg">
              <ShieldAlert className="h-4 w-4 text-gray-500" />
            </div>
            <select 
              value={urgenzaFilter}
              onChange={(e) => setUrgenzaFilter(e.target.value)}
              className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none outline-none pr-8 cursor-pointer text-[#1e3a5f]"
            >
              <option value="Tutte">Ogni Urgenza</option>
              <option value="Alta">Alta</option>
              <option value="Normale">Normale</option>
              <option value="Bassa">Bassa</option>
            </select>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2">
          <WifiOff className="h-3 w-3" /> Connessione Assente • Modalità Offline Attiva
        </div>
      )}
      
      {pendingCount > 0 && isOnline && (
        <div className="absolute top-20 right-24 z-[2000] bg-indigo-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all animate-in fade-in zoom-in">
          <AlertCircle className="h-3 w-3" /> {pendingCount} Segnalazioni in attesa
        </div>
      )}

      <MapContainer
        center={center || [NARO.center.lat, NARO.center.lng]}
        zoom={center ? 16 : 14}
        className="h-full w-full min-h-[400px]"
        scrollWheelZoom={interactive ? true : false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFix center={center} />
        
        {interactive && onLocationSelect && <LocationMarker onSelect={onLocationSelect} />}
        
        <MarkerClusterGroup>
          {filteredMarkers.map((m, i) => (
            <Marker 
              key={i} 
              position={[m.lat, m.lng]} 
              icon={createCustomMarker(m)}
              eventHandlers={{
                click: () => {
                  if (m.id && onMarkerClick) {
                    onMarkerClick(m.id);
                  }
                }
              }}
            >
              <Popup>
                <div className="flex flex-col group/popup">
                  {m.image ? (
                    <div 
                      className="h-32 w-full overflow-hidden relative outline-none focus:ring-4 focus:ring-inset focus:ring-[#15803d]/50 cursor-zoom-in group/img"
                      tabIndex={0}
                      aria-label={`Foto della segnalazione: ${m.title}`}
                      onClick={() => setLightbox({ isOpen: true, url: m.image!, title: m.title })}
                    >
                      <img src={m.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                        <Maximize2 className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity h-6 w-6 scale-75 group-hover/img:scale-100 duration-300" />
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white ${
                          m.urgenza === 'Alta' ? 'bg-red-500' : m.urgenza === 'Normale' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                          {m.urgenza || 'Normale'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-4 bg-[#101b3a]" />
                  )}
                  
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 
                          className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest mb-1 outline-none focus:text-[#15803d]"
                          tabIndex={0}
                        >
                          {m.title}
                        </h4>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span className="text-[9px] font-bold tracking-tight">{m.date || 'Recente'}</span>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {m.specie === 'Gatto' ? <Cat className="h-4 w-4 text-gray-400" aria-hidden="true" /> : <Dog className="h-4 w-4 text-gray-400" aria-hidden="true" />}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                             m.status === 'RISOLTA' ? 'bg-indigo-600' : m.status === 'IN_CARICO' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{m.status || 'Creata'}</span>
                       </div>
                       {onMarkerClick && m.id ? (
                         <button
                           onClick={() => onMarkerClick(m.id!)}
                           className="flex items-center gap-1.5 text-[#15803d] text-[9px] font-black uppercase tracking-widest hover:gap-1.5 hover:text-[#101b3a] focus:ring-2 focus:ring-[#15803d] rounded px-1 transition-all cursor-pointer bg-transparent border-none appearance-none outline-none font-extrabold"
                         >
                           Dettagli <ArrowRight className="h-3 w-3" />
                         </button>
                       ) : (
                         <Link 
                           to="/mia-area" 
                           className="flex items-center gap-1.5 text-[#15803d] text-[9px] font-black uppercase tracking-widest hover:gap-2 focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2 rounded px-1 transition-all"
                           aria-label={`Visualizza dettagli completi per ${m.title}`}
                         >
                           Dettagli <ArrowRight className="h-3 w-3" />
                         </Link>
                       )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <Lightbox 
        isOpen={lightbox.isOpen} 
        imageUrl={lightbox.url} 
        title={lightbox.title}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}
