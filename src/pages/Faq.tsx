import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ChevronRight, Search, Play, Volume2, Square, Dog, Cat, ShieldAlert, Award, FileText } from 'lucide-react';
import { useAccessibility } from '@/src/contexts/AccessibilityContext';

export default function Faq() {
  const { settings } = useAccessibility();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');

  const faqs = [
    {
      category: "Segnalazioni",
      question: "Come posso fare una segnalazione di randagismo?",
      answer: "Dalla barra di navigazione o direttamente dalla home page, clicca su 'Fai una Segnalazione'. Seleziona il Modulo A e compila tutti i dati richiesti: specie dell'animale, indirizzo esatto con geolocalizzazione sulla mappa interattiva, stato generale di salute, taglia e colore. Se possibile, allega una o più foto: questo aiuterà gli operatori e la Polizia Municipale a localizzare più rapidamente l'animale. Al termine, riceverai un codice identificativo per seguire l'avanzamento della pratica."
    },
    {
      category: "Adozioni",
      question: "Qual è la procedura per inoltrare una richiesta d'adozione?",
      answer: "Tutti i cani idonei all'adozione ospitati presso i canili convenzionati o in stallo temporaneo protetto sono inclusi nel nostro Archivio Digitale pubblico nel 'Database Animali' sulla Home. Esplorando i loro profili, puoi cliccare sul pulsante 'Richiedi Adozione' per compilare la richiesta. Verrai contattato dagli uffici comunali o dalle associazioni convenzionate per avviare il colloquio gratuito e il percorso di affido consapevole tramite il modulo COF."
    },
    {
      category: "Normative",
      question: "Quali sanzioni sono previste per chi abbandona o maltratta un animale?",
      answer: "Ai sensi dell'articolo 727 del Codice Penale italiano, l'abbandono di animali domestici o che abbiano acquisito abitudini della cattività è un reato punito con l'arresto fino a un anno o con un'ammenda compresa tra 1.000 e 10.000 euro. Il maltrattamento di animali costituisce un reato penale ancor più grave ai sensi dell'art. 544-ter. L'Amministrazione Comunale di Naro collabora attivamente con le autorità giudiziarie per identificare e perseguire i trasgressori."
    },
    {
      category: "Normative",
      question: "L'inserimento del microchip è obbligatorio per i cani dei cittadini?",
      answer: "Sì, l'iscrizione all'Anagrafe Canina Regionale e l'impianto del microchip identificativo sono obblighi di legge per tutti i cani di proprietà. Devono essere effettuati entro i primi 60 giorni di vita dell'animale o entro 10 giorni dall'inizio del possesso per cani adulti non registrati. La mancata microchippatura costituisce un illecito amministrativo severamente sanzionato e rende impossibile rintracciare il proprietario in caso di smarrimento."
    },
    {
      category: "Gestione",
      question: "Come posso tracciare lo stato delle mie segnalazioni?",
      answer: "Ogni volta che invii una segnalazione, il sistema genera un codice identificativo univoco. Puoi inserire questo codice, unitamente alla tua email di contatto, nella sezione 'La Mia Area'. Potrai monitorare in tempo reale se la segnalazione è stata presa in carico dagli operatori, se i veterinari sono intervenuti, visualizzare le note di aggiornamento e scaricare il PDF ufficiale di riepilogo della pratica."
    },
    {
      category: "Costi e Servizi",
      question: "Chi sostiene i costi delle cure e del ricovero dei randagi?",
      answer: "Tutti i costi di recupero, pronto soccorso veterinario d'urgenza, sterilizzazione preventiva e mantenimento presso le strutture convenzionate per gli animali randagi ritrovati sul territorio di Naro sono interamente coperti dalle casse comunali e dai fondi dedicati al benessere animale, in stretta sinergia con il servizio veterinario dell'Azienda Sanitaria Provinciale (ASP)."
    },
    {
      category: "Colonie Feline",
      question: "Cosa sono le colonie feline protette e come sono tutelate?",
      answer: "Le colonie feline sono gruppi di gatti liberi che vivono e frequentano stabilmente un determinato territorio pubblico o privato. Esse sono ufficialmente censite, registrate presso l'ASP e protette ai sensi della Legge 281/1991. È severamente vietato allontanare o maltrattare i gatti di colonia. I volontari locali accreditati assicurano la nutrizione e l'igiene, mentre il Comune coordina i programmi gratuiti di cattura e sterilizzazione per il controllo demografico."
    },
    {
      category: "Emergenze",
      question: "Chi devo contattare in caso di emergenza imminente di notte o nei festivi?",
      answer: "In caso di imminente pericolo stradale, animale gravemente incidentato o in condizioni sanitarie critiche in spazi pubblici, contatta immediatamente il Comando di Polizia Municipale di Naro o le Forze dell'Ordine. Questi enti attiveranno immediatamente il reperibile del Servizio Veterinario ASP, abilitato al soccorso di emergenza H24 sul territorio comunale."
    }
  ];

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

  const handleSpeakAll = () => {
    const textToSpeak = filteredFaqs.map(f => `${f.question}. Risposta: ${f.answer}`).join(' ');
    speak(textToSpeak || "Nessuna domanda trovata con i filtri correnti.");
  };

  const categories = ['Tutte', 'Segnalazioni', 'Adozioni', 'Normative', 'Gestione', 'Costi e Servizi', 'Colonie Feline', 'Emergenze'];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'Tutte' || faq.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Risposte Rapide</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">Domande Frequenti (FAQ)</h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider text-left">
                Tutto quello che c'è da sapere sulla tutela animale e l'utilizzo dei servizi del Comune di Naro.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSpeakAll}
                disabled={isPlaying}
                className="h-9 px-4 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Leggi FAQs a Voce
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
              Assistenza vocale attiva: Clicca sulla scheda di una domanda per riprodurre vocalmente la risposta.
            </p>
          )}
        </div>

        {/* Filters and Search Search Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cerca tra le FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 focus:border-[#15803d] transition-all text-slate-700 font-sans"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Categories bar */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto justify-start md:justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#101b3a] text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="border border-slate-200/80 rounded-xl overflow-hidden transition-all hover:border-slate-300 shadow-sm"
                >
                  <button
                    onClick={() => {
                      setActiveFaq(isOpen ? null : idx);
                      if (settings.textToSpeech) {
                        speak(`${faq.question}. Risposta: ${faq.answer}`);
                      }
                    }}
                    className="w-full flex items-center justify-between p-5 bg-slate-50/40 hover:bg-slate-50/80 transition-all text-left font-sans text-xs sm:text-sm font-black text-[#101b3a] cursor-pointer outline-none gap-4"
                  >
                    <span className="flex items-center gap-3 pr-2 leading-tight">
                      <HelpCircle className="h-4.5 w-4.5 text-[#15803d] shrink-0" />
                      {faq.question}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-[#101b3a]/5 text-[#101b3a] text-[8px] font-black uppercase tracking-widest">{faq.category}</span>
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#15803d]' : ''}`} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 border-t border-slate-100 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold text-left">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm font-bold flex flex-col items-center justify-center gap-2">
                <HelpCircle className="h-8 w-8 text-slate-300 animate-bounce" />
                Nessuna risposta trovata con i filtri inseriti. Prova ad inserire parole chiave alternative.
              </div>
            )}
          </div>
        </div>

        {/* Core Law & Regulatory Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#15803d]/5 rounded-2xl border border-[#15803d]/20 p-6 text-left flex flex-col gap-3">
            <Award className="h-6 w-6 text-[#15803d]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#15803d]">Legge Quadro 281/1991</span>
            <h3 className="text-sm font-bold text-[#101b3a]">Tutela Nazionale degli Animali</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              La legge nazionale sancisce il divieto assoluto di soppressione dei cani randagi non pericolosi, incentivando la sterilizzazione gratuita e affidando ai Comuni la responsabilità del benessere e del controllo.
            </p>
          </div>
          
          <div className="bg-[#101b3a]/5 rounded-2xl border border-[#101b3a]/20 p-6 text-left flex flex-col gap-3">
            <ShieldAlert className="h-6 w-6 text-[#101b3a]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#101b3a]">Art. 727 Codice Penale</span>
            <h3 className="text-sm font-bold text-[#101b3a]">Reato di Abbandono</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Chiunque abbandona animali domestici o che abbiano acquisito abitudini della cattività è punito con l'arresto fino ad un anno o con un'ammenda da 1.000 a 10.000 euro, oltre all'iscrizione nel casellario giudiziale.
            </p>
          </div>

          <div className="bg-emerald-50 text-left rounded-2xl border border-emerald-150 p-6 flex flex-col gap-3">
            <FileText className="h-6 w-6 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Archivio Certificati - COF</span>
            <h3 className="text-sm font-bold text-emerald-800">Affido Digitale Tracciabile</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Attraverso il portale, l'inserimento dell'affido temporaneo produce un certificato digitale crittografico unico COF, validando legalmente l'accoglienza del randagio e coordinando i controlli post-affido della ASP.
            </p>
          </div>
        </div>

        {/* AI Callout */}
        <div className="bg-slate-100/50 rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Ancora Dubbi? Chiedi al Nostro Assistente AI</h2>
          <p className="text-xs text-slate-500 font-semibold max-w-xl">Il nostro operatore multimediale automatico virtuale è collocato in basso a destra dello schermo. È istruito sull'intero regolamento comunale di Naro per pre-compilare dati e fornire assistenza.</p>
          <button
            onClick={() => speak("Clicca sul cerchio blu in basso a destra del browser per avviare una conversazione interattiva col nostro tutor automatico!")}
            className="text-[9px] font-black uppercase tracking-widest text-[#15803d]"
          >
            Sblocca Assistenza Intelligente &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
