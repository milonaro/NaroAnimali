import AppMap from '@/src/components/map/Map';
import { Filter, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

export default function Mappa() {
  const [segnalazioni, setSegnalazioni] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [activeComune, setActiveComune] = useState("naro");

  const formatReportDate = (createdAt: any) => {
    if (!createdAt) return 'Non specificato';
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString('it-IT');
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString('it-IT');
    }
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? 'Non specificato' : d.toLocaleDateString('it-IT');
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) setSiteName(config.siteName);
          if (config.activeComune) setActiveComune(config.activeComune);
        }
      } catch(e) {}
    };
    fetchConfig();
  }, []);

  const cityName = useMemo(() => {
    return siteName.replace("Comune di ", "");
  }, [siteName]);
  
  useEffect(() => {
    const q = query(collection(db, 'segnalazioni'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSegnalazioni(data);
    }, (error) => {
      console.error(error);
    });
    return () => unsubscribe();
  }, []);

  const animalMarkers = useMemo(() => {
    const filtered = segnalazioni.filter(a => {
      const matchSearch = 
        (a.specie || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.indirizzo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.colore || '').toLowerCase().includes(searchQuery.toLowerCase());
      const itemComune = (a.comuneKey || a.comune_key || 'naro').toLowerCase();
      const matchComune = itemComune === activeComune.toLowerCase();
      return matchSearch && matchComune;
    });

    return filtered.map(a => ({
      lat: a.latitudine || 37.2925,
      lng: a.longitudine || 13.7925,
      title: `${a.specie} - ${a.colore || 'Non specificato'}`,
      specie: a.specie === 'CANE' ? 'Cane' : a.specie === 'GATTO' ? 'Gatto' : 'Altro',
      urgenza: (a.urgenza === 'ALTA' || a.urgenza === 'CRITICA' ? 'Alta' : a.urgenza === 'BASSA' ? 'Bassa' : 'Normale') as 'Alta' | 'Normale' | 'Bassa',
      image: a.fotoUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600',
      date: formatReportDate(a.createdAt),
      status: a.stato as 'CREATA' | 'IN_CARICO' | 'PULIZIA' | 'RISOLTA',
      id: a.id,
      address: a.indirizzo || 'Nessun indirizzo specificato',
    }));
  }, [segnalazioni, searchQuery, activeComune]);

  // Compute stats for active municipality
  const stats = useMemo(() => {
    const citySegnalazioni = segnalazioni.filter(a => {
      const itemComune = (a.comuneKey || a.comune_key || 'naro').toLowerCase();
      return itemComune === activeComune.toLowerCase();
    });

    const activeCount = citySegnalazioni.filter(a => a.stato === 'CREATA' || a.stato === 'IN_CARICO').length;
    const resolvedCount = citySegnalazioni.filter(a => a.stato === 'RISOLTA').length;
    return {
      total: citySegnalazioni.length,
      active: activeCount,
      resolved: resolvedCount,
    };
  }, [segnalazioni, activeComune]);

  const mapCenter = useMemo(() => {
    if (selectedId && segnalazioni.length > 0) {
      const found = segnalazioni.find(s => s.id === selectedId);
      if (found && found.latitudine && found.longitudine) {
         return [found.latitudine, found.longitudine] as [number, number];
       }
    }
    return undefined;
  }, [selectedId, segnalazioni]);

  const handleSelectReport = (id: string) => {
    setSearchParams({ id });
  };

  return (
    <div className="bg-gray-50 flex flex-col pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#1e3a5f] tracking-tight mb-1">Mappa del Territorio</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Monitoraggio Geografico delle segnalazioni a {cityName} in tempo reale.
            </p>
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Filtra per specie o via..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#1e3a5f] focus:border-[#15803d] outline-none w-64 transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Dual-Pane Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
          
          {/* Left Pane: Real maps */}
          <div className="lg:col-span-8 flex flex-col h-[550px] lg:h-[650px] relative">
            <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden border border-gray-200 shadow-xl bg-white">
              <AppMap markers={animalMarkers} interactive={true} center={mapCenter} />
            </div>
          </div>

          {/* Right Pane: Live feeds and statistics */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-[550px] lg:h-[650px]">
            
            {/* Quick Metrics Statistics */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm grid grid-cols-3 gap-3 shrink-0">
              <div className="text-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Segnalazioni</p>
                <p className="text-xl font-black text-[#1e3a5f] mt-1">{stats.total}</p>
              </div>
              <div className="text-center p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[9px] font-black uppercase text-amber-600 tracking-wider">Attive</p>
                <p className="text-xl font-black text-amber-700 mt-1">{stats.active}</p>
              </div>
              <div className="text-center p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Risolte</p>
                <p className="text-xl font-black text-emerald-700 mt-1">{stats.resolved}</p>
              </div>
            </div>

            {/* List of active territorial updates */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 shrink-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#1e3a5f] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Feed Live Segnalazioni
                </p>
                <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                  {animalMarkers.length} risultati
                </span>
              </div>

              {/* Scrollable list container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {animalMarkers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                    <Filter className="h-8 w-8 text-slate-300" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nessuna segnalazione</p>
                    <p className="text-[10px] text-gray-400">Prova a modificare i filtri di ricerca in cima.</p>
                  </div>
                ) : (
                  animalMarkers.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectReport(item.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3 group relative cursor-pointer ${
                          isSelected 
                            ? 'bg-[#15803d]/5 border-[#15803d]/30 ring-2 ring-[#15803d]/10' 
                            : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="h-14 w-14 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img 
                            src={item.image} 
                            alt="" 
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                          />
                        </div>

                        {/* Text fields */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black text-[#1e3a5f] uppercase tracking-wider truncate">
                              {item.title}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                              item.urgenza === 'Alta' 
                                ? 'bg-red-500/10 text-red-600' 
                                : item.urgenza === 'Normale' 
                                  ? 'bg-amber-500/10 text-amber-600' 
                                  : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                              {item.urgenza}
                            </span>
                          </div>

                          <p className="text-[10px] text-gray-400 font-bold truncate">
                            {item.address}
                          </p>

                          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                            <span>Sincronizzato: {item.date}</span>
                            <span className="text-[#15803d] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Centra mappa &rarr;
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Emergency Info Box */}
            <div className="bg-gradient-to-br from-[#101b3a] to-[#1e3a5f] text-white rounded-xl p-4 shadow-sm space-y-2.5 shrink-0 text-xs">
              <p className="font-extrabold uppercase tracking-widest text-[9px] text-[#22c55e]">Pronto Intervento Comune</p>
              <p className="text-[#94a3b8] text-[10px] leading-relaxed">
                In caso di animali feriti gravemente sul suolo pubblico, pericolo imminente o randagismo aggressivo sul territorio, contatta immediatamente:
              </p>
              <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-200">
                <p className="flex items-center justify-between">
                  <span>Veterinario Convenzionato:</span>
                  <span className="text-[#22c55e]">0922 941122</span>
                </p>
                <p className="flex items-center justify-between border-t border-white/5 pt-1">
                  <span>Polizia Municipale Naro:</span>
                  <span className="text-[#22c55e]">0922 941111</span>
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
