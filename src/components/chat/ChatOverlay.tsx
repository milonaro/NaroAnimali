import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Info, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  parts: { text: string };
}

export default function ChatOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [cityName, setCityName] = useState("Naro");

  useEffect(() => {
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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', parts: { text: input } };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: 'model', parts: { text: data.text } }]);
    } catch (err: any) {
      console.error(err);
      setMessages([...newMessages, { role: 'model', parts: { text: "Scusa, ho riscontrato un problema tecnico. Per favore riprova tra poco o contatta direttamente gli uffici." } }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-14rem)] bg-white border border-gray-100 rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-[#101b3a] text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <div>
                   <h3 className="text-sm font-bold uppercase tracking-widest">Assistente AnimalHub</h3>
                   <p className="text-[10px] text-white/50 font-medium tracking-tight">AI Istituzionale {siteName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-emerald-50 px-8 py-3 flex items-center gap-2 border-b border-emerald-100">
               <Info className="h-3 w-3 text-[#15803d]" />
               <p className="text-[9px] font-bold text-[#15803d] uppercase tracking-widest">Solo informazioni normative - No urgenze</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
              {messages.length === 0 && (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <MessageSquare className="h-6 w-6 text-gray-300" />
                  </div>
                  <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-tight">Come posso aiutarti oggi?</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Sono l'assistente virtuale del {siteName}. Chiedimi informazioni sulla procedura di segnalazione, sulle normative regionali (L.R. 15/2000), o su come adottare un cane dal nostro rifugio.
                  </p>
                  <div className="flex flex-col gap-2 pt-6">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-left mb-2">Domande frequenti</p>
                     {["Quali sono le sanzioni per l'abbandono?", "Come segnalo un animale ferito?", "Orari ufficio diritti animali"].map((q) => (
                       <button
                         key={q}
                         onClick={() => { setInput(q); }}
                         className="px-4 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 hover:border-[#15803d] hover:text-[#15803d] transition-all text-left flex items-center justify-between group"
                       >
                         {q} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                     ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-lg text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#15803d] text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-[#1e3a5f] shadow-sm rounded-tl-none'
                  }`}>
                    {msg.parts.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-4 rounded-lg rounded-tl-none shadow-sm">
                    <Loader2 className="h-4 w-4 text-[#15803d] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Scrivi qui la tua domanda..."
                  className="w-full bg-gray-50 border border-gray-100 p-4 pr-16 rounded-lg text-sm font-medium outline-none focus:bg-white focus:border-[#15803d] transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-3 bg-[#15803d] text-white rounded-lg hover:bg-[#166534] transition-all disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-6 h-16 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-[#101b3a]' : 'bg-[#101b3a] text-white'
        }`}
      >
        {!isOpen && (
          <span className="text-[10px] font-black uppercase tracking-widest border-r border-white/20 pr-3 mr-1">
            Chiedi aiuto AI
          </span>
        )}
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
