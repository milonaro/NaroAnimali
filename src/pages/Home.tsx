import { ChevronRight, ShieldCheck, MapPin, Search, PawPrint, HelpCircle, Briefcase, CheckCircle, Info, Clock, UserCheck, Map as MapIcon, Filter, Dog, Cat, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppMap from '@/src/components/map/Map';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride } from 'react-joyride';
import { useState, useEffect, useMemo } from 'react';

interface Animal {
  id: string;
  name: string;
  species: 'Cane' | 'Gatto' | 'Altro';
  breed: string;
  location: string;
  image: string;
  date: string;
  status: 'In attesa' | 'In cura' | 'Adottato';
}

const SAMPLE_ANIMALS: Animal[] = [
  {
    id: '1',
    name: 'Luna',
    species: 'Cane',
    breed: 'Pastore Siciliano',
    location: 'Quartiere Carmine',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=600',
    date: '02/06/2026',
    status: 'In cura'
  },
  {
    id: '2',
    name: 'Oliver',
    species: 'Gatto',
    breed: 'Europeo',
    location: 'Via Vittorio Emanuele',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600',
    date: '01/06/2026',
    status: 'In attesa'
  },
  {
    id: '3',
    name: 'Max',
    species: 'Cane',
    breed: 'Meticcio',
    location: 'Piazza Garibaldi',
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=600',
    date: '31/05/2026',
    status: 'In attesa'
  },
  {
    id: '4',
    name: 'Milo',
    species: 'Gatto',
    breed: 'Soriano',
    location: 'Contrada San Giovanni',
    image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=600',
    date: '30/05/2026',
    status: 'In cura'
  }
];

