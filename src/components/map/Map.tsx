import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { NARO } from '@/src/lib/geofence';
import { useEffect, useState } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { OfflineStore } from '@/src/lib/offline';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{ lat: number; lng: number; title: string }>;
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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending reports
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

  return (
    <div className="relative h-full w-full group">
      {!isOnline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2">
          <WifiOff className="h-3 w-3" /> Connessione Assente • Modalità Offline Attiva
        </div>
      )}
      
      {pendingCount > 0 && isOnline && (
        <div className="absolute top-4 right-4 z-[2000] bg-indigo-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all animate-in fade-in zoom-in">
          <AlertCircle className="h-3 w-3" /> {pendingCount} Segnalazioni in attesa di invio
        </div>
      )}

      <MapContainer
        center={[NARO.center.lat, NARO.center.lng]}
        zoom={14}
        className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-gray-100"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {interactive && onLocationSelect && <LocationMarker onSelect={onLocationSelect} />}

        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]}>
            <Popup>{m.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
