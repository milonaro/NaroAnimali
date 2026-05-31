import AppMap from '@/src/components/map/Map';
import { Filter, Search } from 'lucide-react';

export default function Mappa() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="bg-white border-b border-gray-100 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cerca segnalazione..." 
            className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-emerald-500 w-64"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-100">
            <Filter className="h-4 w-4" /> Specie: Tutti
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-100">
            <Filter className="h-4 w-4" /> Stato: Aperti
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <AppMap />
        
        {/* Floating cards for quick context */}
        <div className="absolute bottom-8 left-8 z-[1000] hidden lg:block">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-80">
            <h3 className="font-bold text-gray-900 mb-2">Legenda</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                <span className="text-sm text-gray-600">Segnalazione risolta</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-200"></div>
                <span className="text-sm text-gray-600">Intervento in corso</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-200"></div>
                <span className="text-sm text-gray-600">Nuova segnalazione (Alta priorità)</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-text-gray-400 mt-6 leading-tight uppercase font-bold tracking-widest">
              Aggiornamento in tempo reale
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
