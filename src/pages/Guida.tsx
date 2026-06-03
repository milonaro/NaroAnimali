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
      title: 'Benvenuto su NaroAnimali',
      icon: <HelpCircle className="h-6 w-6" />,
      content: 'NaroAnimali è la piattaforma ufficiale del Comune di Naro dedicata alla tutela degli animali randagi. Qui puoi segnalare animali in difficoltà, monitorare lo stato delle tue segnalazioni e consultare la mappa del territorio.',
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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#101b3a] py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Guida al Portale
            </h1>
            <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Tutte le informazioni necessarie per utilizzare correttamente il servizio di segnalazione del Comune di Naro.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleSpeakAll}
                disabled={isPlaying}
                className="bg-[#15803d] text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-[#166534] transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Ascolta Tutto
              </button>
              {isPlaying && (
                <button
                  onClick={stop}
                  className="bg-white/10 text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-white/20 transition-all flex items-center gap-3 border border-white/20 backdrop-blur-sm"
                >
                  <Square className="h-4 w-4" /> Ferma
                </button>
              )}
            </div>
            
            {settings.textToSpeech && (
              <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest mt-6 animate-pulse">
                Sintesi vocale attiva: clicca sulle sezioni per ascoltarle
              </p>
            )}
          </motion.div>
        </div>
        <div className="absolute left-0 bottom-0 top-0 w-1/3 bg-white/5 -skew-x-12 -translate-x-1/2"></div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group cursor-pointer p-8 rounded-[2.5rem] border border-gray-100 transition-all ${
                  settings.textToSpeech ? 'hover:border-emerald-500 hover:bg-emerald-50/30' : 'hover:shadow-xl'
                }`}
                onClick={() => settings.textToSpeech && speak(`${section.title}. ${section.content}`)}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 ${
                    index % 2 === 0 ? 'bg-[#15803d] text-white' : 'bg-[#101b3a] text-white'
                  }`}>
                    {section.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-[#101b3a] tracking-tight">{section.title}</h3>
                      {settings.textToSpeech && <Volume2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[#101b3a] mb-6">Hai altre domande?</h2>
          <p className="text-gray-500 mb-10">Il nostro assistente virtuale è sempre disponibile in basso a destra per rispondere ai tuoi dubbi.</p>
          <div className="flex justify-center flex-wrap gap-4">
            <button
               onClick={() => speak("Puoi sempre chiedere aiuto al nostro assistente virtuale cliccando sull'icona in basso a destra.")}
               className="text-[10px] font-black uppercase tracking-widest text-[#15803d] flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" /> Leggi suggerimento
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
