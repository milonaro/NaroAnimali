import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Info, ArrowUpRight, Sparkles, HelpCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  role: 'user' | 'model';
  parts: { text: string };
}

export default function AssistenteAI() {
  const { language, t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [cityName, setCityName] = useState("Naro");

  // Comprehensive logger for compliance and audits
  const logChatActivity = (event: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      siteName,
      cityName,
      language,
      ...details
    };
    console.log("[AI Assistente LOG TRACE]:", JSON.stringify(logEntry, null, 2));
    try {
      const existingLogs = localStorage.getItem('animalhub_ai_audit_logs');
      let logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.unshift(logEntry);
      if (logs.length > 300) logs = logs.slice(0, 300); // Last 300 logs
      localStorage.setItem('animalhub_ai_audit_logs', JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to write audit logs to localStorage", e);
    }
  };

  useEffect(() => {
    // Scroll entire window to top instantly on mount
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) {
            setSiteName(config.siteName);
            setCityName(config.siteName.replace("Comune di ", ""));
          }
        }
      } catch(e) {}
    };
    fetchConfig();

    // Recover persisted chat history on entry
    const saved = localStorage.getItem('animalhub_ai_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          logChatActivity("LOAD_CHAT_HISTORY_SUCCESS", { messageCount: parsed.length });
        }
      } catch (e) {
        logChatActivity("LOAD_CHAT_HISTORY_CORRUPT", { error: String(e) });
      }
    } else {
      logChatActivity("LOAD_CHAT_HISTORY_EMPTY", {});
    }
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() || loading) return;

    logChatActivity("USER_SEND_MESSAGE_BEGIN", { textLength: textToSend.length, isPreset: customText !== undefined });

    const userMsg: Message = { role: 'user', parts: { text: textToSend } };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    localStorage.setItem('animalhub_ai_chat_history', JSON.stringify(newMessages));

    if (customText === undefined) {
      setInput('');
    }
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const modelResponse: Message = { role: 'model', parts: { text: data.text } };
      const updatedMessages = [...newMessages, modelResponse];
      
      setMessages(updatedMessages);
      localStorage.setItem('animalhub_ai_chat_history', JSON.stringify(updatedMessages));
      
      logChatActivity("MODEL_RESPONSE_SUCCESS", { 
        responseLength: data.text.length,
        totalChatTurns: Math.ceil(updatedMessages.length / 2)
      });
    } catch (err: any) {
      logChatActivity("MODEL_RESPONSE_ERROR", { error: err.message || String(err) });
      
      const errorResponse: Message = { 
        role: 'model', 
        parts: { 
          text: language === 'it' 
            ? "Scusa, ho riscontrato un problema tecnico. Per favore riprova tra poco o contatta direttamente gli uffici." 
            : "Sorry, I encountered a technical issue. Please try again in a moment or contact the municipal office directly." 
        } 
      };
      const updatedMessages = [...newMessages, errorResponse];
      setMessages(updatedMessages);
      localStorage.setItem('animalhub_ai_chat_history', JSON.stringify(updatedMessages));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(language === 'it' ? "Sei sicuro di voler cancellare tutta la cronologia della chat?" : "Are you sure you want to clear your chat history?")) {
      setMessages([]);
      localStorage.removeItem('animalhub_ai_chat_history');
      logChatActivity("CHAT_HISTORY_CLEARED_BY_USER", {});
    }
  };

  const suggerimenti = language === 'it' 
    ? [
        "Quali sono le sanzioni per l'abbandono di animali?",
        "Come posso segnalare un cane ferito o in difficoltà?",
        "Quali sono gli orari dell'Ufficio Diritti Animali?",
        "Come funziona l'anagrafe canina e l'obbligo del microchip?",
        "Come posso procedere per adottare un cane dal canile?"
      ]
    : [
        "What are the penalties for abandoning animals?",
        "How do I report an injured or distressed stray?",
        "What are the office hours for the Animal Rights Office?",
        "How does the canine registry and microchip requirement work?",
        "How can I adopt a dog from the shelter?"
      ];

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Page Header - Matches FAQ layout precisely */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d] flex items-center gap-1.5 animate-pulse">
                <Sparkles className="h-3.5 w-3.5" /> {language === 'it' ? 'Assistenza Istituzionale Intelligente' : 'Intelligent Institutional Assistant'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">
                {language === 'it' ? 'Chiedi all\'Assistente AI' : 'Ask the AI Assistant'}
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider text-left">
                {language === 'it' 
                  ? `Interagisci in tempo reale con l'intelligenza di AnimalHub PA istruita sulle delibere comunali di ${cityName}.`
                  : `Interact in real time with the legal and operational handbook of AnimalHub PA trained for ${cityName}.`}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title={language === 'it' ? 'Cancella cronologia messaggi' : 'Clear your chat history'}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>{language === 'it' ? 'Cancella Cronologia' : 'Clear History'}</span>
                </button>
              )}
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                  {language === 'it' ? 'Sistema Attivo & Certificato' : 'Certified & Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          
          {/* Main Chat Interface - Occupies 8 columns on large screens */}
          <div className="col-span-1 lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[70vh] min-h-[500px]">
            
            {/* Informative Warning Banner */}
            <div className="bg-amber-50 px-5 py-3.5 flex items-center gap-3 border-b border-amber-150/60 shrink-0 select-none">
               <AlertTriangle className="h-4 w-4 text-amber-705 shrink-0" />
               <p className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider leading-tight">
                 {language === 'it' 
                   ? 'Solo supporto informativo. In caso di emergenze mediche o pericoli stradali imminenti, contatta i veterinari reperibili ASP o la Polizia Locale.'
                   : 'For information only. For active medical emergencies, contact local veterinary ASP services or Municipal Police.'}
               </p>
            </div>

            {/* Conversation Canvas */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/40">
              {messages.length === 0 && (
                <div className="text-center py-6 sm:py-10 max-w-2xl mx-auto space-y-6">
                  <div className="w-16 h-16 bg-[#15803d]/5 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-[#15803d]/10">
                    <MessageSquare className="h-7 w-7 text-[#15803d]" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-black text-[#1e3a5f] uppercase tracking-tight">
                      {language === 'it' ? 'Come possiamo aiutarti oggi?' : 'How can I assist you today?'}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      {language === 'it' 
                        ? `Benvenuto su AI Assistente di ${siteName}. Sono pronto a guidarti sulle normative del benessere animale, anagrafe canina sicura con microchip, e iter di adozione COF.`
                        : `Welcome to the ${siteName} AI. I'm ready to help you with animal welfare regulations, chip registrations, and municipal dog shelter adoptions.`}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-4 text-left">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                       <HelpCircle className="h-3.5 w-3.5 text-gray-300" />
                       {language === 'it' ? 'Chiedi risposte istantanee su questi argomenti:' : 'Ask fast questions on these topics:'}
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggerimenti.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleSend(q)}
                            className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-left text-xs font-bold text-gray-650 hover:border-[#15803d] hover:text-[#15803d] hover:bg-[#15803d]/5 hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span className="line-clamp-2 pr-2">{q}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#15803d]" />
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs md:text-[13px] font-medium leading-relaxed shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-[#15803d] border-[#166534] text-white rounded-tr-none' 
                      : 'bg-white border-slate-200 text-[#1e3a5f] rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.parts.text}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-[#15803d] animate-spin" />
                    <span className="text-xs text-gray-400 font-bold tracking-tight uppercase animate-pulse">{language === 'it' ? 'Elaborazione...' : 'Thinking...'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Control Center */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={language === 'it' ? "Scrivi qui la tua domanda (es. sanzioni abbandono...)" : "Type your question here (e.g., leash regulations...)"}
                  className="w-full bg-slate-50/70 border border-slate-200 p-4 pr-16 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#15803d] focus:ring-4 focus:ring-[#15803d]/5 transition-all text-slate-800"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2.5 bg-[#15803d] text-white rounded-lg hover:bg-[#166534] active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Sources and References Sidebar - Occupies 4 columns on large screens */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            
            {/* Box Fonti Dati (Sources) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 block mb-1">{language === 'it' ? 'FONTI ACCREDITATE' : 'VERIFIED RESOURCES'}</span>
                <h2 className="text-lg font-black text-[#101b3a] tracking-tight">{language === 'it' ? 'Sorgenti & Fonti dell\'AI' : 'AI Context Sources'}</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                  {language === 'it' 
                    ? `L'intelligenza artificiale estrae le risposte consultando in tempo reale le seguenti fonti ufficiali e regolamenti di ${cityName}:`
                    : `The AI answers queries based strictly on the following regulatory guidelines and municipal papers of ${cityName}:`}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  {
                    id: "regolamento_naro",
                    title: language === 'it' ? "Regolamento Tutela Animali" : "Animal Care Regulation",
                    ent: `Città di ${cityName} (C.C. n.12)`,
                    desc: language === 'it' ? "Disciplina la cura degli animali in proprietà, i doveri dei conduttori, le colonie feline e le sanzioni pecuniarie." : "Governs companion animal care, owner requirements, free-roaming cat protection, and local penalties.",
                    badge: language === 'it' ? "Comunale" : "Municipal",
                    badgeColor: "bg-indigo-50 border-indigo-200 text-indigo-700",
                    query: language === 'it' ? "Quali sono gli obblighi del proprietario previsti dal regolamento comunale?" : "What are the local animal regulations from the municipality?"
                  },
                  {
                    id: "legge_281",
                    title: "Legge n. 281/1991",
                    ent: "Legge Quadro dello Stato",
                    desc: language === 'it' ? "Norma quadro nazionale in materia di animali d'affezione e prevenzione del randagismo. Vieta la soppressione e favorisce la sterilizzazione." : "National framework on animal protection and stray population control. Prohibits euthanasia for healthy strays.",
                    badge: language === 'it' ? "Nazionale" : "National",
                    badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-700",
                    query: language === 'it' ? "Cosa dice la legge nazionale 281/1991 sull'abbandono dei cani?" : "What does national law 281/1991 say about euthanasia or abandoning animals?"
                  },
                  {
                    id: "lr_15_2000",
                    title: "Legge Regionale Siciliana 15/2000",
                    ent: "Regione Siciliana",
                    desc: language === 'it' ? "Ripartisce i doveri tra i Comuni (alloggio, soccorso, affido COF) e della ASP locale (profilassi, sterilizzazioni, anagrafe canina)." : "Defines welfare responsibilities of Sicilian Municipalities (housing, Module A) and the Regional ASP Veterinary units.",
                    badge: language === 'it' ? "Regionale" : "Regional",
                    badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
                    query: language === 'it' ? "Quali sono le competenze dell'ASP e del Comune nella sterilizzazione?" : "What are the duties of the regional ASP and the municipality under Sicily Law 15/2000?"
                  },
                  {
                    id: "linee_guida_chip",
                    title: "Manuale Registrazione Chip",
                    ent: "Ministero della Salute / ASP",
                    desc: language === 'it' ? "Guida operativa e requisiti anagrafici per la registrazione e il trasferimento di proprietà dei microchip." : "Official registration guidelines and compliance rules for canine chip registries and animal transfers.",
                    badge: language === 'it' ? "Documentale" : "Directive",
                    badgeColor: "bg-blue-50 border-blue-200 text-blue-700",
                    query: language === 'it' ? "Entro quanti giorni è obbligatorio mettere il microchip a un cucciolo?" : "Within how many days is a microchip mandatory for a new puppy?"
                  }
                ].map((fonte) => (
                  <button
                    key={fonte.id}
                    onClick={() => {
                      setInput(fonte.query);
                      handleSend(fonte.query);
                    }}
                    className="w-full bg-white hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left transition-all hover:border-emerald-500 group flex flex-col gap-1.5 shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-[12px] sm:text-[13px] group-hover:text-emerald-700 transition-colors">{fonte.title}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded ${fonte.badgeColor}`}>
                        {fonte.badge}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 block -mt-1 leading-none">{fonte.ent}</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-0.5">{fonte.desc}</p>
                    
                    <div className="pt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#15803d] border-t border-slate-100 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-3 w-3" /> {language === 'it' ? 'Fai una domanda su questa fonte' : 'Ask about this source'}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-2 mt-1">
                <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                  {language === 'it' 
                    ? "Tutte le risposte del nostro assistente sono elaborate con accurate citazioni ed estremo rispetto dei testi legislativi vigenti."
                    : "All AI responses are designed around official legislative documents to provide certified, reliable answers."}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
