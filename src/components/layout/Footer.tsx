import { Shield, Accessibility, Info, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#101b3a] py-20 mt-auto text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-bold italic text-white border border-white/10">a4Z</div>
              <div className="flex flex-col">
                 <span className="text-2xl font-bold tracking-tight text-white leading-none">a4Zampe</span>
                 <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Comune di Naro</span>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-400 max-w-sm leading-relaxed mb-8">
              Piattaforma per la gestione degli animali randagi e la tutela del benessere animale nel Comune di Naro (AG).
            </p>
            <div className="flex items-center gap-4 grayscale opacity-50">
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest">Conforme GDPR</div>
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest">WCAG 2.1 AA</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-8">Link Utili</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-400">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/accessibilita" className="hover:text-white transition-colors">Dichiarazione di Accessibilità</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link to="/operatori" className="hover:text-white transition-colors">Area Operatori</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-8">Contatti</h4>
            <ul className="space-y-6 text-sm font-medium text-zinc-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-zinc-500 shrink-0" />
                <span>Comune di Naro, Piazza Garibaldi, 92014 Naro (AG)</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-zinc-500 shrink-0" />
                <span>0922 941111</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-zinc-500 shrink-0" />
                <span className="break-all">protocollo@comune.naro.ag.it</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-medium text-zinc-500">
            © {new Date().getFullYear()} Comune di Naro. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Design System Italia</span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">AG</div>
              <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">IT</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
