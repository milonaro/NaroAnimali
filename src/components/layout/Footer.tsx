import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Accessibility, Info, Mail, Phone, MapPin, HelpCircle, BarChart3, Globe, Cookie, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AccessibilityToggle from './AccessibilityToggle';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
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
    <footer className="bg-[#101b3a] py-12 md:py-20 mt-auto text-white border-t border-[#101b3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          {/* Column 1: Info and Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6 md:mb-8">
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
            <p className="text-xs md:text-sm font-medium text-[#94a3b8] leading-relaxed mb-6 md:mb-8 whitespace-pre-line">
              {config.footer_text || t('footer.description')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Conforme GDPR</div>
               <div className="px-3 py-1 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Legge n. 281/1991</div>
            </div>
          </div>
          
          {/* Column 2: Link Utili */}
          <div>
            <h4 className="text-[11px] md:text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 md:mb-8">{language === 'it' ? 'Link Utili' : 'Useful Links'}</h4>
            <ul className="space-y-3 md:space-y-4 text-xs md:text-sm font-medium text-[#94a3b8]">
              <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">{language === 'it' ? 'Domande Frequenti (FAQ)' : 'Frequently Asked Questions (FAQ)'}</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Column 3: Servizi & Trasparenza */}
          <div>
            <h4 className="text-[11px] md:text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 md:mb-8">{language === 'it' ? 'Servizi & Trasparenza' : 'Services & Transparency'}</h4>
            <ul className="space-y-3 md:space-y-4 text-xs md:text-sm font-medium text-[#94a3b8]">
              <li><Link to="/statistiche-catasto" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-emerald-400 shrink-0" /> {language === 'it' ? 'Statistiche e catasto' : 'Statistics and Land Registry'}</Link></li>
              <li><Link to="/assistente-ai" className="hover:text-emerald-400 text-emerald-300 transition-colors flex items-center gap-1.5 font-bold"><Sparkles className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" /> {language === 'it' ? "Chiedi all'AI" : 'Ask the AI'}</Link></li>
              <li><Link to="/accessibilita" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><Accessibility className="h-4 w-4 text-emerald-400 shrink-0" /> {language === 'it' ? 'Dichiarazione accessibilità' : 'Accessibility Statement'}</Link></li>
            </ul>
          </div>

          {/* Column 4: Contatti Ente */}
          <div>
            <h4 className="text-[11px] md:text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 md:mb-8">Contatti Ente</h4>
            <ul className="space-y-4 md:space-y-5 text-xs md:text-sm font-medium text-[#94a3b8]">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 md:h-5 w-4 md:w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{config.siteName}, {config.comune_indirizzo}, {config.comune_cap} {config.siteName.replace("Comune di ", "")} ({config.comune_provincia})</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 md:h-5 w-4 md:w-5 text-emerald-400 shrink-0" />
                <span>{config.comune_telefono}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 md:h-5 w-4 md:w-5 text-emerald-400 shrink-0" />
                <span className="break-all">{config.comune_email}</span>
              </li>
              {config.comune_pec && (
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-4 md:h-5 w-4 md:w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none mb-1">PEC (Posta Certificata)</span>
                    <span className="break-all text-xs font-bold text-slate-300">{config.comune_pec}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 md:mt-20 pt-8 md:pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto text-center md:text-left">
            <p className="text-[11px] md:text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} {config.siteName}. {t('footer.rights')}
            </p>
            <AccessibilityToggle />
          </div>
          <div className="flex items-center justify-center w-full md:w-auto gap-6">
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full">
              {/* Bottone Guida / Tutorial */}
              <button 
                onClick={() => {
                  if (location.pathname === '/') {
                    window.dispatchEvent(new Event('start-tutorial'));
                  } else {
                    sessionStorage.setItem('auto_start_tour', 'true');
                    navigate('/');
                  }
                }}
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

              {/* Bottone Accesso Comune (Area Operatori) */}
              <Link 
                to="/operatori"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#15803d]/20 hover:bg-[#15803d]/30 border border-[#15803d]/30 rounded-lg text-xs font-bold text-emerald-300 transition-all cursor-pointer active:scale-95 shadow-sm"
                title={language === 'it' ? "Accesso Riservato Operatori" : "Operator Access Area"}
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'it' ? 'Area Operatori' : 'Operators Area'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
