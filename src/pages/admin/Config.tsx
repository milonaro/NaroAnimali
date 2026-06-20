import { useState, useEffect, useMemo } from 'react';
import { Building, MapPin, CheckCircle2, ShieldCheck, Lock, Unlock, Mail, Phone, HelpCircle, FileText, Globe, RefreshCw } from 'lucide-react';
import { COMUNI } from '@/src/lib/geofence';
import { showPopup, popup } from '../../lib/popup';

export default function Config() {
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Comune di Naro");
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // New CMS States for customized logos & compliance
  const [animalhubLogo, setAnimalhubLogo] = useState<string>("");
  const [privacyText, setPrivacyText] = useState<string>("");
  const [cookieText, setCookieText] = useState<string>("");
  const [footerText, setFooterText] = useState<string>("");

  // Superadmin States
  const [superPasswordInput, setSuperPasswordInput] = useState("");
  const [isSuperUnlocked, setIsSuperUnlocked] = useState(false);
  const [superError, setSuperError] = useState<string | null>(null);

  // Dynamic Contact Fields
  const [comuneIndirizzo, setComuneIndirizzo] = useState("Piazza Giuseppe Garibaldi, 1");
  const [comuneCap, setComuneCap] = useState("92028");
  const [comuneProvincia, setComuneProvincia] = useState("AG");
  const [comuneEmail, setComuneEmail] = useState("protocollo@comune.naro.ag.it");
  const [comuneTelefono, setComuneTelefono] = useState("0922 941111");
  const [comunePec, setComunePec] = useState("protocollo@pec.comune.naro.ag.it");
  
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [activeComune, setActiveComune] = useState(() => (localStorage.getItem('active_comune') || 'naro').toLowerCase());

  const selectedComuneInfo = useMemo(() => {
    return COMUNI[activeComune] || COMUNI.naro;
  }, [activeComune]);

  const handleUnlockSuperadmin = (e: React.FormEvent) => {
    e.preventDefault();
    setSuperError(null);
    if (superPasswordInput === "superadmin2026") {
      setIsSuperUnlocked(true);
      setSuperError(null);
    } else {
      setSuperError("Password Superadmin errata. Riprova.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { 
        siteName, 
        siteLogo, 
        activeComune,
        comune_indirizzo: comuneIndirizzo,
        comune_cap: comuneCap,
        comune_provincia: comuneProvincia,
        comune_email: comuneEmail,
        comune_telefono: comuneTelefono,
        comune_pec: comunePec,
        animalhub_logo: animalhubLogo,
        privacy_text: privacyText,
        cookie_text: cookieText,
        footer_text: footerText,
      };

      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        localStorage.setItem('active_comune', activeComune.toLowerCase());
        showPopup({
          type: 'success',
          title: "Configurazione Salvata",
          message: "Le impostazioni del portale e dei testi delle conformità del CMS sono state memorizzate con successo nel database ed applicate in tempo reale.",
          confirmLabel: "Ok, ricarica",
          onConfirm: () => {
            window.location.reload();
          }
        });
      } else {
        const errData = await res.json();
        showPopup({
          type: 'error',
          title: "Salvataggio Fallito",
          message: errData.error || "Si è verificato un errore durante l'aggiornamento.",
          confirmLabel: "Ok"
        });
      }
    } catch(err) {
      showPopup({
        type: 'error',
        title: "Errore di Rete",
        message: "Impossibile stabilire una connessione stabile con il server di configurazione.",
        confirmLabel: "Ok"
      });
    }
  };



  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setRole(data.user.role);
          }
        }
      } catch (e) {
        console.error("Error loading profile", e);
      } finally {
        setCheckingRole(false);
      }
    };
    fetchMe();

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) setSiteName(config.siteName);
          if (config.siteLogo) setSiteLogo(config.siteLogo);
          if (config.comune_indirizzo) setComuneIndirizzo(config.comune_indirizzo);
          if (config.comune_cap) setComuneCap(config.comune_cap);
          if (config.comune_provincia) setComuneProvincia(config.comune_provincia);
          if (config.comune_email) setComuneEmail(config.comune_email);
          if (config.comune_telefono) setComuneTelefono(config.comune_telefono);
          if (config.comune_pec) setComunePec(config.comune_pec);
          if (config.animalhub_logo) setAnimalhubLogo(config.animalhub_logo);
          if (config.privacy_text) setPrivacyText(config.privacy_text);
          if (config.cookie_text) setCookieText(config.cookie_text);
          if (config.footer_text) setFooterText(config.footer_text);
          if (config.activeComune) {
            const lowKey = config.activeComune.toLowerCase();
            setActiveComune(lowKey);
            localStorage.setItem('active_comune', lowKey);
          }
        }
      } catch(e) {}
    };
    fetchConfig();
  }, []);

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#15803d]"></div>
      </div>
    );
  }

  if (role?.toUpperCase() !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-wider">Accesso Negato</h1>
          <p className="text-slate-500 text-sm">Non disponi dei privilegi amministrativi ("Admin") necessari per visualizzare o modificare la configurazione di AnimalHub PA.</p>
          <a href="/operatori font-black" className="inline-block bg-[#15803d] hover:bg-[#166534] text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all">
            Torna al Portale Operativo
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        
        {/* Card 1: Standard Config Settings */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#15803d]" />
          <h2 className="text-2xl font-black text-[#1e3a5f] mb-6 flex items-center gap-3">
            <Building className="h-6 w-6 text-[#15803d]" /> 
            Configurazione Ente Semplificata
          </h2>
          
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">Informazioni Generali</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nome Comune Attivo</label>
                <input 
                  type="text" 
                  disabled
                  value={siteName}
                  className="w-full p-3 border border-slate-200 bg-slate-50 rounded text-sm text-slate-400 font-semibold cursor-not-allowed outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">Sblocca il pannello di controllo Superadmin per personalizzare questo nome.</span>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Seleziona Comune Associato</label>
                <select 
                  value={activeComune}
                  onChange={(e) => {
                    const selectedVal = e.target.value.toLowerCase();
                    setActiveComune(selectedVal);
                    const properName = COMUNI[selectedVal]?.name || selectedVal;
                    setSiteName(`Comune di ${properName}`);
                  }}
                  className="w-full p-3 border border-slate-200 rounded text-sm text-[#1e3a5f] font-bold outline-none focus:border-[#15803d] bg-white cursor-pointer"
                >
                  {Object.keys(COMUNI).map((key) => (
                    <option key={key} value={key}>
                      {COMUNI[key].name} (Cod. {COMUNI[key].codiceCatastale})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Anteprima Real-Time Dati Catastali Hub Selezione */}
            <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60 relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Dati Istituzionali Attivi
              </div>
              <h4 className="text-xs font-black uppercase text-[#1e3a5f] tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#15803d]" />
                Scheda Catastale di Riferimento: {selectedComuneInfo?.name}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Codice Catastale</span>
                  <span className="text-sm font-black text-slate-800">{selectedComuneInfo?.codiceCatastale || 'Non disponibile'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Superficie Territorio</span>
                  <span className="text-sm font-black text-slate-800">{selectedComuneInfo?.superficieTotaleKm2 ? `${selectedComuneInfo.superficieTotaleKm2} km²` : 'N.D.'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Identificativi Hub</span>
                  <span className="text-sm font-black text-slate-800">
                    {selectedComuneInfo?.foglioCatastaleHub ? `F. ${selectedComuneInfo.foglioCatastaleHub}, P. ${selectedComuneInfo.particellaCatastaleHub}` : 'Non Definiti'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Estensione Hub</span>
                  <span className="text-sm font-black text-slate-800">{selectedComuneInfo?.estensioneEttariHub ? `${selectedComuneInfo.estensioneEttariHub} ha` : 'N.D.'}</span>
                </div>
              </div>

              {selectedComuneInfo?.datiCatastaliCompleti && (
                <div className="mt-4 pt-4 border-t border-slate-200/60 text-xs font-medium text-slate-600 leading-relaxed">
                  {selectedComuneInfo.datiCatastaliCompleti}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Password Lock check or Unlock Module */}
        {!isSuperUnlocked ? (
          <div className="bg-slate-900 text-white p-8 rounded-xl border border-slate-800 shadow-xl text-left relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Lock className="h-44 w-44 text-white" />
            </div>
            <h3 className="text-base font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2 font-mono">
              <Lock className="h-5 w-5 text-emerald-400 shrink-0" /> SEZIONE SUPERADMIN (SUPER-CMS)
            </h3>
            <p className="text-xs text-slate-300 mb-6 font-medium leading-relaxed max-w-2xl">
              La personalizzazione avanzata dei dati legali ed istituzionali dell'ente (Nome Ente, email cicvica, PEC di protocollo, recapiti stradari completi, CAP, provincia e caricamento dello stemma del Comune) è limitata ai Super Amministratori. Inserisci la password Superadmin per visualizzare i comandi CMS.
            </p>

            <form onSubmit={handleUnlockSuperadmin} className="flex flex-col sm:flex-row gap-3 items-end relative z-10">
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-1.5 font-mono">CHIAVE SUPERADMIN DI SICUREZZA</label>
                <input 
                  type="password"
                  placeholder="Inserisci password superadmin..."
                  value={superPasswordInput}
                  onChange={(e) => setSuperPasswordInput(e.target.value)}
                  className="w-full p-3.5 border border-slate-700 bg-slate-800 text-white rounded-xl text-sm font-bold placeholder:text-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer font-sans shrink-0 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                Sblocca Strumenti CMS
              </button>
            </form>
            {superError && (
              <p className="text-xs text-rose-500 font-bold mt-3 font-mono">ERRORE: {superError} (Suggerimento: la password è "superadmin2026")</p>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border-2 border-emerald-500 shadow-sm text-left relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1.5 rounded-bl-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Unlock className="h-3.5 w-3.5" /> super-cms unlocked
            </div>
            
            <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-wider mb-6 flex items-center gap-2">
              <Building className="h-6 w-6 text-emerald-600" />
              Pannello di Personalizzazione Super-CMS
            </h3>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Completando questo modulo andrai a sovraccaricare il brand del Comune. Le modifiche avranno impatto immediato sull'header, sul piè di pagina (footer) e sull'interfaccia interattiva del portale dei cittadini di AnimalHub PA.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Nome Ente Personalizzato</label>
                  <input 
                    type="text" 
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">URL Emblem / Stemma Comune (PNG o SVG)</label>
                  <input 
                    type="url" 
                    required
                    value={siteLogo}
                    placeholder="https://upload.wikimedia.org/.../Stemma_naro.png"
                    onChange={(e) => setSiteLogo(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Indirizzo Sede Legale (Es. Piazza Giuseppe Garibaldi, 1)</label>
                  <input 
                    type="text" 
                    required
                    value={comuneIndirizzo}
                    onChange={(e) => setComuneIndirizzo(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">CAP</label>
                      <input 
                        type="text" 
                        required
                        value={comuneCap}
                        onChange={(e) => setComuneCap(e.target.value)}
                        className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Provincia</label>
                      <input 
                        type="text" 
                        required
                        maxLength={2}
                        value={comuneProvincia}
                        onChange={(e) => setComuneProvincia(e.target.value.toUpperCase())}
                        className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Centralino / Telefono</label>
                  <input 
                    type="text" 
                    required
                    value={comuneTelefono}
                    onChange={(e) => setComuneTelefono(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Email Civica</label>
                  <input 
                    type="email" 
                    required
                    value={comuneEmail}
                    onChange={(e) => setComuneEmail(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">PEC Protocollo</label>
                  <input 
                    type="email" 
                    required
                    value={comunePec}
                    onChange={(e) => setComunePec(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* BRANDING PERSONALIZZATO & TESTI FOOTER (CMS) */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
                <h3 className="text-sm font-bold uppercase text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  Personalizzazione Brand AnimalHub
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">URL Logo Proprietario AnimalHub (PNG o SVG)</label>
                    <input 
                      type="url" 
                      value={animalhubLogo}
                      placeholder="https://upload.wikimedia.org/.../AnimalHub_logo.png"
                      onChange={(e) => setAnimalhubLogo(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Lascia vuoto per utilizzare l'icona e stemma predefiniti.</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Descrizione Footer (Sotto il logo di sinistra)</label>
                    <textarea 
                      rows={2}
                      value={footerText}
                      placeholder="Inserisci la descrizione o disclaimer da mostrare nel footer..."
                      onChange={(e) => setFooterText(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* TESTI LEGALI E INFORMATIVE (SUPER-CMS) */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
                <h3 className="text-sm font-bold uppercase text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Testi Informativi Privacy & Cookie (CMS)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Testo Informativa Privacy (Supporta caratteri multiline)</label>
                    <textarea 
                      rows={6}
                      value={privacyText}
                      placeholder="Scrivi qui il testo personalizzato per la pagina Privacy Policy..."
                      onChange={(e) => setPrivacyText(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-emerald-500 font-sans"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Se vuoto, il sistema caricherà il testo standard conforme al GDPR.</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Testo Informativa Cookie (Supporta caratteri multiline)</label>
                    <textarea 
                      rows={6}
                      value={cookieText}
                      placeholder="Scrivi qui il testo personalizzato per la pagina Cookie Policy..."
                      onChange={(e) => setCookieText(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-emerald-500 font-sans"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Se vuoto, il sistema caricherà la descrizione tecnica predefinita.</span>
                  </div>
                </div>
              </div>

              {/* Logo Preview block */}
              {siteLogo && (
                <div className="p-4 border border-dashed border-emerald-300 bg-emerald-50/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={siteLogo} alt="Preview Stemma" className="h-12 w-auto object-contain mix-blend-multiply" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Anteprima Stemma Co-Branding</p>
                      <p className="text-[10px] text-slate-500">Stemma istituzionale in scala caricato con successo.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsSuperUnlocked(false)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100/65 px-4 py-2.5 rounded-xl transition-all"
                >
                  Richiudi Area CMS
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/10 transition-all uppercase text-xs tracking-wider cursor-pointer"
                >
                  Applica Modifiche CMS
                </button>
              </div>
            </form>
          </div>
        )}



      </div>
    </div>
  );
}
