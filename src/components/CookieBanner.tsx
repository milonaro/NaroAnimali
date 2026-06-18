import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown, ChevronUp, ShieldCheck, Cookie, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookiePrefs {
  functional: boolean;
  analytical: boolean;
  performance: boolean;
  advertising: boolean;
}

const defaultPrefs: CookiePrefs = {
  functional: false,
  analytical: false,
  performance: false,
  advertising: false,
};

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showMoreIntro, setShowMoreIntro] = useState(false);
  
  // Accordion expanded category
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Preference switches states
  const [prefs, setPrefs] = useState<CookiePrefs>(defaultPrefs);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    const savedPrefs = localStorage.getItem('cookie-consent-preferences');
    
    if (!consent) {
      setIsVisible(true);
    } else {
      if (savedPrefs) {
        try {
          setPrefs(JSON.parse(savedPrefs));
        } catch (e) {
          console.error("Errore lettura preferenze cookie memorizzate:", e);
        }
      } else {
        // Set all to true if consent is 'all'
        if (consent === 'all') {
          setPrefs({
            functional: true,
            analytical: true,
            performance: true,
            advertising: true,
          });
        }
      }

      if (consent === 'all' || (savedPrefs && JSON.parse(savedPrefs).analytical)) {
        initializeAnalytics();
      }
    }
  }, []);

  const initializeAnalytics = () => {
    const trackingId = import.meta.env.VITE_GANALITYC_ID;
    if (trackingId) {
      console.log(`[Cookies] Servizio Statistico Inizializzato (ID: ${trackingId})`);
    }
  };

  const handleAcceptAll = () => {
    const allTrue = {
      functional: true,
      analytical: true,
      performance: true,
      advertising: true,
    };
    setPrefs(allTrue);
    localStorage.setItem('cookie-consent', 'all');
    localStorage.setItem('cookie-consent-preferences', JSON.stringify(allTrue));
    setIsVisible(false);
    setShowCustomizeModal(false);
    initializeAnalytics();
  };

  const handleAcceptTechnical = () => {
    const allFalse = {
      functional: false,
      analytical: false,
      performance: false,
      advertising: false,
    };
    setPrefs(allFalse);
    localStorage.setItem('cookie-consent', 'technical');
    localStorage.setItem('cookie-consent-preferences', JSON.stringify(allFalse));
    setIsVisible(false);
    setShowCustomizeModal(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', 'custom');
    localStorage.setItem('cookie-consent-preferences', JSON.stringify(prefs));
    setIsVisible(false);
    setShowCustomizeModal(false);
    
    if (prefs.analytical) {
      initializeAnalytics();
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const togglePref = (key: keyof CookiePrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isVisible) {
    // Return a neat cookie button in case they want to review settings later
    return (
      <button
        onClick={() => {
          setIsVisible(true);
          setShowCustomizeModal(true);
        }}
        className="fixed bottom-5 left-16 z-[9988] w-10 h-10 bg-white hover:bg-slate-50 text-slate-800 rounded-full shadow-xl border border-slate-200 hover:scale-105 transition-all flex items-center justify-center cursor-pointer hover:border-emerald-500"
        title="Impostazioni Privacy & Cookie"
        aria-label="Gestisci preferenze cookie"
      >
        <Cookie className="h-4.5 w-4.5 text-emerald-705 animate-pulse" />
      </button>
    );
  }

  return (
    <>
      {/* 1. Standard bottom viewport banner (styled in municipal colors: deep emerald green triggers) */}
      <AnimatePresence>
        {isVisible && !showCustomizeModal && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] z-[10001] flex flex-col md:flex-row items-center justify-between gap-4 font-sans"
          >
            <div className="text-[13px] text-slate-700 leading-relaxed text-center md:text-left max-w-4xl font-medium">
              <span className="font-extrabold text-slate-900 block md:inline mb-1 md:mb-0 mr-1.5 uppercase tracking-widest text-[11px] text-[#15803d]">Informativa Cookie & Privacy:</span>
              Questo sito istituzionale utilizza cookie tecnici necessari per offrirti servizi completi e, solo previo tuo consenso, cookie analitici e di profilazione per migliorare l'esperienza e analizzare l'uso della piattaforma.{' '}
              <Link to="/cookie-policy" className="text-[#15803d] hover:text-[#166534] font-black underline transition-colors">
                Maggiori informazioni e Cookie Policy
              </Link>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                onClick={() => {
                  setExpandedCategory(null);
                  setShowCustomizeModal(true);
                }}
                className="text-xs text-slate-850 hover:text-slate-950 font-black uppercase tracking-wider px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300"
              >
                Personalizza
              </button>
              <button
                onClick={handleAcceptTechnical}
                className="text-xs text-slate-700 hover:text-slate-900 font-extrabold uppercase tracking-wider px-3.5 py-2.5 hover:bg-slate-50 border border-slate-350 rounded-lg transition-colors"
              >
                Solo Necessari
              </button>
              <button
                onClick={handleAcceptAll}
                className="text-xs bg-[#15803d] hover:bg-[#166534] text-white px-5 py-2.5 rounded-lg font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Accetta Tutti
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Custom Personalized Cookie Preference Details Modal (Matches first 2 screenshots exactly) */}
      <AnimatePresence>
        {showCustomizeModal && (
          <>
            {/* Dark blur backdrop (z-index higher than header) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10002] bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowCustomizeModal(false)}
            />

            {/* Main Modal container (Optimized for small screens) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-2 top-2 bottom-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-w-xl w-full bg-white rounded-2xl shadow-2xl z-[10003] overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[85vh] border border-slate-200"
            >
              
              {/* Header block with close X */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#15803d]" /> Preferenze di consenso cookie
                </h3>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-250 transition-all cursor-pointer"
                  aria-label="Chiudi popup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable details area */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-grow scrollbar-thin">
                
                {/* Introduction texts with high contrast */}
                <div className="text-slate-800 text-[11px] sm:text-xs leading-relaxed space-y-2">
                  <p className="font-medium">
                    Utilizziamo i cookie per aiutarti a navigare in maniera efficiente e a svolgere determinate funzioni. Troverai informazioni dettagliate su tutti i cookie sotto ogni categoria di consenso sottostanti. I cookie categorizzati come "Necessari" vengono memorizzati sul tuo browser in quanto essenziali per consentire le funzionalità di base del sito.
                    {!showMoreIntro && (
                      <button
                        onClick={() => setShowMoreIntro(true)}
                        className="text-[#15803d] hover:text-[#166534] font-black inline ml-1 hover:underline text-[11px] cursor-pointer"
                      >
                        Mostra di più
                      </button>
                    )}
                  </p>
                  
                  {showMoreIntro && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 italic font-medium"
                    >
                      I cookie funzionali, di statistiche, di prestazione e pubblicitari ci permettono di memorizzare le tue scelte e migliorare le risposte della pubblica amministrazione. I dati personali dell'utente raccolti sul sito rimangono anonimi, sicuri e gestiti in assoluta conformità alle disposizioni del regolamento europeo GDPR n. 679/2016 e del codice della privacy nazionale.
                      <button
                        onClick={() => setShowMoreIntro(false)}
                        className="text-[#15803d] hover:text-[#166534] font-black block mt-1.5 hover:underline cursor-pointer"
                      >
                        Mostra meno
                      </button>
                    </motion.p>
                  )}
                </div>

                {/* Categories listings Accordions */}
                <div className="space-y-3 pt-2">
                  
                  {/* Category 1: Necessaria (Sempre attivo) */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm transition-all bg-white">
                    <div 
                      onClick={() => toggleCategory('necessary')}
                      className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
                    >
                      <div className="flex items-center gap-3">
                        {expandedCategory === 'necessary' ? <ChevronUp className="h-4 w-4 text-slate-700" /> : <ChevronDown className="h-4 w-4 text-slate-700" />}
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Necessari (Tecnici)</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-[#15803d] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        Sempre attivo
                      </span>
                    </div>

                    <AnimatePresence>
                      {expandedCategory === 'necessary' && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-200 bg-slate-50"
                        >
                          <div className="p-3 sm:p-4 space-y-3 text-xs">
                            <p className="text-slate-800 leading-relaxed text-[11px] font-medium">
                              I cookie necessari sono fondamentali per le funzioni di base del sito Web e il sito Web non funzionerà nel modo previsto senza di essi. Questi cookie non memorizzano dati identificativi personali.
                            </p>
                            
                            {/* Inner custom Cookie detail Card/Table (matches image 2 details block) */}
                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-[10px] sm:text-[11px]">
                              <div className="grid grid-cols-4 pb-1.5 border-b border-slate-350 text-slate-900 font-extrabold uppercase tracking-wider text-[9px]">
                                <span className="col-span-1">Cookie</span>
                                <span className="col-span-1">Durata</span>
                                <span className="col-span-2">Descrizione</span>
                              </div>
                              <div className="grid grid-cols-4 py-1.5 border-b border-slate-150 text-slate-900 font-medium">
                                <span className="col-span-1 font-mono font-bold text-indigo-750">PHPSESSID</span>
                                <span className="col-span-1 text-slate-800 font-bold">Sessione</span>
                                <span className="col-span-2 text-slate-750 leading-snug">Cookie tecnico nativo che permette al sito di riconoscere la sessione del cittadino garantendone la corretta navigazione sicura.</span>
                              </div>
                              <div className="grid grid-cols-4 pt-1.5 text-slate-900 font-medium">
                                <span className="col-span-1 font-mono font-bold text-indigo-750">cookie-consent</span>
                                <span className="col-span-1 text-slate-800 font-bold">1 Anno</span>
                                <span className="col-span-2 text-slate-750 leading-snug">Memorizza la scelta espressa in questo pannello per evitare richieste duplicate.</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 2: Funzionale */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm transition-all bg-white">
                    <div className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 select-none">
                      <div 
                        onClick={() => toggleCategory('functional')}
                        className="flex items-center gap-3 cursor-pointer flex-grow"
                      >
                        {expandedCategory === 'functional' ? <ChevronUp className="h-4 w-4 text-slate-700" /> : <ChevronDown className="h-4 w-4 text-slate-700" />}
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Funzionali</span>
                      </div>
                      
                      {/* Toggle visual switch */}
                      <button
                        onClick={() => togglePref('functional')}
                        className={`w-9 h-5 rounded-full relative transition-colors focus:outline-none cursor-pointer ${prefs.functional ? 'bg-[#15803d]' : 'bg-slate-300'}`}
                        aria-label="Abilita cookie Funzionali"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow flex items-center justify-center text-[8px] ${prefs.functional ? 'translate-x-4' : ''}`}>
                          {prefs.functional && <Check className="h-2.5 w-2.5 text-emerald-800 font-bold" />}
                        </div>
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedCategory === 'functional' && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-200 bg-slate-50"
                        >
                          <div className="p-3 sm:p-4 space-y-3 text-xs">
                            <p className="text-slate-800 leading-relaxed text-[11px] font-medium">
                              I cookie funzionali aiutano a svolgere determinate funzionalità come la condivisione del contenuto del sito Web su piattaforme di social media, la raccolta di feedback e altre funzionalità di terze parti.
                            </p>
                            
                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-[10px] sm:text-[11px]">
                              <div className="grid grid-cols-4 pb-1.5 border-b border-slate-350 text-slate-900 font-extrabold uppercase tracking-wider text-[9px]">
                                <span className="col-span-1">Cookie</span>
                                <span className="col-span-1">Durata</span>
                                <span className="col-span-2">Descrizione</span>
                              </div>
                              <div className="grid grid-cols-4 pt-1.5 text-slate-900 font-medium">
                                <span className="col-span-1 font-mono font-bold text-indigo-750">social_share</span>
                                <span className="col-span-1 text-slate-800 font-bold">Sessione</span>
                                <span className="col-span-2 text-slate-750 leading-snug">Preserva cookie delle terze parti per pulsanti di condivisione social attivi.</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 3: Analitica */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm transition-all bg-white">
                    <div className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 select-none font-medium">
                      <div 
                        onClick={() => toggleCategory('analytical')}
                        className="flex items-center gap-3 cursor-pointer flex-grow"
                      >
                        {expandedCategory === 'analytical' ? <ChevronUp className="h-4 w-4 text-slate-700" /> : <ChevronDown className="h-4 w-4 text-slate-700" />}
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Statistici e Analitici</span>
                      </div>
                      
                      <button
                        onClick={() => togglePref('analytical')}
                        className={`w-9 h-5 rounded-full relative transition-colors focus:outline-none cursor-pointer ${prefs.analytical ? 'bg-[#15803d]' : 'bg-slate-300'}`}
                        aria-label="Abilita cookie Analitici"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow flex items-center justify-center text-[8px] ${prefs.analytical ? 'translate-x-4' : ''}`}>
                          {prefs.analytical && <Check className="h-2.5 w-2.5 text-emerald-800 font-bold" />}
                        </div>
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedCategory === 'analytical' && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-200 bg-slate-50"
                        >
                          <div className="p-3 sm:p-4 space-y-3 text-xs">
                            <p className="text-slate-800 leading-relaxed text-[11px] font-medium">
                              I cookie analitici vengono utilizzati per comprendere come i visitatori interagiscono con il sito Web. Questi cookie aiutano a fornire informazioni sulle metriche del numero di visitatori, frequenza di rimbalzo, fonte di traffico, ecc.
                            </p>
                            
                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-[10px] sm:text-[11px]">
                              <div className="grid grid-cols-4 pb-1.5 border-b border-slate-350 text-slate-900 font-extrabold uppercase tracking-wider text-[9px]">
                                <span className="col-span-1">Cookie</span>
                                <span className="col-span-1">Durata</span>
                                <span className="col-span-2">Descrizione</span>
                              </div>
                              <div className="grid grid-cols-4 pt-1.5 text-slate-900 font-medium">
                                <span className="col-span-1 font-mono font-bold text-indigo-750">_ga, _gid</span>
                                <span className="col-span-1 text-slate-800 font-bold">2 Anni</span>
                                <span className="col-span-2 text-slate-755 leading-snug">Misuratori statistici aggregati e del tutto anonimi per analizzare le pagine più lette del comune.</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 4: Prestazioni */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm transition-all bg-white">
                    <div className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 select-none">
                      <div 
                        onClick={() => toggleCategory('performance')}
                        className="flex items-center gap-3 cursor-pointer flex-grow"
                      >
                        {expandedCategory === 'performance' ? <ChevronUp className="h-4 w-4 text-slate-700" /> : <ChevronDown className="h-4 w-4 text-slate-700" />}
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Prestazionali</span>
                      </div>
                      
                      <button
                        onClick={() => togglePref('performance')}
                        className={`w-9 h-5 rounded-full relative transition-colors focus:outline-none cursor-pointer ${prefs.performance ? 'bg-[#15803d]' : 'bg-slate-300'}`}
                        aria-label="Abilita cookie Prestazioni"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow flex items-center justify-center text-[8px] ${prefs.performance ? 'translate-x-4' : ''}`}>
                          {prefs.performance && <Check className="h-2.5 w-2.5 text-emerald-800 font-bold" />}
                        </div>
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedCategory === 'performance' && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-200 bg-slate-50"
                        >
                          <div className="p-3 sm:p-4 space-y-3 text-xs">
                            <p className="text-slate-800 leading-relaxed text-[11px] font-medium">
                              I cookie per le prestazioni vengono utilizzati per comprendere e analizzare gli indici di prestazione chiave del sito Web che aiutano a fornire ai visitatori un'esperienza utente migliore.
                            </p>
                            
                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-[10px] sm:text-[11px]">
                              <div className="grid grid-cols-4 pb-1.5 border-b border-slate-350 text-slate-900 font-extrabold uppercase tracking-wider text-[9px]">
                                <span className="col-span-1">Cookie</span>
                                <span className="col-span-1">Durata</span>
                                <span className="col-span-2">Descrizione</span>
                              </div>
                              <div className="grid grid-cols-4 pt-1.5 text-slate-900 font-medium">
                                <span className="col-span-1 font-mono font-bold text-indigo-750">perf_metric</span>
                                <span className="col-span-1 text-slate-800 font-bold">6 Mesi</span>
                                <span className="col-span-2 text-slate-755 leading-snug">Misurano la velocità di rendering delle pagine web per aiutarci ad allocare meglio le risorse server.</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 5: Pubblicitari */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm transition-all bg-white">
                    <div className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 select-none">
                      <div 
                        onClick={() => toggleCategory('advertising')}
                        className="flex items-center gap-3 cursor-pointer flex-grow"
                      >
                        {expandedCategory === 'advertising' ? <ChevronUp className="h-4 w-4 text-slate-700" /> : <ChevronDown className="h-4 w-4 text-slate-700" />}
                        <span className="font-black text-slate-900 text-xs sm:text-sm">Pubblicità e Profilazione</span>
                      </div>
                      
                      <button
                        onClick={() => togglePref('advertising')}
                        className={`w-9 h-5 rounded-full relative transition-colors focus:outline-none cursor-pointer ${prefs.advertising ? 'bg-[#15803d]' : 'bg-slate-300'}`}
                        aria-label="Abilita cookie Pubblicitari"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow flex items-center justify-center text-[8px] ${prefs.advertising ? 'translate-x-4' : ''}`}>
                          {prefs.advertising && <Check className="h-2.5 w-2.5 text-emerald-800 font-bold" />}
                        </div>
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedCategory === 'advertising' && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-200 bg-slate-50"
                        >
                          <div className="p-3 sm:p-4 space-y-3 text-xs">
                            <p className="text-slate-800 leading-relaxed text-[11px] font-medium">
                              I cookie pubblicitari vengono utilizzati per fornire ai visitatori comunicazioni istituzionali e avvisi pertinenti in base alle pagine precedentemente visitate.
                            </p>
                            
                            <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-[10px] sm:text-[11px]">
                              <div className="grid grid-cols-4 pb-1.5 border-b border-slate-350 text-slate-900 font-extrabold uppercase tracking-wider text-[9px]">
                                <span className="col-span-1">Cookie</span>
                                <span className="col-span-1">Durata</span>
                                <span className="col-span-2">Descrizione</span>
                              </div>
                              <div className="grid grid-cols-4 pt-1.5 text-slate-900 font-medium">
                                <span className="col-span-1 font-mono font-bold text-indigo-750">ads_ref</span>
                                <span className="col-span-1 text-slate-800 font-bold">3 Mesi</span>
                                <span className="col-span-2 text-slate-755 leading-snug">Rileva l'interlocuzione con le comunicazioni esterne del Comune a fini statistici.</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

              </div>

              {/* Preferences Modal Actions Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="w-full sm:w-auto text-xs text-slate-700 hover:text-slate-950 font-black uppercase tracking-wider px-4 py-2 hover:bg-slate-200 rounded-lg transition-colors text-center cursor-pointer"
                >
                  Annulla
                </button>
                <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
                  <button
                    onClick={handleSavePreferences}
                    className="w-full sm:w-auto border-2 border-[#15803d] text-[#15803d] hover:bg-emerald-50 text-xs sm:text-[11px] font-black uppercase tracking-wider px-4.5 py-2.5 rounded-lg transition-all text-center cursor-pointer"
                  >
                    Salva preferenze
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="w-full sm:w-auto bg-[#15803d] hover:bg-[#166534] text-white text-xs sm:text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-md transition-all text-center active:scale-95 cursor-pointer"
                  >
                    Accetta tutto
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
