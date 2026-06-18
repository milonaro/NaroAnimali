import React, { useState, useEffect } from 'react';
import { 
  Accessibility, X, RotateCcw, Eye, HelpCircle, Heading, 
  Type, Columns, Sparkles, BookOpen, Keyboard, Heart, 
  FileText, Volume2, MousePointer, Compass, Info,
  CheckCircle, ShieldAlert, BookMarked, EyeOff, LayoutTemplate,
  Check, ArrowRightLeft, AlignLeft, Underline
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility } from '@/src/contexts/AccessibilityContext';
import { Link } from 'react-router-dom';

export default function AccessibilityToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPageStructure, setShowPageStructure] = useState(false);
  const { settings, updateSettings, resetSettings } = useAccessibility();

  // Esc key down handler to close widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowPageStructure(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeFontSize = (direction: 'increase' | 'decrease') => {
    let current = settings.fontSizePercent || 100;
    if (direction === 'increase') {
      current = Math.min(200, current + 10);
    } else {
      current = Math.max(80, current - 10);
    }
    updateSettings({ fontSizePercent: current });
  };

  // Extract headings for the "Struttura della pagina" feature
  const [pageHeadings, setPageHeadings] = useState<{ text: string; id: string; level: number }[]>([]);
  useEffect(() => {
    if (isOpen && settings.pageStructure) {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map((h, index) => {
        const text = h.textContent?.trim() || '';
        // ensure element has id or set one
        if (!h.id) {
          h.id = `heading-ref-${index}`;
        }
        return {
          text,
          id: h.id,
          level: parseInt(h.tagName.substring(1)),
        };
      }).filter(item => item.text.length > 0);
      setPageHeadings(headings);
    } else {
      setPageHeadings([]);
    }
  }, [isOpen, settings.pageStructure]);

  return (
    <>
      {/* Floating Launcher Button - Sienna Style (Blue circle with white figure) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-44 right-4 md:bottom-28 md:right-8 z-[9990] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white p-4 rounded-full shadow-2xl border border-white/20 hover:scale-105 transition-all flex items-center justify-center animate-bounce-slow cursor-pointer"
        title="Menu Accessibilità"
        aria-label="Apri opzioni di accessibilità"
        id="sienna-accessibility-launcher"
      >
        <Accessibility className="h-7 w-7 text-white" />
        <span className="absolute -top-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full ring-2 ring-white" />
      </button>

      {/* Accessible Canvas Overlay & Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[150000] bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Widget Main Panel (sliding in from the right) */}
            <motion.div
              initial={{ x: '100%', opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 max-w-md w-full bg-slate-50 border-l border-slate-200 shadow-2xl z-[150001] flex flex-col h-screen text-slate-800 focus:outline-none font-sans"
              id="sienna-widget-panel"
            >
              {/* Sienna Widget Header */}
              <div className="bg-[#101b3a] px-6 py-5 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Accessibility className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold uppercase tracking-widest text-[13px] text-white leading-none">
                      Menu di accessibilità
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={resetSettings}
                    title="Ripristina impostazioni"
                    className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    title="Chiudi menu"
                    className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Language Selector Overlay (Matches Sienna Design in Screenshot 3) */}
              <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
                <span className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Lingua Selezionata:</span>
                <select 
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-1 font-bold text-[11px] outline-none hover:bg-slate-100 cursor-pointer"
                  disabled
                >
                  <option value="it">Italiano (Italian)</option>
                </select>
              </div>

              {/* Scrollable Container of Settings */}
              <div className="flex-grow overflow-y-auto px-6 py-6 space-y-8 scrollbar-thin">
                
                {/* --- SEZIONE 1: PROFILI DI ACCESSIBILITÀ --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <LayoutTemplate className="h-3.5 w-3.5 text-blue-500" /> PROFILI DI ACCESSIBILITÀ
                    </h4>
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* 2-Column Grid of 6 Profiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Epilepsy Safe Profile */}
                    <button
                      onClick={() => updateSettings({ profileEpilepsy: !settings.profileEpilepsy })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none ${
                        settings.profileEpilepsy 
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' 
                          : 'bg-white border-slate-250 text-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-1.5 rounded-lg ${settings.profileEpilepsy ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          <Sparkles className="h-4 w-4" />
                        </div>
                        {/* Toggle switch visual */}
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.profileEpilepsy ? 'bg-blue-600' : 'bg-slate-250'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.profileEpilepsy ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs leading-snug">Sicuro per crisi epilettiche</p>
                    </button>

                    {/* Blind Profile */}
                    <button
                      onClick={() => updateSettings({ profileBlind: !settings.profileBlind })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none ${
                        settings.profileBlind 
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' 
                          : 'bg-white border-slate-250 text-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-1.5 rounded-lg ${settings.profileBlind ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          <Volume2 className="h-4 w-4" />
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.profileBlind ? 'bg-blue-600' : 'bg-slate-250'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.profileBlind ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs leading-snug">Profilo per non vedenti</p>
                    </button>

                    {/* Visually Impaired Profile */}
                    <button
                      onClick={() => updateSettings({ profileVisuallyImpaired: !settings.profileVisuallyImpaired })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none ${
                        settings.profileVisuallyImpaired 
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' 
                          : 'bg-white border-slate-250 text-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-1.5 rounded-lg ${settings.profileVisuallyImpaired ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          <Eye className="h-4 w-4" />
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.profileVisuallyImpaired ? 'bg-blue-600' : 'bg-slate-250'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.profileVisuallyImpaired ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs leading-snug">Profilo per ipovedenti</p>
                    </button>

                    {/* ADHD Profile */}
                    <button
                      onClick={() => updateSettings({ profileAdhd: !settings.profileAdhd })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none ${
                        settings.profileAdhd 
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' 
                          : 'bg-white border-slate-250 text-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-1.5 rounded-lg ${settings.profileAdhd ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.profileAdhd ? 'bg-blue-600' : 'bg-slate-250'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.profileAdhd ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs leading-snug">Profilo per ADHD</p>
                    </button>

                    {/* Cognitive & Learning Profile */}
                    <button
                      onClick={() => updateSettings({ profileCognitive: !settings.profileCognitive })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none ${
                        settings.profileCognitive 
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' 
                          : 'bg-white border-slate-250 text-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-1.5 rounded-lg ${settings.profileCognitive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.profileCognitive ? 'bg-blue-600' : 'bg-slate-250'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.profileCognitive ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs leading-snug">Cognitivo e apprendimento</p>
                    </button>

                    {/* Motor Profile */}
                    <button
                      onClick={() => updateSettings({ profileMotor: !settings.profileMotor })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none ${
                        settings.profileMotor 
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' 
                          : 'bg-white border-slate-250 text-slate-800 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-1.5 rounded-lg ${settings.profileMotor ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          <Keyboard className="h-4 w-4" />
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.profileMotor ? 'bg-blue-600' : 'bg-slate-250'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.profileMotor ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs leading-snug">Disabilità motorie</p>
                    </button>

                  </div>
                </div>

                {/* --- SEZIONE 2: REGOLAZIONI DEL CONTENUTO --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Type className="h-3.5 w-3.5 text-blue-500" /> REGOLAZIONI DEL CONTENUTO
                    </h4>
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Font Size Adjustments Block */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Type className="h-4 w-4 text-slate-500" />
                      <span className="text-[11px] font-bold uppercase text-slate-600">Regola la dimensione del carattere</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => changeFontSize('decrease')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg active:scale-95 transition-all focus:outline-none"
                        disabled={settings.fontSizePercent <= 80}
                      >
                        —
                      </button>
                      <span className="text-sm font-black text-slate-800 font-mono tracking-widest leading-none">
                        {settings.fontSizePercent}%
                      </span>
                      <button 
                        onClick={() => changeFontSize('increase')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg active:scale-95 transition-all focus:outline-none"
                        disabled={settings.fontSizePercent >= 200}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 6 Grid items of adjustments */}
                  <div className="grid grid-cols-3 gap-2.5">
                    
                    {/* Bold Text */}
                    <button
                      onClick={() => updateSettings({ fontWeightBold: !settings.fontWeightBold })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.fontWeightBold ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-black text-lg">B</span>
                      <span className="text-[10px] font-bold leading-tight">Peso del carattere</span>
                    </button>

                    {/* Line height */}
                    <button
                      onClick={() => updateSettings({ lineHeightLarge: !settings.lineHeightLarge })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.lineHeightLarge ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <AlignLeft className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Altezza della linea</span>
                    </button>

                    {/* Letter Spacing */}
                    <button
                      onClick={() => updateSettings({ letterSpacingLarge: !settings.letterSpacingLarge })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.letterSpacingLarge ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <ArrowRightLeft className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Spaziatura lettere</span>
                    </button>

                    {/* Dyslexia Font */}
                    <button
                      onClick={() => updateSettings({ dyslexicFont: !settings.dyslexicFont })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.dyslexicFont ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-serif italic text-lg leading-none" style={{ fontFamily: 'OpenDyslexic' }}>d</span>
                      <span className="text-[10px] font-bold leading-tight">Carattere dislessia</span>
                    </button>

                    {/* Highlight Links */}
                    <button
                      onClick={() => updateSettings({ highlightLinks: !settings.highlightLinks })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.highlightLinks ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Underline className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Evidenzia i link</span>
                    </button>

                    {/* Highlight Titles */}
                    <button
                      onClick={() => updateSettings({ highlightTitles: !settings.highlightTitles })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.highlightTitles ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Heading className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Evidenzia i titoli</span>
                    </button>

                  </div>
                </div>

                {/* --- SEZIONE 3: AUSILI VISIVI E DI NAVIGAZIONE --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-blue-500" /> AUSILI VISIVI E DI NAVIGAZIONE
                    </h4>
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    
                    {/* Super Focus */}
                    <button
                      onClick={() => updateSettings({ superFocus: !settings.superFocus })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.superFocus ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Compass className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Super Focus</span>
                    </button>

                    {/* Lettore PDF */}
                    <button
                      onClick={() => {
                        updateSettings({ pdfReader: !settings.pdfReader });
                        if (!settings.pdfReader) {
                          alert("Assistente lettore PDF caricato in background. Garantisce che i file allegati vengano interpretati correttamente per l'accessibilità.");
                        }
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.pdfReader ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <FileText className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Lettore PDF</span>
                    </button>

                    {/* Screen Reader (TTS) */}
                    <button
                      onClick={() => updateSettings({ textToSpeech: !settings.textToSpeech })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.textToSpeech ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Volume2 className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Sintesi vocale</span>
                    </button>

                    {/* Guida alla lettura */}
                    <button
                      onClick={() => updateSettings({ readingGuide: !settings.readingGuide })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.readingGuide ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <BookMarked className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Guida alla lettura</span>
                    </button>

                    {/* Cursore grande */}
                    <button
                      onClick={() => updateSettings({ largeCursor: !settings.largeCursor })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.largeCursor ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <MousePointer className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Cursore grande</span>
                    </button>

                    {/* Struttura della Pagina (Page Structure map of headings) */}
                    <button
                      onClick={() => {
                        const nextVal = !settings.pageStructure;
                        updateSettings({ pageStructure: nextVal });
                        if (nextVal) setShowPageStructure(true);
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 text-center aspect-square transition-all focus:outline-none ${
                        settings.pageStructure ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <LayoutTemplate className="h-5 w-5 text-slate-500" />
                      <span className="text-[10px] font-bold leading-tight">Struttura pagina</span>
                    </button>

                  </div>
                </div>

              </div>

            </motion.div>

            {/* Sub-panel overlay for page structure headings map */}
            <AnimatePresence>
              {showPageStructure && settings.pageStructure && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fixed right-[448px] top-6 bottom-6 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[200005] flex flex-col overflow-hidden max-h-[85vh] m-auto"
                >
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
                    <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 text-indigo-300">
                      <LayoutTemplate className="h-4 w-4 shrink-0" /> Mappa Titoli Pagina
                    </h4>
                    <button 
                      onClick={() => setShowPageStructure(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-grow overflow-y-auto px-5 py-4 space-y-2.5">
                    {pageHeadings.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 text-center">Nessun titolo identificato in questa pagina.</p>
                    ) : (
                      pageHeadings.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const elem = document.getElementById(h.id);
                            if (elem) {
                              elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              elem.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'transition-all');
                              setTimeout(() => {
                                elem.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2');
                              }, 3000);
                            }
                            setShowPageStructure(false);
                            setIsOpen(false);
                          }}
                          className="w-full text-left p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-start gap-2 focus:outline-none"
                        >
                          <span className={`text-[10px] font-black uppercase text-indigo-500 shrink-0 select-none bg-indigo-50 px-1 rounded`}>
                            H{h.level}
                          </span>
                          <span className="text-xs font-bold text-slate-700 leading-tight">
                            {h.text}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="bg-slate-50 p-3 italic text-[9px] text-slate-400 text-center border-t border-slate-100">
                    Clicca un titolo per saltare alla rispettiva sezione.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
