import React from 'react';
import { MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import AppMap from '@/src/components/map/Map';

interface MappaSelezionePosizioneProps {
  location: { lat: number; lng: number } | null;
  locationDetails: any;
  isGeocoding: boolean;
  onLocationSelect: (lat: number, lng: number) => void;
  onNext: () => void;
}

const MappaSelezionePosizione: React.FC<MappaSelezionePosizioneProps> = ({
  location,
  locationDetails,
  isGeocoding,
  onLocationSelect,
  onNext
}) => {
  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><MapPin className="h-6 w-6" /></div>
           <div>
             <h2 className="text-2xl font-bold text-[#1e3a5f]">Dove si trova l'animale?</h2>
             <p className="text-gray-500 text-sm">Clicca sulla mappa per indicare la posizione esatta della segnalazione.</p>
           </div>
        </div>
        {location && (
          <button
            onClick={onNext}
            className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all shadow-lg shadow-[#15803d]/30"
          >
            Avanti <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="h-[450px] md:h-[550px] w-full rounded-lg overflow-hidden border border-gray-100 relative shadow-inner">
        <AppMap interactive onLocationSelect={onLocationSelect} hideFilters />
      </div>
      {location && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex-1 space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Posizione Rilevata</span>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#15803d] shrink-0" />
              {isGeocoding ? (
                <span className="text-xs text-slate-400 font-medium">Calcolo indirizzo...</span>
              ) : (
                <p className="text-xs md:text-sm font-black text-[#1e3a5f] leading-relaxed">
                  {locationDetails?.address || "Coordinate definite sulla mappa"}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200/60 shrink-0">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Coordinate (Lat, Lng)</span>
              <span className="text-xs font-mono font-bold text-[#15803d]">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-[#15803d] uppercase tracking-wider">Mappa OK</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappaSelezionePosizione;
