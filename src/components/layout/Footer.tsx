import { Shield, Accessibility, Info, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AccessibilityToggle from './AccessibilityToggle';

export default function Footer() {
  return (
    <footer className="bg-[#101b3a] py-20 mt-auto text-white border-t border-[#101b3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold italic text-[#101b3a] shadow-lg">AH</div>
              <div className="flex flex-col">
                 <span className="text-2xl font-bold tracking-tight text-white leading-none">AnimalHub PA</span>
                 <span className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-medium">Comune di Naro</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#94a3b8] max-w-sm leading-relaxed mb-8">
              Piattaforma digitale per la gestione degli animali randagi e la promozione del benessere animale nel territorio del Comune di Naro (AG).
            </p>
            <div className="flex items-center gap-4">
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Conforme GDPR</div>
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">WCAG 2.1 AA</div>
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">AGID</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-8">Link Utili</h4>
            <ul className="space-y-4 text-sm font-medium text-[#94a3b8]">
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/accessibilita" className="hover:text-emerald-400 transition-colors">Dichiarazione di Accessibilità</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
              <li className="pt-2">
                <Link to="/operatori" className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                  Area Operatori (Accesso Comune)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-8">Contatti</h4>
            <ul className="space-y-6 text-sm font-medium text-[#94a3b8]">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Comune di Naro, Piazza Garibaldi, 92014 Naro (AG)</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>0922 941111</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="break-all">protocollo@comune.naro.ag.it</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} Comune di Naro. Tutti i diritti riservati.
            </p>
            <AccessibilityToggle />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300">AG</div>
              <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300">IT</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
