import AppMap from '@/src/components/map/Map';
import { Filter, Search } from 'lucide-react';

export default function Mappa() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800 p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cerca segnalazione..." 
            className="pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white focus:border-indigo-500 outline-none w-64 transition-colors"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-600" />
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 hover:text-white transition-colors">
            <Filter className="h-3 w-3" /> Specie
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 hover:text-white transition-colors">
            <Filter className="h-3 w-3" /> Stato
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative p-6">
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700">
          <AppMap />
        </div>
        
        {/* Floating cards for quick context */}
        <div className="absolute bottom-12 left-12 z-[1000] hidden lg:block">
          <div className="bg-zinc-900/90 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-zinc-800 w-80">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Legenda Situazione</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Risolta</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">In Corso</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Emergenza</span>
              </div>
            </div>
            <p className="text-[8px] text-zinc-600 mt-8 leading-tight uppercase font-black tracking-[0.3em]">
              Real-time synchronization active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
