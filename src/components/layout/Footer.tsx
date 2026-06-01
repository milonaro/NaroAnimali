import { Shield, Accessibility, Info, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white py-20 mt-auto text-slate-900 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#101b3a] rounded-xl flex items-center justify-center font-bold italic text-white shadow-lg">NA</div>
              <div className="flex flex-col">
                 <span className="text-2xl font-bold tracking-tight text-[#101b3a] leading-none">NaroAnimali</span>
                 <span className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium">Comune di Naro</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#64748b] max-w-sm leading-relaxed mb-8">
              Piattaforma digitale per la gestione degli animali randagi e la promozione del benessere animale nel territorio del Comune di Naro (AG).
            </p>
            <div className="flex items-center gap-4">
               <div className="px-3 py-1 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest text-gray-400">Conforme GDPR</div>
               <div className="px-3 py-1 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest text-gray-400">WCAG 2.1 AA</div>
               <div className="px-3 py-1 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest text-gray-400">AGID</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-[#101b3a] uppercase tracking-[0.2em] mb-8">Link Utili</h4>
            <ul className="space-y-4 text-sm font-medium text-[#64748b]">
              <li><Link to="/privacy-policy" className="hover:text-[#15803d] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/accessibilita" className="hover:text-[#15803d] transition-colors">Dichiarazione di Accessibilità</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-[#15803d] transition-colors">Cookie Policy</Link></li>
              <li><Link to="/operatori" className="hover:text-[#15803d] transition-colors">Area Operatori</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#101b3a] uppercase tracking-[0.2em] mb-8">Contatti</h4>
            <ul className="space-y-6 text-sm font-medium text-[#64748b]">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#15803d] shrink-0" />
                <span>Comune di Naro, Piazza Garibaldi, 92014 Naro (AG)</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#15803d] shrink-0" />
                <span>0922 941111</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#15803d] shrink-0" />
                <span className="break-all">protocollo@comune.naro.ag.it</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-medium text-gray-400">
            © {new Date().getFullYear()} Comune di Naro. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]/50">Design System Italia</span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">AG</div>
              <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">IT</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
