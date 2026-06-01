import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { NARO } from '@/src/lib/geofence';
import { useEffect, useState, useMemo } from 'react';
import { WifiOff, AlertCircle, Filter, Dog, Cat, MousePointer2, Calendar, ArrowRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { OfflineStore } from '@/src/lib/offline';
import { Link } from 'react-router-dom';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to fix map render issues in SPAs
function MapFix() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
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
}

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: MapMarker[];
  interactive?: boolean;
}

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

export default function AppMap({ onLocationSelect, markers = [], interactive = false }: MapProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [specieFilter, setSpecieFilter] = useState<string>('Tutte');
  const [urgenzaFilter, setUrgenzaFilter] = useState<string>('Tutte');

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
    <div className="relative h-full w-full group overflow-hidden rounded-[2.5rem] bg-gray-100 border-4 border-white shadow-2xl">
      {/* Filter Bar */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-wrap gap-3 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-gray-100 flex items-center gap-2 pointer-events-auto">
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

        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-gray-100 flex items-center gap-2 pointer-events-auto">
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

      {/* Modern Legend */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-3rem)] max-w-lg">
        <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-4 shadow-2xl border border-gray-100">
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Creata', color: 'bg-blue-500', icon: Clock },
                { label: 'In Carico', color: 'bg-amber-500', icon: AlertCircle },
                { label: 'Pulizia', color: 'bg-emerald-500', icon: MousePointer2 },
                { label: 'Risolta', color: 'bg-indigo-600', icon: CheckCircle2 }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${item.color}`}>
                     <item.icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1e3a5f]">{item.label}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <MapContainer
        center={[NARO.center.lat, NARO.center.lng]}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFix />
        
        {interactive && onLocationSelect && <LocationMarker onSelect={onLocationSelect} />}
        
        <MarkerClusterGroup>
          {filteredMarkers.map((m, i) => (
            <Marker key={i} position={[m.lat, m.lng]}>
              <Popup>
                <div className="flex flex-col group/popup">
                  {m.image ? (
                    <div 
                      className="h-32 w-full overflow-hidden relative outline-none focus:ring-4 focus:ring-inset focus:ring-[#15803d]/50"
                      tabIndex={0}
                      aria-label={`Foto della segnalazione: ${m.title}`}
                    >
                      <img src={m.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
                       <Link 
                         to="/mia-area" 
                         className="flex items-center gap-1.5 text-[#15803d] text-[9px] font-black uppercase tracking-widest hover:gap-2 focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2 rounded px-1 transition-all"
                         aria-label={`Visualizza dettagli completi per ${m.title}`}
                       >
                         Dettagli <ArrowRight className="h-3 w-3" />
                       </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
