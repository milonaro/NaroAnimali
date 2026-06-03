import AppMap from '@/src/components/map/Map';
import { Filter, Search } from 'lucide-react';

export default function Mappa() {
  return (
    <div className="bg-gray-50 flex flex-col pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-[#1e3a5f] tracking-tight mb-2">Mappa del territorio</h1>
            <p className="text-gray-500 font-medium">Monitoraggio in tempo reale delle segnalazioni e della presenza animale a Naro.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cerca segnalazione..." 
                className="pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] focus:border-[#15803d] outline-none w-64 transition-colors shadow-sm"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="h-[700px] w-full relative">
          <AppMap />
        </div>
      </div>
    </div>
  );
}
