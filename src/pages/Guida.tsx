import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ChevronRight, MapPin, Search, ShieldCheck, Mail, Volume2, Play, Pause, Square, Info, ShieldAlert, Award, FileText } from 'lucide-react';
import { useAccessibility } from '@/src/contexts/AccessibilityContext';

export default function Guida() {
  const { settings } = useAccessibility();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current) return;
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
      title: '1. Introduzione ad AnimalHub PA',
      icon: <HelpCircle className="h-6 w-6" />,
      content: 'AnimalHub PA è la piattaforma informatica del Comune di Naro progettata per digitalizzare, tracciare e rendere trasparente la gestione del randagismo e la salvaguardia del benessere animale. Il portale è diviso in moduli integrati per supportare il cittadino e facilitare il coordinamento degli operatori comunali, della Polizia Municipale e dei veterinari territoriali.',
    },
    {
      id: 'modulo-a',
      title: '2. Come fare una Segnalazione (Modulo A)',
      icon: <MapPin className="h-6 w-6" />,
      content: 'Nel menù superiore seleziona "Segnala". Scegli la specie (Cane o Gatto), inserisci lo stato di urgenza e le condizioni fisiche visibili dell\'animale. Clicca sulla mappa interattiva per apporre il marcatore esatto delle coordinate GPS o inserisci l\'indirizzo manualmente. Carica una foto nitida per accelerare l\'identificazione. Al termine, inserisci il tuo nome e ricevi un codice univoco utile a monitorare lo stato di adozione o ricovero.',
    },
    {
      id: 'mia-area',
      title: '3. Accedere al Fascicolo Cittadino (La Mia Area)',
      icon: <Search className="h-6 w-6" />,
      content: 'Cliccando su "La Mia Area" puoi inserire la tua email per ricevere un codice OTP immediato e accedere in sicurezza al tuo fascicolo. Qui visualizzi l\'elenco delle segnalazioni che hai inoltrato, lo stato attuale ("In Carico", "Risolta"), i commenti ufficiali degli operatori d\'ufficio (Modulo B), la scheda sanitaria digitale firmata dai veterinari (Modulo C), e i dettagli per avviare un adozione.',
    },
    {
      id: 'affido',
      title: '4. Percorsi di Adozione e Verbale Digitale COF',
      icon: <Award className="h-6 w-6" />,
      content: 'Esplora il database degli animali adottabili sulla Home page. Ogni animale dispone di una scheda descrittiva, stato vaccinale, e un pulsante per inviare istantaneamente la richiesta d\'affido. Se la richiesta ha esito positivo, gli uffici generano il certificato informatico digitale unico COF (Codice Opzione Famiglia), registrando formalmente il passaggio di proprietà e programmando i successivi controlli di tutela.',
    },
    {
      id: 'privacy',
      title: '5. Riservatezza dei Dati e Sicurezza dei Sistemi',
      icon: <ShieldCheck className="h-6 w-6" />,
      content: 'I dati comunicati dai cittadini e dai segnalanti sono tutelati ai sensi del Regolamento Europeo GDPR n. 679/2016. Le informazioni personali sono consultabili esclusivamente ed esclusivamente dagli operatori di Pubblica Sicurezza del Comune e dai veterinari ufficiali della ASP, eliminando qualsiasi esposizione pubblica.',
    },
    {
      id: 'supporto',
      title: '6. Supporto Informatico e Contatti dell\'Ente',
      icon: <Mail className="h-6 w-6" />,
      content: 'Per difficoltà operative o supporto nell\'uso dei servizi tecnologici puoi mandare un\'email a protocollo@comune.naro.ag.it o telefonare all\'Ufficio Relazioni con il Pubblico (URP) al recapito comunale di Piazza Garibaldi.',
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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Guida Utente</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">La Guida al Portale Civico</h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider text-left">
                Istruzioni operative ed istituzionali per la tutela animale nel Comune di <span className="text-[#101b3a] font-extrabold">Naro</span>.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSpeakAll}
                disabled={isPlaying}
                className="h-9 px-4 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Ascolta Guida Intera
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
              Lettore vocale attivo: Clicca su ciascun punto della guida per ascoltare la spiegazione letta dal sintetizzatore.
            </p>
          )}
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left instructions list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`group cursor-pointer p-6 rounded-xl border border-slate-200/80 transition-all text-left ${
                      settings.textToSpeech ? 'hover:border-[#15803d] hover:bg-emerald-50/10' : 'hover:border-slate-300 hover:bg-slate-50/20'
                    }`}
                    onClick={() => settings.textToSpeech && speak(`${section.title}. ${section.content}`)}
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                        index % 2 === 0 ? 'bg-[#15803d] text-white' : 'bg-[#101b3a] text-white'
                      }`}>
                        {React.cloneElement(section.icon, { className: "h-5 w-5" })}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-black text-[#101b3a] tracking-tight">{section.title}</h3>
                          {settings.textToSpeech && <Volume2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar info */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-left flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#15803d]">Chi Siamo</span>
              <h2 className="text-lg font-black text-[#101b3a]">Innovazione Strategica</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                L'ambizione del Comune è creare un ecosistema trasparente ed offline-first per accelerare le tempistiche di risposta in materia di randagismo e salute canina. 
              </p>
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                  <span className="text-[11px] font-bold text-slate-600">Georeferenziazione attiva</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                  <span className="text-[11px] font-bold text-slate-600">Integrazione cartografica e GPS</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                  <span className="text-[11px] font-bold text-slate-600">OTP per tutela privacy e accesso</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                  <span className="text-[11px] font-bold text-slate-600">Digitalizzazione COF d'affido</span>
                </div>
              </div>
            </div>

            <div className="bg-[#101b3a] rounded-2xl p-6 text-white text-left flex flex-col gap-3 shadow-md">
              <Info className="h-6 w-6 text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Canale Domande Frequenti</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Cerchi risposte specifiche in merito a sanzioni, leggi vigenti, rimborsi comunali, microchip o colonie feline?
              </p>
              <a 
                href="/faq" 
                className="mt-2 bg-white text-[#101b3a] text-center font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              >
                Esplora le FAQ &rarr;
              </a>
            </div>

            <div className="bg-white/50 rounded-2xl border border-dashed border-slate-300 p-6 text-left flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase text-slate-600">Presenza di Barriere?</h4>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                Il sito è sviluppato seguendo accurati rapporti di contrasto visuale e supporta l'ingrandimento caratteri e riproduzione ad attivazione vocale. Se riscontri bug o blocchi di accessibilità segnalacelo subito all'assistenza tecnica.
              </p>
            </div>
          </div>

        </div>

        {/* AI Callout */}
        <div className="bg-slate-100/50 rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Hai un cane smarrito e provvisto di microchip?</h2>
          <p className="text-xs text-slate-500 font-semibold max-w-xl">Chiedi istantaneamente al modulo AI collocato in basso a destra per scorrere i canili di rifugio o verificare la corrispondenza immediata con le segnalazioni d'ufficio del Comune.</p>
          <button
            onClick={() => speak("Per assistenza urgente chiedi al nostro chatbot di supporto guidato in basso a destra.")}
            className="text-[9px] font-black uppercase tracking-widest text-[#15803d]"
          >
            Apri Risoluzione Intelligente &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
