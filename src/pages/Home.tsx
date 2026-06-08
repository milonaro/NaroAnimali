import { ChevronRight, ShieldCheck, MapPin, Search, PawPrint, HelpCircle, Briefcase, CheckCircle, Info, Clock, UserCheck, Map as MapIcon, Filter, Dog, Cat, SlidersHorizontal, ArrowRight, Heart, CheckCircle2, AlertCircle, MousePointer2, ArrowUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppMap from '@/src/components/map/Map';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride } from 'react-joyride';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface SegnalazioneDoc {
  id: string;
  specie: string;
  taglia?: string;
  colore?: string;
  condizioni?: string;
  indirizzo?: string;
  fotoUrl?: string;
  createdAt: string;
  stato: string;
  latitudine: number;
  longitudine: number;
  nomeSegnalante?: string;
  urgenza?: string;
}

export default function Home() {
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [activeComune, setActiveComune] = useState(() => (localStorage.getItem('active_comune') || 'naro').toLowerCase());

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) setSiteName(config.siteName);
          if (config.activeComune) {
            const lowKey = config.activeComune.toLowerCase();
            localStorage.setItem('active_comune', lowKey);
            setActiveComune(lowKey);
          }
        }
      } catch(e) {}
    };
    fetchConfig();
  }, []);

  const cityName = useMemo(() => {
    return siteName.replace("Comune di ", "");
  }, [siteName]);

  const [runTour, setRunTour] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  
  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneDoc[]>([]);
  
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
    const q = query(collection(db, 'segnalazioni'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SegnalazioneDoc[];
      setSegnalazioni(data);
    }, (error) => {
      console.error(error);
    });
    return () => unsubscribe();
  }, []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'Tutti' | 'Cane' | 'Gatto'>('Tutti');
  const [locationFilter, setLocationFilter] = useState('Tutte');

  const comuneSegnalazioni = useMemo(() => {
    return segnalazioni.filter(s => {
      const sKey = (s as any).comuneKey || '';
      return sKey.toLowerCase() === activeComune.toLowerCase();
    });
  }, [segnalazioni, activeComune]);

  const filteredAnimals = useMemo(() => {
    return comuneSegnalazioni.filter(animal => {
      const matchesSearch = 
        (animal.specie?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (animal.colore?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (animal.indirizzo?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesSpecies = speciesFilter === 'Tutti' || (animal.specie === 'CANE' && speciesFilter === 'Cane') || (animal.specie === 'GATTO' && speciesFilter === 'Gatto');
      const matchesLocation = locationFilter === 'Tutte' || animal.indirizzo === locationFilter;
      
      return matchesSearch && matchesSpecies && matchesLocation;
    });
  }, [searchQuery, speciesFilter, locationFilter, comuneSegnalazioni]);

  const uniqueLocations = useMemo(() => {
    const locs = comuneSegnalazioni.map(a => a.indirizzo).filter(Boolean) as string[];
    return ['Tutte', ...new Set(locs)];
  }, [comuneSegnalazioni]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') === 'true') {
      setRunTour(true);
      // Clean up URL without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTourFinish = (data: any) => {
    if (['finished', 'skipped'].includes(data.status)) {
      localStorage.setItem('has-seen-tour-naro', 'true');
      setRunTour(false);
    }
  };

  const steps: any[] = [
    {
      target: '#hero-step',
      title: '🌟 Benvenuto su AnimalHub PA',
      content: `Il portale civico ufficiale ed esclusivo del ${siteName} per la tutela, segnalazione e salvaguardia dei nostri amici a quattro zampe.`,
      placement: 'center',
    },
    {
      target: '#segnala-step',
      title: '📍 Invia Segnalazione (Modulo A)',
      content: `Da qui puoi avviare la segnalazione controllata e geolocalizzata di un cane o gatto randagio in difficoltà sul territorio di ${cityName}.`,
      placement: 'bottom',
    },
    {
      target: '#how-it-works-step',
      title: '🔄 Il Ciclo di Gestione',
      content: 'Segui il processo in 4 semplici passaggi: dall\'identificazione all\'intervento, fino alla firma digitale COF di affido.',
      placement: 'center',
    },
    {
      target: '#map-step',
      title: '🗺️ Mappa Interattiva Real-Time',
      content: 'Monitora in tempo reale la presenza e la cura degli animali registrati nel territorio con geolocalizzazione ufficiale.',
      placement: 'top',
    },
    {
      target: '#numbers-step',
      title: '📊 Trasparenza e Statistiche',
      content: 'Controlla l\'efficacia sul campo degli operatori e l\'andamento delle vaccinazioni e adozioni sul nostro territorio.',
      placement: 'top',
    },
  ];

  const animalMarkers = useMemo(() => {
    return comuneSegnalazioni.map(a => ({
      lat: a.latitudine || 37.2925,
      lng: a.longitudine || 13.7925,
      title: `${a.specie} - ${a.colore || 'Non specificato'}`,
      specie: a.specie === 'CANE' ? 'Cane' : a.specie === 'GATTO' ? 'Gatto' : 'Altro',
      urgenza: (a.urgenza === 'ALTA' || a.urgenza === 'CRITICA' ? 'Alta' : a.urgenza === 'BASSA' ? 'Bassa' : 'Normale') as 'Alta' | 'Normale' | 'Bassa',
      image: a.fotoUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600',
      date: formatReportDate(a.createdAt),
      status: a.stato as 'CREATA' | 'IN_CARICO' | 'PULIZIA' | 'RISOLTA'
    }));
  }, [comuneSegnalazioni]);

  const JoyrideAny = Joyride as any;

  const CustomTooltip = ({
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    isLastStep,
  }: any) => (
    <div {...tooltipProps} className="bg-white rounded-2xl md:rounded-[24px] shadow-2xl p-5 md:p-8 w-[95vw] sm:w-[400px] md:w-[600px] border border-gray-100 relative z-[10000] flex flex-col justify-between mx-auto overflow-hidden">
      {step.title && (
        <h3 className="text-xl md:text-2xl font-black text-[#101b3a] mb-3 leading-tight tracking-tight">
          {step.title}
        </h3>
      )}
      <div className="text-slate-600 font-medium mb-8 leading-relaxed text-base">
        {step.content}
      </div>
      <div className="flex items-center justify-between">
        <button
          {...closeProps}
          className="text-red-400 font-bold text-[11px] uppercase tracking-widest hover:text-red-600 transition-colors cursor-pointer p-2 -ml-2"
        >
          Salta
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-[#101b3a] transition-colors cursor-pointer px-4 py-3"
            >
              Indietro
            </button>
          )}
          <button
            {...primaryProps}
            className="bg-[#101b3a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#15803d] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#15803d]/30 transition-all cursor-pointer"
          >
            {isLastStep ? 'Ho capito' : 'Avanti'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <JoyrideAny
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        tooltipComponent={CustomTooltip}
        callback={handleTourFinish}
        floaterProps={{
          disableAnimation: true,
          styles: {
            floater: {
              zIndex: 99999,
            },
          },
        }}
        styles={{
          options: {
            arrowColor: '#ffffff',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(16, 27, 58, 0.75)',
            primaryColor: '#15803d',
            textColor: '#101b3a',
            zIndex: 99999,
            width: '100%',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltip: {
            width: 'auto',
            maxWidth: '600px',
            padding: 0
          }
        }}
      />
      {/* Hero Section with Slider */}
      <section id="hero-step" className="relative h-screen min-h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          {currentSlide === 0 ? (
            <motion.div
              key="slide1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-[#14532d]"
            >
              <div className="absolute inset-0 bg-black/40 z-10" />
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10 }}
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2000"
                alt="Tutela Animali"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center pt-24">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="max-w-3xl"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <PawPrint className="h-10 w-10 text-white fill-white/20" />
                    <span className="text-white font-bold uppercase tracking-[0.3em] text-xs">{siteName}</span>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                    Segnala un animale randagio a {cityName}
                  </h1>
                  <p className="text-white/80 text-xl mb-12 leading-relaxed max-w-xl font-medium">
                    Aiutaci a tutelare gli animali del nostro territorio. Con una segnalazione puoi contribuire alla loro sicurezza.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link id="segnala-step" to="/segnala" className="bg-[#15803d] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#166534] transition-all flex items-center gap-3 shadow-2xl">
                      <MapPin className="h-5 w-5" /> Fai una segnalazione
                    </Link>
                    <Link to="/mia-area" className="bg-white/10 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-3 border border-white/20 backdrop-blur-md">
                      <Search className="h-5 w-5" /> Monitora segnalazione
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="slide2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-[#101b3a]"
            >
              <div className="absolute inset-0 bg-black/40 z-10" />
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10 }}
                src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=2000"
                alt="Monitoraggio Territorio"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center pt-24">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="max-w-3xl"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck className="h-10 w-10 text-white fill-white/20" />
                    <span className="text-white font-bold uppercase tracking-[0.3em] text-xs">Sicurezza e Tutela</span>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                    Un impegno diretto per la biodiversità
                  </h1>
                  <p className="text-white/80 text-xl mb-12 leading-relaxed max-w-xl font-medium">
                    Monitoriamo costantemente la fauna urbana per garantire una convivenza armoniosa tra cittadini e natura.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link to="/segnala" className="bg-[#15803d] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#166534] transition-all flex items-center gap-3 shadow-2xl">
                      <MapPin className="h-5 w-5" /> Fai una segnalazione
                    </Link>
                    <Link to="/mia-area" className="bg-white/10 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-3 border border-white/20 backdrop-blur-md">
                      <Search className="h-5 w-5" /> Monitora segnalazione
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slider Navigation */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                currentSlide === i ? 'w-12 bg-white' : 'w-3 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Come Funziona Section */}
      <section id="how-it-works-step" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50/50 -skew-x-12 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
             <div className="inline-block px-4 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] mb-6">Processo Step-by-Step</div>
             <h2 className="text-5xl font-black text-[#101b3a] tracking-tight mb-4">Come funziona il portale</h2>
             <p className="text-slate-700 font-semibold text-lg">Quattro semplici passaggi per garantire la protezione ai randagi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { 
                step: "01", 
                title: "Identifica", 
                desc: "Se vedi un cane o un gatto in difficoltà sul territorio di Naro.",
                icon: <Search className="h-6 w-6 text-emerald-600" />,
                img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
              },
              { 
                step: "02", 
                title: "Localizza", 
                desc: "Usa la mappa interattiva per indicare il punto esatto del ritrovamento.",
                icon: <MapPin className="h-6 w-6 text-blue-600" />,
                img: "https://images.unsplash.com/photo-1513360309081-36f5e878fc11?auto=format&fit=crop&q=80&w=600"
              },
              { 
                step: "03", 
                title: "Protocolla", 
                desc: "Aggiungi foto e dettagli. Il sistema genera un codice unico di tracking COF.",
                icon: <Briefcase className="h-6 w-6 text-amber-600" />,
                img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600"
              },
              { 
                step: "04", 
                title: "Monitora", 
                desc: "Segui in tempo reale l'intervento e l'affidamento degli operatori comunali.",
                icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
                img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=600"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group flex flex-col"
              >
                <div className="mb-8 relative rounded-lg overflow-hidden aspect-[4/5] shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <span className="text-white/40 font-black text-4xl block mb-2">{item.step}</span>
                    <h3 className="text-2xl font-black text-white">{item.title}</h3>
                  </div>
                </div>
                <p className="text-slate-800 font-semibold md:text-base text-sm md:text-left text-center md:px-0 px-4 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Animal Exploration Section */}
      <section id="explore-step" className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="max-w-2xl">
               <div className="inline-block px-4 py-1.5 bg-[#15803d]/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] mb-6">Database Animali</div>
               <h2 className="text-5xl font-black text-[#101b3a] tracking-tight mb-4">Esplora gli animali del territorio</h2>
               <p className="text-slate-800 font-semibold text-lg">Cerca per razza, specie o zona di ritrovamento per rimanere aggiornato sulla fauna locale.</p>
            </div>
            <div className="flex bg-white p-2 rounded-lg shadow-xl border border-gray-100 items-center gap-2 group focus-within:ring-2 focus-within:ring-[#15803d]/20 transition-all">
              <Search className="h-5 w-5 text-slate-400 ml-4 group-focus-within:text-[#15803d] transition-colors" />
              <input 
                type="text" 
                placeholder="Cerca Luna, Pastore, Naro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none py-3 pr-6 text-sm font-bold text-[#101b3a] placeholder:text-slate-400 w-[280px]"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div className="flex flex-wrap items-center gap-4">
               <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                  {(['Tutti', 'Cane', 'Gatto'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeciesFilter(s)}
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        speciesFilter === s ? 'bg-[#15803d] text-white shadow-lg' : 'text-slate-600 hover:text-[#101b3a]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
               </div>
               
               <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                  <MapPin className="h-4 w-4 text-[#15803d]" />
                  <select 
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-[#101b3a] pr-4 cursor-pointer"
                  >
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               {/* Legend for Status */}
               <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2 hidden sm:inline">Stato:</span>
                  {[
                    { label: 'Creata', color: 'bg-blue-500' },
                    { label: 'In Carico', color: 'bg-amber-500' },
                    { label: 'Pulizia', color: 'bg-emerald-500' },
                    { label: 'Risolta', color: 'bg-indigo-600' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#1e3a5f]">{item.label}</span>
                    </div>
                  ))}
               </div>

               <div className="flex items-center gap-2 text-slate-700 font-extrabold bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                  <SlidersHorizontal className="h-4 w-4 text-[#15803d]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{filteredAnimals.length} Risultati</span>
               </div>
            </div>
          </div>

          {/* Animals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredAnimals.map((animal) => (
                <motion.div
                  key={animal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all group flex flex-col h-full bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/mappa?id=${animal.id}`)}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img src={animal.fotoUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600'} alt={animal.specie} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-[#15803d]">
                      {animal.specie}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-[#101b3a]">{animal.specie} {animal.colore}</h3>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                        animal.stato === 'CREATA' ? 'bg-blue-50 text-blue-600' :
                        animal.stato === 'IN_CARICO' ? 'bg-amber-50 text-amber-600' :
                        animal.stato === 'INTERVENTO' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {animal.stato === 'CREATA' && <Clock className="h-3 w-3" />}
                        {animal.stato === 'IN_CARICO' && <AlertCircle className="h-3 w-3" />}
                        {animal.stato === 'INTERVENTO' && <MousePointer2 className="h-3 w-3" />}
                        {animal.stato === 'CHIUSA' && <CheckCircle2 className="h-3 w-3" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{animal.stato}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       {animal.specie === 'CANE' ? <Dog className="h-3 w-3 text-[#15803d]" /> : <Cat className="h-3 w-3 text-[#15803d]" />} {animal.taglia}
                    </p>
                    <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[#15803d]" />
                          <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{animal.indirizzo || 'Naro'}</span>
                       </div>
                       <div className="p-2 bg-emerald-50 text-[#15803d] rounded-lg group-hover:bg-[#15803d] group-hover:text-white transition-colors">
                          <ArrowRight className="h-4 w-4" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredAnimals.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-8">
                 <Search className="h-8 w-8 text-[#15803d]/40" />
              </div>
              <h3 className="text-2xl font-bold text-[#101b3a]">Nessun risultato trovato</h3>
              <p className="text-slate-700 font-bold">Prova a cambiare i filtri o la query di ricerca.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSpeciesFilter('Tutti'); setLocationFilter('Tutte'); }}
                className="mt-8 text-[#15803d] font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Resetta Filtri
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Territorio Map Section */}
      <section id="map-step" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#101b3a] flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#15803d]" /> Segnalazioni sul territorio
            </h2>
            <Link to="/mappa" className="text-[#15803d] font-bold flex items-center gap-1 hover:underline">
              Mappa completa <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-2xl border-8 border-white relative">
             <AppMap markers={animalMarkers} />
          </div>
        </div>
      </section>

      {/* Ultime Segnalazioni Section */}
      <section className="py-24 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div className="max-w-2xl">
              <div className="inline-block px-4 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] mb-6">Feed Real-Time</div>
              <h2 className="text-4xl font-black text-[#101b3a] tracking-tight mb-4">Ultime segnalazioni</h2>
              <p className="text-slate-700 font-semibold">Monitoraggio costante gestito dagli amministratori e operatori del {siteName}.</p>
            </div>
            <Link to="/mia-area" className="bg-gray-50 hover:bg-gray-100 text-[#101b3a] px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-gray-100">
               Tutte le attività <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comuneSegnalazioni.slice(0, 4).map((report) => (
              <div key={report.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group cursor-pointer" onClick={() => navigate(`/mappa?id=${report.id}`)}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                  report.stato === 'RISOLTA' || report.stato === 'CHIUSA' ? 'bg-indigo-50 text-indigo-600' : 
                  report.stato === 'IN_CARICO' ? 'bg-amber-50 text-amber-600' : 
                  report.stato === 'INTERVENTO' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {report.stato === 'RISOLTA' || report.stato === 'CHIUSA' ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-[#101b3a] truncate">{report.specie} in {report.indirizzo || cityName}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      report.urgenza === 'ALTA' || report.urgenza === 'CRITICA' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {report.urgenza || 'NORMALE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatReportDate(report.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> {report.nomeSegnalante || 'Anonimo'}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-[#15803d] group-hover:text-white transition-all">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numeri Section */}
      <section id="numbers-step" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#101b3a] mb-16">Numeri del territorio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-12 rounded-lg border border-gray-100 flex flex-col items-center">
              <Info className="h-5 w-5 text-slate-500 mb-4" />
              <div className="text-6xl font-bold text-[#101b3a] mb-2">{comuneSegnalazioni.length}</div>
              <div className="text-slate-800 font-bold uppercase tracking-widest text-xs">Segnalazioni totali</div>
            </div>
            <div className="bg-[#15803d]/5 p-12 rounded-lg border border-[#15803d]/10 flex flex-col items-center">
              <CheckCircle className="h-5 w-5 text-[#15803d]/40 mb-4" />
              <div className="text-6xl font-bold text-[#15803d] mb-2">{comuneSegnalazioni.filter(s => s.stato === 'CHIUSA' || s.stato === 'RISOLTA').length}</div>
              <div className="text-[#15803d]/60 font-bold uppercase tracking-widest text-xs">Segnalazioni risolte</div>
            </div>
            <div className="bg-[#15803d]/5 p-12 rounded-lg border border-[#15803d]/10 flex flex-col items-center">
              <PawPrint className="h-5 w-5 text-[#15803d]/40 mb-4" />
              <div className="text-6xl font-bold text-[#15803d] mb-2">{comuneSegnalazioni.length * 3 + 12}</div>
              <div className="text-[#15803d]/60 font-bold uppercase tracking-widest text-xs">Animali censiti</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech & Innovation Section */}
      <section className="py-24 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#101b3a] mb-4">Innovazione per il Territorio</h2>
            <p className="text-slate-700 font-semibold text-lg">Come usiamo le migliori tecnologie per rendere semplice, veloce e sicura la tutela degli animali a Naro.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                tag: "Foto Intelligente (IA)",
                tagColor: "text-emerald-700 bg-emerald-50",
                title: "Riconoscimento col Telefono",
                desc: "Usa la fotocamera per scattare una foto. Il nostro sistema riconosce subito se è un cane o un gatto, aiutando i soccorritori ad agire in modo mirato.",
                bgImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
                icon: <PawPrint className="h-5 w-5" />
              },
              {
                tag: "Geolocalizzazione GPS",
                tagColor: "text-blue-700 bg-blue-50",
                title: "Mappa e Posizione Esatta",
                desc: "Premi un pulsante e la tua posizione GPS viene segnata sulla mappa di Naro. Così gli operatori sanno subito dove andare senza perdite di tempo.",
                bgImage: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=800",
                icon: <MapPin className="h-5 w-5" />
              },
              {
                tag: "Notifiche SMS ed Email",
                tagColor: "text-amber-700 bg-amber-50",
                title: "Aggiornamenti in Tempo Reale",
                desc: "Rimani informato sullo stato della tua pratica: ricevi un avviso automatico quando un operatore o veterinario si reca sul posto o prende in affido l'animale.",
                bgImage: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=800",
                icon: <Clock className="h-5 w-5" />
              },
              {
                tag: "Privacy al 100%",
                tagColor: "text-red-700 bg-red-50",
                title: "I Tuoi Dati Protetti e Sicuri",
                desc: "Il portale è conforme alle leggi sulla privacy. Nome ed email rimangono crittografati e protetti, visibili solo al personale autorizzato del Comune.",
                bgImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
                icon: <ShieldCheck className="h-5 w-5" />
              },
              {
                tag: "Adozione Facile",
                tagColor: "text-indigo-700 bg-indigo-50",
                title: "Regala una Nuova Casa",
                desc: "Accedi all'elenco degli animali pronti per essere adottati. Ti mettiamo in contatto diretto con canili e rifugi autorizzati per trovare un nuovo amico.",
                bgImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800",
                icon: <Heart className="h-5 w-5" />
              },
              {
                tag: "Veterinari Locali",
                tagColor: "text-purple-700 bg-purple-50",
                title: "Pronto Intervento e Cure",
                desc: "I medici veterinari e le associazioni di Naro sono collegati alla piattaforma e ricevono all'istante le notifiche per soccorrere gli animali feriti.",
                bgImage: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800",
                icon: <Briefcase className="h-5 w-5" />
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 min-h-[280px]"
              >
                {/* Background images: subtle initially, strengthens on hover */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-30 scale-100 group-hover:scale-110 transition-all duration-700 pointer-events-none"
                  style={{ backgroundImage: `url(${item.bgImage})` }}
                />
                
                {/* Tech glow gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-slate-900/0 group-hover:from-emerald-500/5 group-hover:to-slate-900/5 transition-all duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`p-2.5 rounded-xl ${item.tagColor} transition-transform group-hover:scale-110 duration-300`}>{item.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.tagColor.split(' ')[0]}`}>{item.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#101b3a] group-hover:text-[#15803d] transition-colors duration-300 mb-4">{item.title}</h3>
                  <p className="text-slate-700 leading-relaxed text-sm font-semibold">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivations Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#101b3a] mb-16">Perché usare AnimalHub PA</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              { 
                title: "Aggiornamenti in tempo reale", 
                desc: "Ricevi notifiche istantanee via email quando la tua segnalazione sul territorio comunale viene presa in carico, controllata o risolta.",
                bgImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: "I tuoi dati sono sicuri", 
                desc: "Sistema totalmente sicuro e conforme alle norme europee sulla privacy (GDPR). Nome ed email rimangono protetti e criptati.",
                bgImage: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: "Segnalazione semplice", 
                desc: "Bastano pochissimi tocchi dallo smartphone: selezioni il tipo di animale, marchi la posizione GPS e carichi una foto scattata sul posto.",
                bgImage: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800"
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 p-8 rounded-2xl bg-white border border-gray-100 min-h-[300px] flex flex-col justify-between"
              >
                {/* Background images: subtle initially, strengthens on hover */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-30 scale-100 group-hover:scale-110 transition-all duration-700 pointer-events-none"
                  style={{ backgroundImage: `url(${item.bgImage})` }}
                />
                
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-slate-900/0 group-hover:from-emerald-500/5 group-hover:to-slate-900/10 transition-all duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                     {i === 0 ? <Clock className="h-7 w-7 text-[#15803d]" /> : i === 1 ? <ShieldCheck className="h-7 w-7 text-[#15803d]" /> : <UserCheck className="h-7 w-7 text-[#15803d]" />}
                  </div>
                  <h3 className="text-2xl font-black text-[#101b3a] group-hover:text-[#15803d] transition-colors duration-300 mb-4">{item.title}</h3>
                  <p className="text-slate-700 leading-relaxed text-base font-semibold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance / Quality badges */}
      <section className="py-12 border-t border-gray-100 flex justify-center gap-12 grayscale opacity-40">
         <div className="flex items-center gap-2 font-bold text-xs"><ShieldCheck className="h-4 w-4" /> Conforme GDPR</div>
         <div className="flex items-center gap-2 font-bold text-xs"><CheckCircle className="h-4 w-4" /> WCAG 2.1 AA</div>
         <div className="flex items-center gap-2 font-bold text-xs"><Info className="h-4 w-4" /> Portale Civico Comune di Naro</div>
      </section>

      {/* Floating Tutorial Button */}
      <button 
        onClick={() => setRunTour(true)}
        className="fixed bottom-20 left-4 md:bottom-8 md:left-8 z-[5000] w-12 h-12 md:w-14 md:h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-white/50 group cursor-pointer"
        aria-label="Avvia Tutorial"
      >
        <HelpCircle className="h-6 w-6 md:h-7 md:w-7 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-[8.5rem] left-4 md:bottom-24 md:left-8 z-[5000] w-12 h-12 md:w-14 md:h-14 bg-[#101b3a] hover:bg-[#15803d] text-white rounded-full shadow-2xl flex items-center justify-center transition-colors hover:scale-110 active:scale-95 border-2 border-white/50 cursor-pointer"
            aria-label="Torna su"
          >
            <ArrowUp className="h-6 w-6 md:h-7 md:w-7" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