export default function Home() {
  const [runTour, setRunTour] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'Tutti' | 'Cane' | 'Gatto'>('Tutti');
  const [locationFilter, setLocationFilter] = useState('Tutte');

  const filteredAnimals = useMemo(() => {
    return SAMPLE_ANIMALS.filter(animal => {
      const matchesSearch = 
        animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecies = speciesFilter === 'Tutti' || animal.species === speciesFilter;
      const matchesLocation = locationFilter === 'Tutte' || animal.location === locationFilter;
      
      return matchesSearch && matchesSpecies && matchesLocation;
    });
  }, [searchQuery, speciesFilter, locationFilter]);

  const uniqueLocations = useMemo(() => {
    return ['Tutte', ...new Set(SAMPLE_ANIMALS.map(a => a.location))];
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('has-seen-tour-naro');
    if (!hasSeenTour) {
      setRunTour(true);
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
      content: 'Benvenuto su NaroAnimali, la piattaforma ufficiale per la tutela degli animali del Comune di Naro.',
    },
    {
      target: '#segnala-step',
      content: 'Da qui puoi inviare una segnalazione geolocalizzata in pochi clic.',
    },
    {
      target: '#how-it-works-step',
      content: 'Scopri il processo di gestione: dalla tua segnalazione all\'intervento degli operatori.',
    },
    {
      target: '#map-step',
      content: 'Visualizza in tempo reale le attività sul territorio e lo stato delle segnalazioni.',
    },
    {
      target: '#numbers-step',
      content: 'Monitoriamo costantemente i risultati per garantire il benessere di tutti gli animali.',
    }
  ];

  const JoyrideAny = Joyride as any;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <JoyrideAny
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        callback={handleTourFinish}
        locale={{
          back: 'Indietro',
          close: 'Chiudi',
          last: 'Fine',
          next: 'Avanti',
          skip: 'Salta tour'
        }}
      />
      {/* Hero Section with Slider */}
      <section id="hero-step" className="relative h-[85vh] lg:h-[90vh] overflow-hidden">
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
              <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="max-w-3xl"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <PawPrint className="h-10 w-10 text-white fill-white/20" />
                    <span className="text-white font-bold uppercase tracking-[0.3em] text-xs">Comune di Naro</span>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                    Segnala un animale randagio a Naro
                  </h1>
                  <p className="text-white/80 text-xl mb-12 leading-relaxed max-w-xl font-medium">
                    Aiutaci a tutelare gli animali del nostro territorio. Con una segnalazione puoi contribuire alla loro sicurezza.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link id="segnala-step" to="/segnala" className="bg-[#15803d] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#166534] transition-all flex items-center gap-3 shadow-2xl">
                      <MapPin className="h-5 w-5" /> Fai una segnalazione
                    </Link>
                    <Link to="/mia-area" className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-3 border border-white/20 backdrop-blur-md">
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
              className="absolute inset-0 bg-[#1e3a5f]"
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
              <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
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
                    <Link to="/mappa" className="bg-white text-[#101b3a] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all flex items-center gap-3 shadow-2xl">
                      <MapIcon className="h-5 w-5" /> Esplora il territorio
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
             <h2 className="text-5xl font-black text-[#1e3a5f] tracking-tight mb-4">Come funziona il portale</h2>
             <p className="text-gray-400 font-medium text-lg">Quattro semplici passaggi per garantire la protezione ai randagi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { 
                step: "01", 
                title: "Identifica", 
                desc: "Se vedi un animale in difficoltà sul territorio di Naro.",
                icon: <Search className="h-6 w-6 text-emerald-600" />,
                img: "https://images.unsplash.com/photo-1516731415730-0c6417231811?auto=format&fit=crop&q=80&w=600"
              },
              { 
                step: "02", 
                title: "Localizza", 
                desc: "Usa la mappa interattiva per indicare il punto esatto del ritrovamento.",
                icon: <MapPin className="h-6 w-6 text-blue-600" />,
                img: "https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=600"
              },
              { 
                step: "03", 
                title: "Protocolla", 
                desc: "Aggiungi foto e dettagli. Riceverai un codice unico di tracking.",
                icon: <Briefcase className="h-6 w-6 text-amber-600" />,
                img: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=600"
              },
              { 
                step: "04", 
                title: "Monitora", 
                desc: "Segui in tempo reale l'intervento degli operatori comunali.",
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
                className="relative group"
              >
                <div className="mb-8 relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <span className="text-white/40 font-black text-4xl block mb-2">{item.step}</span>
                    <h3 className="text-2xl font-black text-white">{item.title}</h3>
                  </div>
                </div>
                <p className="text-gray-500 font-medium px-4">{item.desc}</p>
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
               <h2 className="text-5xl font-black text-[#1e3a5f] tracking-tight mb-4">Esplora gli animali del territorio</h2>
               <p className="text-gray-400 font-medium text-lg">Cerca per razza, specie o zona di ritrovamento per rimanere aggiornato sulla fauna locale.</p>
            </div>
            <div className="flex bg-white p-2 rounded-2xl shadow-xl border border-gray-100 items-center gap-2 group focus-within:ring-2 focus-within:ring-[#15803d]/20 transition-all">
              <Search className="h-5 w-5 text-gray-300 ml-4 group-focus-within:text-[#15803d] transition-colors" />
              <input 
                type="text" 
                placeholder="Cerca Luna, Pastore, Naro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none py-3 pr-6 text-sm font-bold text-[#1e3a5f] placeholder:text-gray-300 w-[280px]"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
             <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                {(['Tutti', 'Cane', 'Gatto'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeciesFilter(s)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      speciesFilter === s ? 'bg-[#15803d] text-white shadow-lg' : 'text-gray-400 hover:text-[#1e3a5f]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
             
             <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <MapPin className="h-4 w-4 text-[#15803d]" />
                <select 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] pr-4 cursor-pointer"
                >
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
             </div>

             <div className="ml-auto flex items-center gap-2 text-gray-400">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{filteredAnimals.length} Risultati</span>
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
                  className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all group flex flex-col h-full"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img src={animal.image} alt={animal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-[#15803d]">
                      {animal.species}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-[#1e3a5f]">{animal.name}</h3>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          animal.status === 'In attesa' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{animal.status}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       {animal.species === 'Cane' ? <Dog className="h-3 w-3" /> : <Cat className="h-3 w-3" />} {animal.breed}
                    </p>
                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-300" />
                          <span className="text-[10px] font-bold text-gray-400">{animal.location}</span>
                       </div>
                       <Link to="/segnala" className="p-2 bg-emerald-50 text-[#15803d] rounded-xl group-hover:bg-[#15803d] group-hover:text-white transition-colors">
                          <ArrowRight className="h-4 w-4" />
                       </Link>
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
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                 <Search className="h-8 w-8 text-gray-200" />
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f]">Nessun risultato trovato</h3>
              <p className="text-gray-400 font-medium">Prova a cambiare i filtri o la query di ricerca.</p>
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
            <h2 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#15803d]" /> Segnalazioni sul territorio
            </h2>
            <Link to="/mappa" className="text-[#15803d] font-bold flex items-center gap-1 hover:underline">
              Mappa completa <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white relative">
             <AppMap />
          </div>
        </div>
      </section>

      {/* Numeri Section */}
      <section id="numbers-step" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#1e3a5f] mb-16">Numeri del territorio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-12 rounded-[2rem] border border-gray-100 flex flex-col items-center">
              <Info className="h-5 w-5 text-gray-400 mb-4" />
              <div className="text-6xl font-bold text-[#1e3a5f] mb-2">2</div>
              <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Segnalazioni totali</div>
            </div>
            <div className="bg-[#15803d]/5 p-12 rounded-[2rem] border border-[#15803d]/10 flex flex-col items-center">
              <CheckCircle className="h-5 w-5 text-[#15803d]/40 mb-4" />
              <div className="text-6xl font-bold text-[#15803d] mb-2">0</div>
              <div className="text-[#15803d]/60 font-bold uppercase tracking-widest text-xs">Segnalazioni risolte</div>
            </div>
            <div className="bg-[#15803d]/5 p-12 rounded-[2rem] border border-[#15803d]/10 flex flex-col items-center">
              <PawPrint className="h-5 w-5 text-[#15803d]/40 mb-4" />
              <div className="text-6xl font-bold text-[#15803d] mb-2">0</div>
              <div className="text-[#15803d]/60 font-bold uppercase tracking-widest text-xs">Animali censiti</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech & Innovation Section */}
      <section className="py-24 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1e3a5f] mb-4">Innovazione per il Territorio</h2>
            <p className="text-gray-500 font-medium">Gli ultimi sviluppi nel settore tecnologico applicati alla tutela dell'ambiente e degli animali.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                tag: "IA & Innovazione",
                tagColor: "text-emerald-600 bg-emerald-50",
                title: "Avanzamento dell'Intelligenza Artificiale",
                desc: "L'IA continua a guidare l'innovazione, portando ad applicazioni più sofisticate per il monitoraggio e la protezione della fauna urbana.",
                icon: <Info className="h-5 w-5" />
              },
              {
                tag: "Cloud & Scalabilità",
                tagColor: "text-blue-600 bg-blue-50",
                title: "Infrastrutture Cloud",
                desc: "Il cloud computing rimane una tecnologia fondamentale, garantendo la flessibilità necessaria per gestire migliaia di segnalazioni in tempo reale.",
                icon: <ShieldCheck className="h-5 w-5" />
              },
              {
                tag: "IoT & Connettività",
                tagColor: "text-amber-600 bg-amber-50",
                title: "Internet delle Cose (IoT)",
                desc: "L'IoT espande la sua portata, connettendo sensori sul territorio che generano dati vitali per il pronto intervento veterinario.",
                icon: <MapPin className="h-5 w-5" />
              },
              {
                tag: "Cybersecurity",
                tagColor: "text-red-600 bg-red-50",
                title: "Sicurezza dei Dati",
                desc: "La sicurezza informatica è prioritaria per proteggere le segnalazioni dei cittadini e garantire l'integrità del sistema di intervento.",
                icon: <ShieldCheck className="h-5 w-5" />
              },
              {
                tag: "Connettività 5G",
                tagColor: "text-indigo-600 bg-indigo-50",
                title: "Velocità e AR/VR",
                desc: "Il 5G apre nuove strade per la connettività veloce e applicazioni di realtà aumentata per i soccorsi sul campo.",
                icon: <Clock className="h-5 w-5" />
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className={`p-2 rounded-lg ${item.tagColor}`}>{item.icon}</div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${item.tagColor.split(' ')[0]}`}>{item.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivations Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#1e3a5f] mb-16">Perché usare NaroAnimali</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              { title: "Aggiornamenti in tempo reale", desc: "Ricevi notifiche via email quando la tua segnalazione viene presa in carico o risolta." },
              { title: "I tuoi dati sono sicuri", desc: "Conforme al GDPR. I dati personali sono protetti e accessibili solo al personale autorizzato." },
              { title: "Segnalazione semplice", desc: "Compila il form in pochi minuti. Indica la posizione sulla mappa e descrivi l'animale." }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl border border-gray-100 hover:border-emerald-500/20 transition-all">
                <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-6">
                   {i === 0 ? <Clock className="h-6 w-6 text-[#15803d]" /> : i === 1 ? <ShieldCheck className="h-6 w-6 text-[#15803d]" /> : <UserCheck className="h-6 w-6 text-[#15803d]" />}
                </div>
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance / Quality badges */}
      <section className="py-12 border-t border-gray-100 flex justify-center gap-12 grayscale opacity-40">
         <div className="flex items-center gap-2 font-bold text-xs"><ShieldCheck className="h-4 w-4" /> Conforme GDPR</div>
         <div className="flex items-center gap-2 font-bold text-xs"><CheckCircle className="h-4 w-4" /> WCAG 2.1 AA</div>
         <div className="flex items-center gap-2 font-bold text-xs"><Info className="h-4 w-4" /> Design System Italia</div>
      </section>
    </div>
  );
}
