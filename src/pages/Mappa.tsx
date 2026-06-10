import AppMap from '@/src/components/map/Map';
import { Filter, Search, ShieldAlert, Clock, ArrowRight, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

export default function Mappa() {
  const [segnalazioni, setSegnalazioni] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  
  // Hoisted Filter States
  const [specieFilter, setSpecieFilter] = useState('Tutte');
  const [urgenzaFilter, setUrgenzaFilter] = useState('Tutte');
  const [statoFilter, setStatoFilter] = useState('Tutti');

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

  // Filter markers based on all hoisted filters
  const animalMarkers = useMemo(() => {
    const filtered = segnalazioni.filter(a => {
      const matchSearch = 
        (a.specie || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.indirizzo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.colore || '').toLowerCase().includes(searchQuery.toLowerCase());
      const itemComune = (a.comuneKey || a.comune_key || 'naro').toLowerCase();
      const matchComune = itemComune === activeComune.toLowerCase();
      
      const aSpecie = a.specie === 'CANE' ? 'Cane' : a.specie === 'GATTO' ? 'Gatto' : 'Altro';
      const aUrgenza = (a.urgenza === 'ALTA' || a.urgenza === 'CRITICA' ? 'Alta' : a.urgenza === 'BASSA' ? 'Bassa' : 'Normale');

      const matchSpecie = specieFilter === 'Tutte' || aSpecie === specieFilter;
      const matchUrgenza = urgenzaFilter === 'Tutte' || aUrgenza === urgenzaFilter;
      const matchStato = statoFilter === 'Tutti' || a.stato === statoFilter;

      return matchSearch && matchComune && matchSpecie && matchUrgenza && matchStato;
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
  }, [segnalazioni, searchQuery, activeComune, specieFilter, urgenzaFilter, statoFilter]);

  // Dynamic detailed summary of focused report
  const selectedReport = useMemo(() => {
    if (!selectedId) return null;
    const a = segnalazioni.find(s => s.id === selectedId);
    if (!a) return null;
    return {
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
      note: a.note || 'Nessuna descrizione o dettaglio aggiuntivo fornito.',
      noteOperatore: a.noteOperatore || a.operatorNotes || '',
      colore: a.colore || 'Non specificato',
      contatto: a.telefonesegnalante || a.telefonoSegnalante || a.utenteTelefono || 'Non disponibile',
      nomeSegnalante: a.nomeSegnalante || a.utenteNome || 'Cittadino Anonimo',
    };
  }, [selectedId, segnalazioni]);

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
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen" style={{ borderWidth: '0px', paddingTop: '110px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Modern Header block with integrated filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Inquadramento Geografico</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">Mappa del Territorio</h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider">
                Monitoraggio Geografico delle segnalazioni a <span className="text-[#101b3a] font-extrabold">{cityName}</span> in tempo reale.
              </p>
            </div>
            
            {/* Quick stats badges in header */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 border border-slate-200/60 rounded-xl flex items-center gap-2 h-9 bg-slate-50/50">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Segnalazioni: {stats.total}</span>
              </div>
              <div className="px-3 border border-amber-200/60 rounded-xl flex items-center gap-2 h-9 bg-amber-50/50">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Attive: {stats.active}</span>
              </div>
              <div className="px-3 border border-emerald-200/60 rounded-xl flex items-center gap-2 h-9 bg-emerald-50/50">
                <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                <span className="text-[10px] font-black uppercase text-[#15803d] tracking-wider">Risolte: {stats.resolved}</span>
              </div>
            </div>
          </div>

          {/* Integrated filter controls suite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-4 border-t border-slate-100">
            <div className="lg:col-span-4 relative">
              <input 
                type="text" 
                placeholder="Cerca via, specie, colore..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1e3a5f] focus:bg-white focus:border-[#15803d] outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            </div>

            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-xl h-[42px]">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select 
                  value={specieFilter}
                  onChange={(e) => setSpecieFilter(e.target.value)}
                  className="w-full py-1.5 bg-transparent border-none outline-none text-xs font-black uppercase tracking-wider text-[#1e3a5f] cursor-pointer"
                >
                  <option value="Tutte">Tutte le specie</option>
                  <option value="Cane">Solo Cani 🐶</option>
                  <option value="Gatto">Solo Gatti 🐱</option>
                  <option value="Altro">Altro 🐾</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-xl h-[42px]">
                <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" />
                <select 
                  value={urgenzaFilter}
                  onChange={(e) => setUrgenzaFilter(e.target.value)}
                  className="w-full py-1.5 bg-transparent border-none outline-none text-xs font-black uppercase tracking-wider text-[#1e3a5f] cursor-pointer"
                >
                  <option value="Tutte">Ogni Urgenza</option>
                  <option value="Alta">Alta Precisione (ALTA/CRITICA) 🚨</option>
                  <option value="Normale">Normale ⚠️</option>
                  <option value="Bassa">Bassa Priorità ✅</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-xl h-[42px]">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <select 
                  value={statoFilter}
                  onChange={(e) => setStatoFilter(e.target.value)}
                  className="w-full py-1.5 bg-transparent border-none outline-none text-xs font-black uppercase tracking-wider text-[#1e3a5f] cursor-pointer"
                >
                  <option value="Tutti">Ogni Stato</option>
                  <option value="CREATA">Creata</option>
                  <option value="IN_CARICO">In Carico</option>
                  <option value="PULIZIA">Trattamento</option>
                  <option value="RISOLTA">Risolte</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dual-Pane Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch flex-1">
          
          {/* Left Pane: Interactive Territory Map */}
          <div className="lg:col-span-8 flex flex-col h-[500px] sm:h-[550px] lg:h-[650px] relative">
            <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-white">
              <AppMap 
                markers={animalMarkers} 
                interactive={true} 
                center={mapCenter} 
                hideFilters={true} 
                onMarkerClick={handleSelectReport}
              />
            </div>
          </div>

          {/* Right Pane: Live feeds of markers OR Detailed observations sheet */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-[500px] sm:h-[550px] lg:h-[650px]">
            
            {/* List or Detailed Observations panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col flex-1 overflow-hidden transition-all duration-300">
              {selectedReport ? (
                /* DETAILED REPORT SHEET */
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Detail Panel Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                    <button 
                      onClick={() => setSearchParams({})}
                      className="text-xs font-black uppercase text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-all cursor-pointer bg-transparent border-none outline-none font-bold"
                    >
                      &larr; Torna alla Lista
                    </button>
                    <span className="text-[9px] font-black tracking-widest bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100">
                      ID: {selectedReport.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  {/* Detail Content (Scrollable) */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                    
                    {/* Animal Photo & Overlay Badges */}
                    <div className="relative h-44 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img 
                        src={selectedReport.image} 
                        alt={selectedReport.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${
                          selectedReport.urgenza === 'Alta' ? 'bg-red-500' : selectedReport.urgenza === 'Normale' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                          Urgenza: {selectedReport.urgenza}
                        </span>
                        
                        <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${
                          selectedReport.status === 'RISOLTA' 
                            ? 'bg-[#15803d]' 
                            : selectedReport.status === 'IN_CARICO' 
                              ? 'bg-amber-600' 
                              : selectedReport.status === 'PULIZIA'
                                ? 'bg-blue-600'
                                : 'bg-sky-600'
                        }`}>
                          {selectedReport.status === 'RISOLTA' && 'Risolto ✅'}
                          {selectedReport.status === 'IN_CARICO' && 'In Carico ⏳'}
                          {selectedReport.status === 'PULIZIA' && 'Trattamento 🩺'}
                          {selectedReport.status === 'CREATA' && 'Registrata 📝'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Speciazione</span>
                        <p className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1">
                          {selectedReport.specie === 'Cane' ? '🐶 Cane' : selectedReport.specie === 'Gatto' ? '🐱 Gatto' : '🐾 Altro'}
                        </p>
                      </div>
                      
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Dettaglio Colore</span>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                          🎨 {selectedReport.colore}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Sincronizzazione</span>
                        <p className="text-xs font-black text-slate-700 flex items-center gap-1">
                          📅 {selectedReport.date}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Contatto Segnalante</span>
                        <p className="text-xs font-black text-slate-700 truncate">
                          📞 {selectedReport.contatto}
                        </p>
                      </div>
                    </div>

                    {/* Location Address */}
                    <div className="p-3 bg-slate-100/50 rounded-xl border border-slate-200/50 flex gap-2.5 items-start">
                      <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Ubicazione Segnalata</span>
                        <p className="text-xs font-black text-slate-700 leading-snug">{selectedReport.address}</p>
                      </div>
                    </div>

                    {/* Reporter Notes & Observations */}
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Osservazioni del Cittadino</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed font-semibold">
                        {selectedReport.note}
                      </div>
                    </div>

                    {/* Operational Treatment notes if available */}
                    {selectedReport.noteOperatore && (
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-black text-[#15803d] uppercase tracking-widest block flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#15803d]" />
                          Aggiornamenti & Trattamento Veterinario
                        </span>
                        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs text-[#15803d] leading-relaxed font-semibold">
                          {selectedReport.noteOperatore}
                        </div>
                      </div>
                    )}

                    {/* Status Tracking Steps Progress */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Avanzamento Segnalazione</span>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#15803d] text-white shrink-0">
                            ✓
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-extrabold text-slate-700 leading-none">Segnalazione Ricevuta</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Sincronizzato al database centrale</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            selectedReport.status !== 'CREATA' ? 'bg-[#15803d] text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {selectedReport.status !== 'CREATA' ? '✓' : '2'}
                          </div>
                          <div className="text-left">
                            <p className={`text-xs font-extrabold leading-none ${selectedReport.status !== 'CREATA' ? 'text-slate-700' : 'text-slate-400'}`}>Presa in carico</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Assegnata a operatore o canile</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            selectedReport.status === 'RISOLTA' ? 'bg-[#15803d] text-white' : (selectedReport.status === 'PULIZIA' || selectedReport.status === 'IN_CARICO' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400')
                          }`}>
                            {selectedReport.status === 'RISOLTA' ? '✓' : '3'}
                          </div>
                          <div className="text-left">
                            <p className={`text-xs font-extrabold leading-none ${selectedReport.status !== 'CREATA' ? 'text-slate-700' : 'text-slate-400'}`}>Trattamento & Ricovero</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Sotto custodia / cure mediche</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            selectedReport.status === 'RISOLTA' ? 'bg-[#15803d] text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {selectedReport.status === 'RISOLTA' ? '✓' : '4'}
                          </div>
                          <div className="text-left">
                            <p className={`text-xs font-extrabold leading-none ${selectedReport.status === 'RISOLTA' ? 'text-slate-700' : 'text-slate-400'}`}>Risolta con successo</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Animale salvato o ricollocato</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* LIVE FEED OF REVEALED MARKERS list */
                <div className="flex flex-col h-full overflow-hidden">
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
                        <p className="text-[10px] text-gray-400">Prova a modificare i filtri o la ricerca in cima.</p>
                      </div>
                    ) : (
                      animalMarkers.map((item) => {
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectReport(item.id)}
                            className="w-full text-left p-3 rounded-xl border border-slate-100 transition-all duration-200 flex items-start gap-3 group relative cursor-pointer bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          >
                            {/* Thumbnail */}
                            <div className="h-14 w-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
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
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                                  item.urgenza === 'Alta' 
                                    ? 'bg-red-500/10 text-red-600' 
                                    : item.urgenza === 'Normale' 
                                      ? 'bg-amber-500/10 text-amber-600' 
                                      : 'bg-emerald-500/10 text-emerald-600'
                                }`}>
                                  {item.urgenza}
                                </span>
                              </div>

                              <p className="text-[10px] text-gray-400 font-semibold truncate text-left">
                                {item.address}
                              </p>

                              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                                <span>Sincronizzato: {item.date}</span>
                                <span className="text-[#15803d] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Dettagli &rarr;
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Info Box */}
            <div className="bg-gradient-to-br from-[#101b3a] to-[#1e3a5f] text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5 shrink-0 text-xs">
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
                  <span>Polizia Municipale {cityName}:</span>
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
