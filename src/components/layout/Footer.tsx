import { useState, useEffect } from 'react';
import { Shield, Accessibility, Info, Mail, Phone, MapPin, HelpCircle, BarChart3, Globe, Cookie, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import AccessibilityToggle from './AccessibilityToggle';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { language, t } = useLanguage();
  const [config, setConfig] = useState<any>({
    siteName: "Comune di Naro",
    comune_indirizzo: "Piazza Giuseppe Garibaldi, 1",
    comune_cap: "92028",
    comune_provincia: "AG",
    comune_email: "protocollo@comune.naro.ag.it",
    comune_telefono: "0922 941111",
    comune_pec: "protocollo@pec.comune.naro.ag.it"
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const data = await res.json();
          setConfig((prev: any) => ({
            ...prev,
            ...data
          }));
        }
      } catch (e) {}
    };
    fetchConfig();
  }, []);

  return (
    <footer className="bg-[#101b3a] py-20 mt-auto text-white border-t border-[#101b3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold italic text-[#101b3a] shadow-lg overflow-hidden">
                {config.animalhub_logo ? (
                  <img src={config.animalhub_logo} alt="AnimalHub Logo" className="w-full h-full object-contain p-1.5" />
                ) : (
                  "AH"
                )}
              </div>
              <div className="flex flex-col">
                 <span className="text-2xl font-bold tracking-tight text-white leading-none">AnimalHub PA</span>
                 <span className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-medium">DEMO {config.siteName}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#94a3b8] max-w-sm leading-relaxed mb-8 whitespace-pre-line">
              {config.footer_text || t('footer.description')}
            </p>
            <div className="flex items-center gap-4">
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Conforme GDPR</div>
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Legge n. 281/1991</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-8">{t('footer.links_useful')}</h4>
            <ul className="space-y-4 text-sm font-medium text-[#94a3b8]">
              <li><Link to="/faq" className="hover:text-emerald-400 text-white transition-colors font-bold font-sans">Domande Frequenti (FAQ)</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/statistiche-catasto" className="hover:text-emerald-400 transition-colors text-emerald-300 flex items-center gap-1.5 font-semibold"><BarChart3 className="h-4 w-4 text-emerald-400 shrink-0" /> {t('footer.stat_module')}</Link></li>
              <li><Link to="/assistente-ai" className="hover:text-emerald-400 text-emerald-300 transition-colors font-bold font-sans flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" /> Chiedi all'AI (Assistente)</Link></li>
              <li className="pt-2">
                <Link to="/operatori" className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                  {language === 'it' ? 'Area Operatori (Accesso Comune)' : 'Operator Area (Municipal Access)'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-8">Contatti Ente</h4>
            <ul className="space-y-6 text-sm font-medium text-[#94a3b8]">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>{config.siteName}, {config.comune_indirizzo}, {config.comune_cap} {config.siteName.replace("Comune di ", "")} ({config.comune_provincia})</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>{config.comune_telefono}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="block break-all">{config.comune_email}</span>
                  {config.comune_pec && (
                    <span className="block text-[11px] text-slate-400 mt-1 uppercase font-semibold">PEC: {config.comune_pec}</span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} {config.siteName}. {t('footer.rights')}
            </p>
            <span className="hidden md:inline text-white/20">|</span>
            <Link 
              to="/accessibilita" 
              className="text-xs font-bold text-slate-350 hover:text-emerald-400 hover:underline transition-all underline-offset-4"
              aria-label="Leggi la dichiarazione di accessibilità"
            >
              Dichiarazione di accessibilità
            </Link>
            <AccessibilityToggle />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Bottone Guida / Tutorial */}
              <button 
                onClick={() => window.dispatchEvent(new Event('start-tutorial'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all cursor-pointer active:scale-95"
                title={language === 'it' ? "Avvia Guida Interattiva" : "Start Interactive Guide"}
              >
                <HelpCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'it' ? 'Guida' : 'Guide'}</span>
              </button>

              {/* Bottone Preferenze Cookie */}
              <button 
                onClick={() => window.dispatchEvent(new Event('open-cookie-preferences'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all cursor-pointer active:scale-95"
                title={language === 'it' ? "Impostazioni Privacy & Cookie" : "Privacy & Cookie Settings"}
              >
                <Cookie className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Cookie</span>
              </button>

              {/* Bottone Menu Accessibilità */}
              <button 
                onClick={() => window.dispatchEvent(new Event('open-accessibility-menu'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all cursor-pointer active:scale-95"
                title={language === 'it' ? "Apri Opzioni Accessibilità" : "Open Accessibility Options"}
              >
                <Accessibility className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'it' ? 'Accessibilità' : 'Accessibility'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
