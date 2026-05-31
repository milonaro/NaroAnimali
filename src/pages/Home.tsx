import { ChevronRight, ShieldCheck, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppMap from '@/src/components/map/Map';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[800px]">
        
        {/* Main Featured Card - Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 flex flex-col justify-between relative overflow-hidden group shadow-2xl"
        >
          <div className="z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6 block">Istituzionale • Naro (AG)</span>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1] uppercase tracking-tighter text-white mb-8">
              Neo-Zen <br/>Animal <br/>Care
            </h1>
            <p className="text-zinc-400 text-sm font-semibold uppercase tracking-widest max-w-[280px] leading-relaxed">
              Reimmaginare la tutela animale attraverso il minimalismo digitale e la trasparenza.
            </p>
          </div>
          
          <div className="z-10 flex flex-wrap gap-4 mt-12">
            <Link to="/segnala" className="bg-white text-zinc-950 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2">
              Segnala Ora <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-500"></div>
        </motion.div>

        {/* Stats Card - White focus */}
        <div className="md:col-span-1 md:row-span-1 bg-white text-zinc-950 border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col justify-center items-center shadow-xl">
          <span className="text-7xl font-black tracking-tighter leading-none">98%</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-zinc-500">Tasso di Risoluzione</span>
        </div>

        {/* Status Card - Booking style */}
        <div className="md:col-span-1 md:row-span-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Stato Servizio</span>
          </div>
          <div className="text-2xl font-black uppercase tracking-tighter leading-tight text-white">
            Operativo <br/>H24 • 7/7
          </div>
        </div>

        {/* Quote / Vision Card */}
        <div className="md:col-span-2 md:row-span-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 flex flex-col justify-center shadow-lg">
          <p className="text-2xl italic font-serif text-zinc-200 leading-relaxed">
            "Non gestiamo solo segnalazioni; coordiniamo azioni che risuonano con la sensibilità umana della nostra città."
          </p>
          <div className="mt-8 flex items-center space-x-4">
            <div className="w-12 h-[1px] bg-zinc-800"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600">Visione Civica • Naro</span>
          </div>
        </div>

        {/* Map Preview Card */}
        <div className="md:col-span-3 md:row-span-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-4 flex flex-col shadow-2xl relative overflow-hidden h-[300px] md:h-full group">
          <div className="absolute top-8 left-8 z-20">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Territorio</span>
          </div>
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0 duration-700">
            <AppMap />
          </div>
          <Link to="/mappa" className="absolute bottom-8 right-8 z-20 w-12 h-12 bg-white text-zinc-950 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
            <Search className="h-5 w-5" />
          </Link>
        </div>

        {/* Expertise List - Services style */}
        <div className="md:col-span-1 md:row-span-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">Expertise</span>
          <ul className="space-y-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            <li className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              <span>Primo Soccorso</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              <span>Censimento</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              <span>Adozioni Collettive</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              <span>Sanificazione</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
