import { ChevronRight, ShieldCheck, MapPin, Search, PawPrint, HelpCircle, Briefcase, CheckCircle, Info, Clock, UserCheck, Map as MapIcon, Filter, Dog, Cat, SlidersHorizontal, ArrowRight, Heart, CheckCircle2, AlertCircle, MousePointer2, ArrowUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride } from 'react-joyride';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { COMUNI } from '@/src/lib/geofence';
import { useLanguage } from '@/src/contexts/LanguageContext';

import step3Img from './images/step3_protocollare_1781441452355.jpg';
import step4Img from './images/step4_monitoraggio_1781441470199.jpg';

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

function StepTooltip({ content, isVisible }: { content: string; isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute z-50 bottom-[104%] left-1/2 -translate-x-1/2 mb-4 w-[250px] sm:w-[320px] p-4 bg-[#080d1a]/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6),_0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-white/10 text-xs font-semibold leading-relaxed text-slate-100 pointer-events-none text-center"
        >
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 w-3 h-3 bg-[#080d1a] border-r border-b border-emerald-500/40 rotate-45" />
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const DEFAULT_SLIDERS = [
  {
    id: 1,
    badge_it: "TUTELA & BENESSERE ANIMALE",
    badge_en: "ANIMAL WELFARE & CARE",
    title_it: "Proteggi e segnala il randagismo",
    title_en: "Protect and report stray animals",
    desc_it: "Attraverso la piattaforma ufficiale del Comune puoi avviare segnalazioni, geolocalizzare animali e monitorare lo stato di salute dei randagi.",
    desc_en: "Through the official municipal platform, you can initiate reports, geolocate animals, and monitor the health of stray animals.",
    icon: "PawPrint",
    color_theme: "emerald",
    tab_title_it: "Tutela & Soccorso",
    tab_title_en: "Care & Assistance",
    tab_step_it: "Modulo A",
    tab_step_en: "Module A",
    tab_desc_it: "Gestione randagismo, soccorso ordinario/urgente ed affidamenti digitali.",
    tab_desc_en: "Stray animal management, urgent/ordinary rescue, and digital custody tracking.",
    btn1_label_it: "Segnala Animale",
    btn1_label_en: "Report Animal",
    btn1_link: "/segnala",
    btn1_style: "primary",
    btn2_label_it: "Verifica Segnalazione",
    btn2_label_en: "Check Status",
    btn2_link: "/mia-area",
    btn2_style: "secondary",
    image_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2000"
  },
  {
    id: 2,
    badge_it: "Polizia e Controllo Sanitario",
    badge_en: "Police & Health Control",
    title_it: "Salvaguardia della biodiversità urbana",
    title_en: "Safeguard of urban biodiversity",
    desc_it: "Strumenti innovativi integrati negli uffici comunali per la convivenza serena e coordinata tra cittadini, fauna locale e territori rurali.",
    desc_en: "Innovative tools integrated into municipal safety offices for serene and coordinated coexistence between citizens, local fauna, and rural fields.",
    icon: "ShieldCheck",
    color_theme: "amber",
    tab_title_it: "Sicurezza Urbana",
    tab_title_en: "Urban Security",
    tab_step_it: "Modulo B",
    tab_step_en: "Module B",
    tab_desc_it: "Monitoraggio biodiversità, presidi di controllo fitti e pianificazioni.",
    tab_desc_en: "Urban biodiversity monitoring, dense checkpoints, and tactical safety planning.",
    btn1_label_it: "Segnala Animale",
    btn1_label_en: "Report Animal",
    btn1_link: "/segnala",
    btn1_style: "primary",
    btn2_label_it: "Verifica Segnalazione",
    btn2_label_en: "Check Status",
    btn2_link: "/mia-area",
    btn2_style: "secondary",
    image_url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=2000"
  }
];

export const getSliderIcon = (iconName: string) => {
  switch (iconName) {
    case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 animate-pulse shrink-0" />;
    case 'AlertCircle': return <AlertCircle className="w-5 h-5 animate-pulse shrink-0" />;
    case 'Heart': return <Heart className="w-5 h-5 animate-pulse shrink-0" />;
    case 'Info': return <Info className="w-5 h-5 animate-pulse shrink-0" />;
    case 'HelpCircle': return <HelpCircle className="w-5 h-5 animate-pulse shrink-0" />;
    case 'PawPrint':
    default: return <PawPrint className="w-5 h-5 animate-pulse shrink-0" />;
  }
};

export const getThemeColors = (color: string) => {
  switch (color) {
    case 'amber':
      return {
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        titleHighlights: 'from-amber-400 to-amber-600',
        activeBg: 'bg-amber-950/40 border-amber-500/60 text-white shadow-xl shadow-amber-950/40',
        tagIconBg: 'bg-amber-50 text-slate-950 shadow-md',
        tabHighlight: 'from-amber-500/10 to-amber-500/20'
      };
    case 'sky':
      return {
        badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
        titleHighlights: 'from-sky-400 to-sky-600',
        activeBg: 'bg-sky-950/40 border-sky-500/60 text-white shadow-xl shadow-sky-950/40',
        tagIconBg: 'bg-indigo-50 text-slate-950 shadow-md',
        tabHighlight: 'from-sky-500/10 to-sky-500/20'
      };
    case 'purple':
      return {
        badgeBg: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
        titleHighlights: 'from-purple-400 to-purple-600',
        activeBg: 'bg-purple-950/40 border-purple-500/60 text-white shadow-xl shadow-purple-950/40',
        tagIconBg: 'bg-purple-50 text-slate-950 shadow-md',
        tabHighlight: 'from-purple-500/10 to-purple-500/20'
      };
    case 'emerald':
    default:
      return {
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        titleHighlights: 'from-emerald-400 to-[#15803d]',
        activeBg: 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-xl shadow-emerald-950/40',
        tagIconBg: 'bg-[#15803d] text-white shadow-md',
        tabHighlight: 'from-emerald-500/10 to-emerald-500/20'
      };
  }
};

export default function Home() {
  const { language, t } = useLanguage();
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [activeComune, setActiveComune] = useState(() => (localStorage.getItem('active_comune') || 'naro').toLowerCase());
  const [sliders, setSliders] = useState<any[]>(DEFAULT_SLIDERS);

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
          if (config.home_sliders) {
            try {
              const parsed = JSON.parse(config.home_sliders);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSliders(parsed);
              }
            } catch (err) {
              console.error("Errore parsing home_sliders:", err);
            }
          }
        }
      } catch(e) {}
    };
    fetchConfig();
  }, []);

  const cityName = useMemo(() => {
    return siteName.replace("Comune di ", "");
  }, [siteName]);

  const [hoveredStepIcon, setHoveredStepIcon] = useState<number | null>(null);
  const [hoveredStepTitle, setHoveredStepTitle] = useState<number | null>(null);

  const [runTour, setRunTour] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlideIdx = useMemo(() => {
    if (!sliders || sliders.length === 0) return 0;
    return currentSlide % sliders.length;
  }, [currentSlide, sliders]);

  const activeSlide = useMemo(() => {
    if (!sliders || sliders.length === 0) return DEFAULT_SLIDERS[0];
    return sliders[activeSlideIdx] || DEFAULT_SLIDERS[0];
  }, [sliders, activeSlideIdx]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  
  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneDoc[]>([]);
  
  const formatReportDate = (createdAt: any) => {
    if (!createdAt) return language === 'it' ? 'Non specificato' : 'Not specified';
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US');
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US');
    }
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? (language === 'it' ? 'Non specificato' : 'Not specified') : d.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US');
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
    return [language === 'it' ? 'Tutte' : 'All', ...new Set(locs)];
  }, [comuneSegnalazioni, language]);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [sliders]);

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
      title: language === 'it' ? '🌟 Benvenuto su AnimalHub PA' : '🌟 Welcome to AnimalHub PA',
      content: language === 'it' 
        ? `Il portale civico ufficiale ed esclusivo del ${siteName} per la tutela, segnalazione e salvaguardia dei nostri amici a quattro zampe.`
        : `The official and exclusive civic portal of ${siteName} for the protection and welfare of our four-legged friends.`,
      placement: 'center',
    },
    {
      target: '#segnala-step',
      title: language === 'it' ? '📍 Invia Segnalazione (Modulo A)' : '📍 Submit Report (Module A)',
      content: language === 'it'
        ? `Da qui puoi avviare la segnalazione controllata e geolocalizzata di un cane o gatto randagio in difficoltà sul territorio di ${cityName}.`
        : `From here you can start a controlled and geo-located report of a stray dog or cat in difficulty on the territory of ${cityName}.`,
      placement: 'bottom',
    },
    {
      target: '#how-it-works-step',
      title: language === 'it' ? '🔄 Il Ciclo di Gestione' : '🔄 Management Cycle',
      content: language === 'it'
        ? "Segui il processo in 4 semplici passaggi: dall'identificazione all'intervento, fino alla firma digitale COF di affido."
        : "Follow the process in 4 simple steps: from identification to intervention, up to the digital COF foster signature.",
      placement: 'center',
    },
  ];

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
        <h3 className="text-xl md:text-2xl font-black text-[#101b3a] mb-3 leading-tight tracking-tight text-left">
          {step.title}
        </h3>
      )}
      <div className="text-slate-600 font-medium mb-8 leading-relaxed text-base text-left">
        {step.content}
      </div>
      <div className="flex items-center justify-between">
        <button
          {...closeProps}
          className="text-red-400 font-bold text-[11px] uppercase tracking-widest hover:text-red-600 transition-colors cursor-pointer p-2 -ml-2"
        >
          {language === 'it' ? 'Salta' : 'Skip'}
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-[#101b3a] transition-colors cursor-pointer px-4 py-3"
            >
              {language === 'it' ? 'Indietro' : 'Back'}
            </button>
          )}
          <button
            {...primaryProps}
            className="bg-[#101b3a] text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#15803d] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#15803d]/30 transition-all cursor-pointer"
          >
            {isLastStep ? (language === 'it' ? 'Ho capito' : 'Done') : (language === 'it' ? 'Avanti' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ borderWidth: '0px', paddingTop: '0px' }}>
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

      {/* 1. HERO SLIDER */}
      <section id="hero-step" className="relative h-[93vh] lg:h-[750px] overflow-hidden bg-[#101b3a] flex items-center pt-24 shadow-2xl z-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-20 opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#101b3a] to-transparent pointer-events-none z-20" />

        <AnimatePresence mode="wait">
          <motion.div
            key={`slide-${activeSlideIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent z-10" />
            <motion.img
              initial={{ scale: 1.12, filter: "blur(2px)" }}
              animate={{ scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 8 }}
              src={activeSlide.image_url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2000"}
              alt="Tutela Territorio"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Left Col: Dynamic text content */}
            <div className="lg:col-span-7 text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${activeSlideIdx}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl backdrop-blur-md border ${getThemeColors(activeSlide.color_theme).badgeBg}`}>
                    {getSliderIcon(activeSlide.icon)}
                    <span className="font-extrabold uppercase tracking-[0.25em] text-[10px]">
                      {language === 'it' ? activeSlide.badge_it : activeSlide.badge_en}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] drop-shadow-md">
                    {language === 'it' 
                      ? activeSlide.title_it 
                      : activeSlide.title_en}
                  </h1>
                  
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
                    {language === 'it' ? activeSlide.desc_it : activeSlide.desc_en}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                    {activeSlide.btn1_label_it && (
                      <Link 
                        id="segnala-step" 
                        to={activeSlide.btn1_link || "/segnala"} 
                        className={`text-white px-8 py-4 rounded-xl font-extrabold text-base transition-all flex items-center gap-3 shadow-xl hover:-translate-y-0.5 cursor-pointer ${
                          activeSlide.btn1_style === 'secondary' 
                            ? 'bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md' 
                            : 'bg-[#15803d] hover:bg-[#166534] hover:shadow-emerald-950/30'
                        }`}
                      >
                        <MapPin className="h-5 w-5" /> {language === 'it' ? activeSlide.btn1_label_it : activeSlide.btn1_label_en}
                      </Link>
                    )}
                    {activeSlide.btn2_label_it && (
                      <Link 
                        to={activeSlide.btn2_link || "/mia-area"} 
                        className={`text-white px-8 py-4 rounded-xl font-bold text-base transition-all flex items-center gap-3 border backdrop-blur-md hover:-translate-y-0.5 cursor-pointer ${
                          activeSlide.btn2_style === 'primary' 
                            ? 'bg-[#15803d] hover:bg-[#166534] border-transparent' 
                            : 'bg-white/10 hover:bg-white/15 border-white/20'
                        }`}
                      >
                        <Search className="h-5 w-5 text-emerald-400" /> {language === 'it' ? activeSlide.btn2_label_it : activeSlide.btn2_label_en}
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Col: High-fidelity Custom Tab controls */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-4 w-full pt-6 lg:pt-0">
              {sliders.map((tab, idx) => {
                const isActive = activeSlideIdx === idx;
                const colors = getThemeColors(tab.color_theme);
                return (
                  <button
                    key={tab.id || idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`flex-1 text-left p-6 rounded-2xl cursor-pointer border transition-all duration-300 relative group flex items-start gap-4 backdrop-blur-md overflow-hidden ${
                      isActive 
                        ? colors.activeBg
                        : 'bg-[#101b3a]/40 hover:bg-[#101b3a]/65 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:scale-[1.01]'
                    }`}
                  >
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${colors.tabHighlight} pointer-events-none opacity-40 z-0`} />
                    )}
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors shrink-0 ${
                        isActive 
                          ? colors.tagIconBg
                          : 'bg-white/10 text-slate-300'
                      }`}>
                        {getSliderIcon(tab.icon)}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider block mt-2 text-center text-slate-400 leading-none shrink-0">
                        {language === 'it' ? tab.tab_step_it : tab.tab_step_en}
                      </span>
                    </div>

                    <div className="relative z-10 space-y-1">
                      <p className="text-sm font-black tracking-tight leading-none pt-1">
                        {language === 'it' ? tab.tab_title_it : tab.tab_title_en}
                      </p>
                      <p className="text-xs text-slate-300/80 leading-relaxed font-semibold">
                        {language === 'it' ? tab.tab_desc_it : tab.tab_desc_en}
                      </p>
                      {isActive && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] uppercase font-black tracking-widest text-[#22c55e]">
                            {language === 'it' ? 'Modulo in evidenza' : 'Active Module'}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* 2. COME FUNZIONA IL PORTALE */}
      <section id="how-it-works-step" className="py-32 bg-white relative overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.02),_0_20px_50px_rgba(0,0,0,0.04)] z-10">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50/50 -skew-x-12 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
             <div className="inline-block px-4 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] mb-6">
               {language === 'it' ? 'Processo Autoguidato' : 'Self-Guided Process'}
             </div>
             <h2 className="text-5xl font-black text-[#101b3a] tracking-tight mb-4">{t('home.sec_how')}</h2>
             <p className="text-slate-700 font-semibold text-lg">{t('home.sec_how_desc')}</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12">
            {[
              { 
                step: "01", 
                title: language === 'it' ? "Identifica" : "Identify", 
                desc: language === 'it' ? "Se vedi un cane o un gatto in difficoltà sul territorio di Naro." : "Spot a stray dog or cat in distress on municipal fields.",
                icon: <Search className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />,
                img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
                tooltipSec: "Osserva l'animale a distanza di sicurezza per capire se è smarrito, ferito o necessita di cure primarie immediate. Verifica la presenza di collari.",
                tooltipEn: "Observe the animal from a safe distance to check if it's lost, injured, or requires immediate primary care. Check for collars."
              },
              { 
                step: "02", 
                title: language === 'it' ? "Localizza" : "Map & Pin", 
                desc: language === 'it' ? "Usa la mappa interattiva per indicare il punto esatto del ritrovamento." : "Use the interactive map to precisely pin where you spotted them.",
                icon: <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />,
                img: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=600",
                tooltipSec: "Il posizionamento GPS automatico o l'inserimento manuale dell'indirizzo consente alla squadra di pronto intervento comunali di pianificare i percorsi velocemente.",
                tooltipEn: "Automatic GPS centering or manual address input allows the municipal emergency squad to plan optimal route layouts instantly."
              },
              { 
                step: "03", 
                title: "Protocolla", 
                desc: language === 'it' ? "Aggiungi foto e dettagli. Il sistema genera un codice unico di tracking COF." : "Upload photos and state details. The system generates a tracking code.",
                icon: <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />,
                img: step3Img,
                tooltipSec: "L'acquisizione digitale genera un protocollo di tracking COF istantaneo, integrato con la messaggistica per aggiornamenti di stato automatici.",
                tooltipEn: "Digital filing creates an instant COF tracking protocol integrated with direct updates and status logs."
              },
              { 
                step: "04", 
                title: language === 'it' ? "Monitora" : "Monitor", 
                desc: language === 'it' ? "Segui in tempo reale l'intervento e l'affidamento degli operatori comunali." : "Watch live updates as municipal responders intervene and resolve the report.",
                icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />,
                img: step4Img,
                tooltipSec: "La dashboard tiene traccia del ciclo di vita completo: dalla presa in carico, al controllo veterinario, fino alle proposte di adozione.",
                tooltipEn: "The lifecycle display tracks all key milestones: from ingestion, vetting, to community adoption options."
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.04, y: -4 }}
                className="relative group flex flex-col rounded-2xl aspect-[3/4] sm:aspect-[4/5] shadow-lg border border-slate-200/50 cursor-pointer bg-[#0c142b] text-left transition-all duration-300 hover:shadow-2xl hover:border-emerald-500/25"
              >
                <StepTooltip 
                  content={language === 'it' ? item.tooltipSec : item.tooltipEn} 
                  isVisible={hoveredStepIcon === i || hoveredStepTitle === i} 
                />

                <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-50 filter blur-[1px] brightness-75 group-hover:scale-110 group-hover:blur-0 group-hover:opacity-85 group-hover:brightness-105 transition-all duration-1000 ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
                  <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
                </div>

                <div className="relative z-10 p-3 sm:p-6 flex flex-col justify-between h-full group-hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white/40 font-black text-xs sm:text-lg tracking-widest">{item.step}</span>
                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredStepIcon(i)}
                      onMouseLeave={() => setHoveredStepIcon(null)}
                      onFocus={() => setHoveredStepIcon(i)}
                      onBlur={() => setHoveredStepIcon(null)}
                    >
                      <div className="w-8 h-8 sm:w-11 sm:h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 border border-white/15 shadow-sm hover:scale-110 hover:border-white/35 hover:bg-white/15 transition-all duration-300 cursor-help">
                        {item.icon}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 pointer-events-auto">
                    <div 
                      className="relative inline-block"
                      onMouseEnter={() => setHoveredStepTitle(i)}
                      onMouseLeave={() => setHoveredStepTitle(null)}
                      onFocus={() => setHoveredStepTitle(i)}
                      onBlur={() => setHoveredStepTitle(null)}
                    >
                      <h3 className="text-sm sm:text-xl font-black text-white tracking-tight cursor-help hover:text-emerald-300 transition-colors duration-200">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-300 leading-relaxed sm:leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DATABASE ANIMALI ENTRANCE */}
      <section id="explore-step" className="py-32 bg-[#fafafb] relative shadow-[inset_0_6px_36px_rgba(0,0,0,0.03),_0_20px_40px_rgba(0,0,0,0.02)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="max-w-2xl text-left">
               <div className="inline-block px-4 py-1.5 bg-[#15803d]/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] mb-6">
                 {language === 'it' ? 'Database Animali' : 'Animal Catalog'}
               </div>
               <h2 className="text-5xl font-black text-[#101b3a] tracking-tight mb-4">{t('home.sec_explore')}</h2>
               <p className="text-slate-800 font-semibold text-lg">{t('home.sec_explore_desc')}</p>
            </div>
            <div className="flex bg-white p-2 rounded-lg shadow-xl border border-gray-100 items-center gap-2 group focus-within:ring-2 focus-within:ring-[#15803d]/20 transition-all">
              <Search className="h-5 w-5 text-slate-400 ml-4 group-focus-within:text-[#15803d] transition-colors" />
              <input 
                type="text" 
                placeholder={language === 'it' ? "Cerca Luna, Pastore, Naro..." : "Search Luna, Shepherd, Naro..."}
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
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        speciesFilter === s ? 'bg-[#15803d] text-white shadow-lg' : 'text-slate-600 hover:text-[#101b3a]'
                      }`}
                    >
                      {language === 'it' ? s : s === 'Tutti' ? 'All' : s === 'Cane' ? 'Dog' : 'Cat'}
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
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2 hidden sm:inline">
                    {language === 'it' ? 'Stato:' : 'Status:'}
                  </span>
                  {[
                    { label: t('home.report_status_creata'), color: 'bg-blue-500' },
                    { label: t('home.report_status_incarico'), color: 'bg-amber-500' },
                    { label: t('home.report_status_pulizia'), color: 'bg-emerald-500' },
                    { label: t('home.report_status_risolta'), color: 'bg-indigo-600' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#1e3a5f]">{item.label}</span>
                    </div>
                  ))}
               </div>

               <div className="flex items-center gap-2 text-slate-700 font-extrabold bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                  <SlidersHorizontal className="h-4 w-4 text-[#15803d]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{filteredAnimals.length} {t('home.results')}</span>
               </div>
            </div>
          </div>

          {/* Animals Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredAnimals.map((animal) => (
                <motion.div
                  key={animal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all group flex flex-col h-full bg-slate-50 cursor-pointer text-left"
                  onClick={() => navigate(`/mappa?id=${animal.id}`)}
                >
                  <div className="relative h-32 sm:h-48 lg:h-64 overflow-hidden">
                    <img src={animal.fotoUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600'} alt={animal.specie} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#15803d]">
                      {animal.specie}
                    </div>
                  </div>
                  <div className="p-3 sm:p-6 lg:p-8 flex flex-col flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-4 mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-lg lg:text-md font-black text-[#101b3a] line-clamp-1">{animal.specie} {animal.colore}</h3>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg ${
                        animal.stato === 'CREATA' ? 'bg-blue-50 text-blue-600' :
                        animal.stato === 'IN_CARICO' ? 'bg-amber-50 text-amber-600' :
                        animal.stato === 'INTERVENTO' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {animal.stato === 'CREATA' && <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                        {animal.stato === 'IN_CARICO' && <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                        {animal.stato === 'INTERVENTO' && <MousePointer2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                        {animal.stato === 'CHIUSA' && <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                        <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest leading-none">
                          {animal.stato === 'CREATA' ? t('home.report_status_creata') :
                           animal.stato === 'IN_CARICO' ? t('home.report_status_incarico') :
                           animal.stato === 'INTERVENTO' ? t('home.report_status_pulizia') :
                           t('home.report_status_risolta')}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[8px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-6 flex items-center gap-1 sm:gap-2">
                       {animal.specie === 'CANE' ? <Dog className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-[#15803d]" /> : <Cat className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-[#15803d]" />} {animal.taglia || 'Normale'}
                    </p>
                    <div className="mt-auto pt-3 sm:pt-6 border-t border-gray-100 flex items-center justify-between">
                       <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#15803d] shrink-0" />
                          <span className="text-[8px] sm:text-[10px] font-bold text-slate-800 line-clamp-1">{animal.indirizzo || 'Naro'}</span>
                       </div>
                       <div className="p-1 sm:p-2 bg-emerald-50 text-[#15803d] rounded-lg group-hover:bg-[#15803d] group-hover:text-white transition-colors shrink-0">
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
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
              <h3 className="text-2xl font-bold text-[#101b3a]">{language === 'it' ? 'Nessun risultato trovato' : 'No results found'}</h3>
              <p className="text-slate-500 font-bold">{language === 'it' ? 'Prova a cambiare i filtri o la query di ricerca.' : 'Try changing parameters of your search queries.'}</p>
              <button 
                onClick={() => { setSearchQuery(''); setSpeciesFilter('Tutti'); setLocationFilter('Tutte'); }}
                className="mt-8 text-[#15803d] font-black text-[10px] uppercase tracking-widest hover:underline cursor-pointer"
              >
                {language === 'it' ? 'Resetta Filtri' : 'Reset Filters'}
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* 4. FEED REAL-TIME / ULTIME SEGNALAZIONI */}
      <section className="py-24 bg-white relative border-t border-gray-100 shadow-[inset_0_4px_30px_rgba(0,0,0,0.015),_0_15px_35px_rgba(0,0,0,0.03)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div className="max-w-2xl text-left">
              <div className="inline-block px-4 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] mb-6">{t('home.sec_feed_badge')}</div>
              <h2 className="text-4xl font-black text-[#101b3a] tracking-tight mb-4">{t('home.sec_feed')}</h2>
              <p className="text-slate-700 font-semibold">{t('home.sec_feed_desc')} {siteName}.</p>
            </div>
            <Link to="/mia-area" className="bg-gray-50 hover:bg-gray-100 text-[#101b3a] px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-gray-100">
               {t('home.all_activities')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comuneSegnalazioni.slice(0, 4).map((report) => (
              <div key={report.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group cursor-pointer text-left" onClick={() => navigate(`/mappa?id=${report.id}`)}>
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

      {/* 5. TECH & INNOVATION */}
      <section className="py-24 bg-[#fafafb] border-y border-gray-200/80 overflow-hidden relative shadow-[inset_0_6px_36px_rgba(0,0,0,0.035),_0_20px_40px_rgba(0,0,0,0.02)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#101b3a] tracking-tight mb-4">{t('home.sec_innovation')}</h2>
            <p className="text-slate-700 font-semibold text-lg">{t('home.sec_innovation_desc')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                tag: language === 'it' ? "Foto Intelligente (IA)" : "Intelligent Photo (AI)",
                tagColor: "text-emerald-700 bg-emerald-50",
                title: language === 'it' ? "Riconoscimento col Telefono" : "Phone Detection Assist",
                desc: language === 'it' ? "Usa la fotocamera per scattare una foto. Il nostro sistema riconosce subito se è un cane o un gatto, aiutando i soccorritori." : "Point the camera at the pet. Our platform instantly assists with classification parameters to help responders.",
                bgImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
                icon: <PawPrint className="h-5 w-5" />
              },
              {
                tag: language === 'it' ? "Geolocalizzazione GPS" : "GPS Geolocalisation",
                tagColor: "text-blue-700 bg-blue-50",
                title: language === 'it' ? "Mappa e Posizione Esatta" : "Precise Map Coordinates",
                desc: language === 'it' ? "Premi un pulsante e la tua posizione GPS viene segnata sulla mappa di Naro. Così gli operatori arrivano senza ritardi." : "Tap a button and capture GPS coordinates on the official map. Responders arrive accurately with no wasted time.",
                bgImage: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=800",
                icon: <MapPin className="h-5 w-5" />
              },
              {
                tag: language === 'it' ? "Notifiche Real-Time" : "Real-time updates",
                tagColor: "text-amber-700 bg-amber-50",
                title: language === 'it' ? "Aggiornamenti in Tempo Reale" : "Instant SMS/Mail Alerts",
                desc: language === 'it' ? "Rimani informato sullo stato della tua pratica: ricevi un avviso automatico quando un operatore prende in carico l'animale." : "Receive automatic tracking milestones as responders deploy or doctors intervene on your logged stray report.",
                bgImage: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=800",
                icon: <Clock className="h-5 w-5" />
              },
              {
                tag: "Privacy al 100%",
                tagColor: "text-red-700 bg-red-50",
                title: language === 'it' ? "I Tuoi Dati Protetti e Sicuri" : "Fully Encrypted Identity",
                desc: language === 'it' ? "Il portale è conforme alle leggi sulla privacy. Nome ed email rimangono crittografati e protetti, visibili solo al personale." : "Fully compliant with strict GDPR mandates. Your contact data remains hidden and encrypted from open visual feeds.",
                bgImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
                icon: <ShieldCheck className="h-5 w-5" />
              },
              {
                tag: language === 'it' ? "Adozione Facile" : "Easy foster files",
                tagColor: "text-indigo-700 bg-[#eef2ff]",
                title: language === 'it' ? "Regala una Nuova Casa" : "Promote Happy Adoptions",
                desc: language === 'it' ? "Accedi all'elenco degli animali pronti per essere adottati. Ti mettiamo in contatto con canili e rifugi autorizzati." : "Easily browse pets ready for foster care and sign digital COF procedures safely, linked with local shelters.",
                bgImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800",
                icon: <Heart className="h-5 w-5" />
              },
              {
                tag: language === 'it' ? "Veterinari Locali" : "Local Vet Network",
                tagColor: "text-purple-700 bg-[#faf5ff]",
                title: language === 'it' ? "Pronto Intervento e Cure" : "Coordinated Health Teams",
                desc: language === 'it' ? "I medici veterinari e le associazioni di Naro sono collegati alla piattaforma e ricevono all'istante segnalazioni urgenti." : "Local clinicians and active volunteers are direct participants within the platform for immediate clinical rescue.",
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
                className="group relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 min-h-[280px] text-left"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-30 scale-100 group-hover:scale-110 transition-all duration-700 pointer-events-none"
                  style={{ backgroundImage: `url(${item.bgImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-slate-900/0 group-hover:from-emerald-500/5 group-hover:to-slate-900/5 transition-all duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`p-2.5 rounded-xl ${item.tagColor} transition-transform group-hover:scale-110 duration-300`}>{item.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.tagColor.split(' ')[0]}`}>{item.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#101b3a] group-hover:text-[#15803d] transition-colors duration-300 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm font-semibold">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PERCHÈ USARE ANIMALHUB PA */}
      <section className="py-24 bg-white relative border-t border-gray-100 shadow-[inset_0_4px_30px_rgba(0,0,0,0.015),_0_20px_40px_rgba(0,0,0,0.03)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-[#101b3a] tracking-tight mb-16">{t('home.sec_why')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              { 
                title: language === 'it' ? "Aggiornamenti in tempo reale" : "Real-time updates", 
                desc: language === 'it' ? "Ricevi notifiche istantanee via email quando la tua segnalazione sul territorio comunale viene presa in carico." : "Get instant email updates when your stray animal report is updated, validated or successfully closed.",
                bgImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: language === 'it' ? "I tuoi dati sono sicuri" : "Encrypted privacy rules", 
                desc: language === 'it' ? "Sistema totalmente sicuro e conforme alle norme europee sulla privacy (GDPR). Nome ed email rimangono protetti." : "Strict compliance with European GDPR laws. Your personal details are protected and accessible only to verified officials.",
                bgImage: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800"
              },
              { 
                title: language === 'it' ? "Segnalazione semplice" : "Simple 3-click reporting", 
                desc: language === 'it' ? "Bastano pochissimi tocchi dallo smartphone: selezioni il tipo di animale, marchi la posizione e carichi una foto." : "Highly optimized mobile-friendly interface. Map GPS spots instantly, state details and submit with direct photos.",
                bgImage: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800"
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 p-8 rounded-2xl bg-white border border-gray-100 min-h-[300px] flex flex-col justify-between"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-30 scale-100 group-hover:scale-110 transition-all duration-700 pointer-events-none"
                  style={{ backgroundImage: `url(${item.bgImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-slate-900/0 group-hover:from-emerald-500/5 group-hover:to-slate-900/10 transition-all duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                     {i === 0 ? <Clock className="h-7 w-7 text-[#15803d]" /> : i === 1 ? <ShieldCheck className="h-7 w-7 text-[#15803d]" /> : <UserCheck className="h-7 w-7 text-[#15803d]" />}
                  </div>
                  <h3 className="text-2xl font-black text-[#101b3a] group-hover:text-[#15803d] transition-colors duration-300 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-base font-semibold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE FOOTER BADGES */}
      <section className="py-12 border-t border-gray-100 bg-[#fafafb] flex justify-center gap-12 grayscale opacity-40 shadow-[inset_0_4px_20px_rgba(0,0,0,0.01)]">
         <div className="flex items-center gap-2 font-bold text-xs"><ShieldCheck className="h-4 w-4" /> {language === 'it' ? 'Conforme GDPR' : 'GDPR Compliant'}</div>
         <div className="flex items-center gap-2 font-bold text-xs"><CheckCircle className="h-4 w-4" /> WCAG 2.1 AA</div>
         <div className="flex items-center gap-2 font-bold text-xs"><Info className="h-4 w-4" /> {language === 'it' ? `Portale Civico ${siteName}` : `Civic Portal ${cityName}`}</div>
      </section>

      {/* Floating Tutorial Button */}
      <button 
        onClick={() => setRunTour(true)}
        className="fixed bottom-5 left-5 z-[5000] w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-white/50 group cursor-pointer"
        aria-label="Avvia Tutorial"
      >
        <HelpCircle className="h-4.5 w-4.5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            onClick={scrollToTop}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[5000] w-10 h-10 bg-[#101b3a] hover:bg-[#15803d] text-white rounded-full shadow-xl flex items-center justify-center transition-colors hover:scale-105 active:scale-95 border border-white/50 cursor-pointer"
            aria-label="Torna su"
          >
            <ArrowUp className="h-4.5 w-4.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
