import { ChevronRight, ShieldCheck, MapPin, Search, PawPrint, HelpCircle, Briefcase, CheckCircle, Info, Clock, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppMap from '@/src/components/map/Map';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#14532d] py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-start max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-8"
            >
              <PawPrint className="h-10 w-10 text-white fill-white/20" />
              <span className="text-white font-bold uppercase tracking-widest text-sm">Comune di Naro</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight"
            >
              Segnala un animale randagio a Naro
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 text-xl mb-12 leading-relaxed"
            >
              Aiutaci a tutelare gli animali del nostro territorio. Con una segnalazione puoi contribuire alla loro sicurezza.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/segnala" className="bg-[#15803d] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#166534] transition-all flex items-center gap-3 shadow-lg shadow-black/20">
                <MapPin className="h-5 w-5" /> Fai una segnalazione
              </Link>
              <Link to="/mia-area" className="bg-white/10 text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-3 border border-white/20 backdrop-blur-sm">
                <Search className="h-5 w-5" /> Monitora la tua segnalazione
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-1/2"></div>
      </section>

      {/* Come Funziona Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#1e3a5f] mb-16">Come funziona</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1. Segnala", icon: <MapPin className="h-8 w-8" />, color: "bg-[#15803d]", desc: "Indica la posizione dell'animale sulla mappa e descrivi le sue condizioni. Bastano pochi minuti." },
              { step: "2. Protocolla", icon: <Briefcase className="h-8 w-8" />, color: "bg-[#1e3a5f]", desc: "Ricevi un codice di tracking. Gli operatori del Comune prendono in carico la tua segnalazione." },
              { step: "3. Risolviamo", icon: <CheckCircle className="h-8 w-8" />, color: "bg-[#15803d]", desc: "Il team comunale interviene e ti aggiorna sullo stato fino alla risoluzione." }
            ].map((item, i) => (
              <div key={i} className="bg-gray-50/50 p-10 rounded-[2rem] border border-gray-100 flex flex-col items-center group hover:shadow-xl transition-all">
                <div className={`${item.color} text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                  {item.step} <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Territorio Map Section */}
      <section className="py-12 bg-gray-50">
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
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full flex gap-6 text-[10px] font-bold uppercase tracking-widest shadow-xl">
               <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Nuova</div>
               <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> In carico</div>
               <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Intervento</div>
               <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Risolta</div>
             </div>
          </div>
        </div>
      </section>

      {/* Numeri Section */}
      <section className="py-24 bg-white">
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

      {/* Motivations Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#1e3a5f] mb-16">Perché usare a4Zampe</h2>
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
