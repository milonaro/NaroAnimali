import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ChevronRight, MapPin, Search, ShieldCheck, Mail, Volume2, Play, Pause, Square } from 'lucide-react';
import { useAccessibility } from '@/src/contexts/AccessibilityContext';

export default function Guida() {
  const { settings } = useAccessibility();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stop = () => {
    synthRef.current?.cancel();
    setIsPlaying(false);
  };

  const sections = [
    {
      id: 'general',
      title: 'Benvenuto su AnimalHub PA',
      icon: <HelpCircle className="h-6 w-6" />,
      content: 'AnimalHub PA è la piattaforma ufficiale del Comune di Naro dedicata alla tutela degli animali randagi. Qui puoi segnalare animali in difficoltà, monitorare lo stato delle tue segnalazioni e consultare la mappa del territorio.',
    },
    {
      id: 'segnala',
      title: 'Come Segnalare',
      icon: <MapPin className="h-6 w-6" />,
      content: 'Per fare una segnalazione, clicca su "Segnala" nel menu. Indica la posizione esatta sulla mappa, carica una foto se possibile e descrivi brevemente le condizioni dell\'animale. Riceverai un codice univoco per seguire la pratica.',
    },
    {
      id: 'area',
      title: 'La Mia Area',
      icon: <Search className="h-6 w-6" />,
      content: 'Accedi alla "Mia Area" inserendo il codice della tua segnalazione o la tua email. Potrai scaricare il riepilogo in PDF, vedere gli aggiornamenti del Comune e le statistiche generali del territorio.',
    },
    {
      id: 'privacy',
      title: 'Privacy e Sicurezza',
      icon: <ShieldCheck className="h-6 w-6" />,
      content: 'Il sistema è conforme al GDPR. I tuoi dati personali sono utilizzati esclusivamente per gestire la segnalazione e non saranno mai ceduti a terzi senza il tuo consenso esplicito.',
    },
    {
      id: 'contatti',
      title: 'Contatti Utili',
      icon: <Mail className="h-6 w-6" />,
      content: 'Per emergenze critiche contatta la Polizia Municipale di Naro. Per supporto tecnico sulla piattaforma, scrivi a protocollo@comune.naro.ag.it.',
    }
  ];

  const handleSpeakAll = () => {
    const fullText = sections.map(s => `${s.title}. ${s.content}`).join(' ');
    speak(fullText);
  };

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Modern Header block */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Documentazione di Servizio</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">Guida al Portale Civico</h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider text-left">
                Tutte le istruzioni per un corretto utilizzo del servizio di segnalazione del Comune di <span className="text-[#101b3a] font-extrabold">Naro</span>.
              </p>
            </div>
            
            {/* Quick stats / safety indicators */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSpeakAll}
                disabled={isPlaying}
                className="h-9 px-4 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Ascolta Guida
              </button>
              {isPlaying && (
                <button
                  onClick={stop}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-slate-200"
                >
                  <Square className="h-3.5 w-3.5" /> Ferma
                </button>
              )}
            </div>
          </div>
          {settings.textToSpeech && (
            <p className="text-emerald-600 text-[9px] uppercase font-bold tracking-widest animate-pulse border-t border-slate-100 pt-3">
              Sintesi vocale attiva: clicca sulle sezioni sottostanti per riprodurre l'audio sintetizzato.
            </p>
          )}
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group cursor-pointer p-6 rounded-xl border border-slate-200/80 transition-all ${
                  settings.textToSpeech ? 'hover:border-emerald-500 hover:bg-emerald-50/15' : 'hover:border-slate-300 hover:bg-slate-50/20'
                }`}
                onClick={() => settings.textToSpeech && speak(`${section.title}. ${section.content}`)}
              >
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                    index % 2 === 0 ? 'bg-[#15803d] text-white' : 'bg-[#101b3a] text-white'
                  }`}>
                    {React.cloneElement(section.icon, { className: "h-5 w-5" })}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-[#101b3a] tracking-tight">{section.title}</h3>
                      {settings.textToSpeech && <Volume2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-semibold text-left">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ CTA */}
        <div className="bg-slate-100/50 rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Hai altre domande o necessità operative?</h2>
          <p className="text-xs text-slate-500 font-semibold max-w-xl">Il nostro assistente virtuale assistito dall'Intelligenza Artificiale è sempre disponibile in basso a destra per rispondere immediatamente in tempo reale.</p>
          <button
             onClick={() => speak("Puoi sempre chiedere aiuto al nostro assistente virtuale cliccando sull'icona in basso a destra.")}
             className="text-[9px] font-black uppercase tracking-widest text-[#15803d] hover:text-[#166534] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Volume2 className="h-4 w-4" /> Leggi Suggerimento Vocale &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
