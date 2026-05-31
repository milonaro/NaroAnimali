import { Shield, Accessibility, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center font-bold italic text-zinc-400">N</div>
              <span className="text-xl font-black tracking-tighter uppercase text-white">NaroAnimali</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 max-w-sm leading-relaxed">
              Servizio istituzionale del Comune di Naro per la gestione responsabile 
              del randagismo e la tutela del benessere animale.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Partner Istituzionale</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/accessibilita" className="hover:text-white transition-colors">Accessibilità</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Contatti Rapidi</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              <li className="text-zinc-400">Emergenze: 112</li>
              <li>Municipale: 0922 956001</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-700 font-black">
            ©{new Date().getFullYear()} Naro Digital Archive
          </p>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded border border-zinc-900 flex items-center justify-center text-[8px] font-black text-zinc-800">AG</div>
            <div className="w-8 h-8 rounded border border-zinc-900 flex items-center justify-center text-[8px] font-black text-zinc-800">IT</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
