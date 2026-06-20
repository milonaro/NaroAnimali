import { useState, useEffect, useMemo } from 'react';
import { Building, MapPin, CheckCircle2, ShieldCheck, Lock, Unlock, Mail, Phone, HelpCircle, FileText, Globe, RefreshCw, Plus, Trash2, Copy, Edit3, Layers, Eye, X, Sliders } from 'lucide-react';
import { COMUNI } from '@/src/lib/geofence';
import { showPopup, popup } from '../../lib/popup';
import AdvancedPolicyEditor from '../../components/admin/AdvancedPolicyEditor';
import { DEFAULT_PRIVACY_TEXT, DEFAULT_COOKIE_TEXT } from '../../lib/defaultTexts';

const DEFAULT_SLIDERS = [
  {
    id: 1,
    badge_it: "TUTELA & BENESSERE ANIMALE",
    badge_en: "ANIMAL WELFARE & CARE",
    title_it: "Proteggi e segnala il randagismo",
    title_en: "Protect and report stray animals",
    desc_it: "Attraverso la piattaforma ufficiale del Comune puoi avviare segnalazioni, geolocalizzare animali e monitorare lo stato di salute dei randagi.",
    desc_en: "Through the official municipal platform, you can initiate reports, geolocate animals, and monitor the health of stray animals.",
    icon: "PawPrint",
    color_theme: "emerald",
    tab_title_it: "Tutela & Soccorso",
    tab_title_en: "Care & Assistance",
    tab_step_it: "Modulo A",
    tab_step_en: "Module A",
    tab_desc_it: "Gestione randagismo, soccorso ordinario/urgente ed affidamenti digitali.",
    tab_desc_en: "Stray animal management, urgent/ordinary rescue, and digital custody tracking.",
    btn1_label_it: "Segnala Animale",
    btn1_label_en: "Report Animal",
    btn1_link: "/segnala",
    btn1_style: "primary",
    btn2_label_it: "Verifica Segnalazione",
    btn2_label_en: "Check Status",
    btn2_link: "/mia-area",
    btn2_style: "secondary",
    image_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2000"
  },
  {
    id: 2,
    badge_it: "Polizia e Controllo Sanitario",
    badge_en: "Police & Health Control",
    title_it: "Salvaguardia della biodiversità urbana",
    title_en: "Safeguard of urban biodiversity",
    desc_it: "Strumenti innovativi integrati negli uffici comunali per la convivenza serena e coordinata tra cittadini, fauna locale e territori rurali.",
    desc_en: "Innovative tools integrated into municipal safety offices for serene and coordinated coexistence between citizens, local fauna, and rural fields.",
    icon: "ShieldCheck",
    color_theme: "amber",
    tab_title_it: "Sicurezza Urbana",
    tab_title_en: "Urban Security",
    tab_step_it: "Modulo B",
    tab_step_en: "Module B",
    tab_desc_it: "Monitoraggio biodiversità, presidi di controllo fitti e pianificazioni.",
    tab_desc_en: "Urban biodiversity monitoring, dense checkpoints, and tactical safety planning.",
    btn1_label_it: "Segnala Animale",
    btn1_label_en: "Report Animal",
    btn1_link: "/segnala",
    btn1_style: "primary",
    btn2_label_it: "Verifica Segnalazione",
    btn2_label_en: "Check Status",
    btn2_link: "/mia-area",
    btn2_style: "secondary",
    image_url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=2000"
  }
];

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

  // Home Sliders Dynamic Management
  const [sliders, setSliders] = useState<any[]>([]);
  const [editingSliderId, setEditingSliderId] = useState<number | 'new' | null>(null);
  const [sliderForm, setSliderForm] = useState({
    id: 0,
    badge_it: "",
    badge_en: "",
    title_it: "",
    title_en: "",
    desc_it: "",
    desc_en: "",
    icon: "PawPrint",
    color_theme: "emerald",
    tab_title_it: "",
    tab_title_en: "",
    tab_step_it: "Modulo C",
    tab_step_en: "Module C",
    tab_desc_it: "",
    tab_desc_en: "",
    btn1_label_it: "Segnala Animale",
    btn1_label_en: "Report Animal",
    btn1_link: "/segnala",
    btn1_style: "primary",
    btn2_label_it: "Verifica",
    btn2_label_en: "Verify",
    btn2_link: "/mia-area",
    btn2_style: "secondary",
    image_url: ""
  });

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

  // New CMS States for emergency/urgent contacts in Mappa.tsx
  const [emergencyVeterinario, setEmergencyVeterinario] = useState("0922 941122");
  const [emergencyPolizia, setEmergencyPolizia] = useState("0922 941111");
  const [emergencyVolontari, setEmergencyVolontari] = useState("0922 956100");
  
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
        emergency_veterinario: emergencyVeterinario,
        emergency_polizia: emergencyPolizia,
        emergency_volontari: emergencyVolontari,
        home_sliders: JSON.stringify(sliders),
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
          if (config.emergency_veterinario) setEmergencyVeterinario(config.emergency_veterinario);
          if (config.emergency_polizia) setEmergencyPolizia(config.emergency_polizia);
          if (config.emergency_volontari) setEmergencyVolontari(config.emergency_volontari);
          if (config.home_sliders) {
            try {
              const parsed = JSON.parse(config.home_sliders);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSliders(parsed);
              } else {
                setSliders([...DEFAULT_SLIDERS]);
              }
            } catch (e) {
              setSliders([...DEFAULT_SLIDERS]);
            }
          } else {
            setSliders([...DEFAULT_SLIDERS]);
          }
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

              {/* NUMERI DI PRONTO INTERVENTO (CMS) */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
                <h3 className="text-sm font-bold uppercase text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
                  <Phone className="h-4 w-4 text-emerald-600 font-sans" />
                  Numeri Telefonici Pronto Intervento (Mappa del Territorio)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Veterinario Convenzionato</label>
                    <input 
                      type="text" 
                      required
                      value={emergencyVeterinario}
                      placeholder="0922 941122"
                      onChange={(e) => setEmergencyVeterinario(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Polizia Municipale</label>
                    <input 
                      type="text" 
                      required
                      value={emergencyPolizia}
                      placeholder="0922 941111"
                      onChange={(e) => setEmergencyPolizia(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Volontari ed Associazioni</label>
                    <input 
                      type="text" 
                      required
                      value={emergencyVolontari}
                      placeholder="0922 956100"
                      onChange={(e) => setEmergencyVolontari(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-[#1e3a5f] bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
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

              {/* GESTIONE SLIDER IN EVIDENZA SULLA HOME */}
              <div className="space-y-6 pt-6 border-t border-slate-100 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold uppercase text-[#101b3a] flex items-center gap-1.5 tracking-tight font-sans">
                    <Sliders className="h-4 w-4 text-emerald-600" />
                    Gestione Slider in Evidenza sulla Home Page ({sliders.length})
                  </h3>
                  {editingSliderId === null && (
                    <button
                      type="button"
                      onClick={() => {
                        const newId = sliders.length > 0 ? Math.max(...sliders.map(s => s.id || 0)) + 1 : 1;
                        setSliderForm({
                          id: newId,
                          badge_it: "NUOVO MODULO",
                          badge_en: "NEW MODULE",
                          title_it: "Nuovo servizio per i cittadini",
                          title_en: "New citizen service available",
                          desc_it: "Attraverso questa sezione puoi descrivere le nuove funzionalità e i link rapidi del portale della pubblica amministrazione.",
                          desc_en: "Use this section to describe the new features and quick links of the municipal portal.",
                          icon: "PawPrint",
                          color_theme: "sky",
                          tab_title_it: "Nuovo Servizio",
                          tab_title_en: "New Service",
                          tab_step_it: "Modulo C",
                          tab_step_en: "Module C",
                          tab_desc_it: "Compila i moduli dedicati comodamente da casa e segui l'avanzamento online.",
                          tab_desc_en: "Fill out the forms online and monitor real-time approval stages.",
                          btn1_label_it: "Apri Modulo",
                          btn1_label_en: "Open Form",
                          btn1_link: "/segnala",
                          btn1_style: "primary",
                          btn2_label_it: "Guida d'Uso",
                          btn2_label_en: "User Guide",
                          btn2_link: "/guida",
                          btn2_style: "secondary",
                          image_url: "https://images.unsplash.com/photo-1541599540903-216a46ca1dd0?auto=format&fit=crop&q=80&w=2000"
                        });
                        setEditingSliderId('new');
                      }}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                    >
                      <Plus className="h-4 w-4" /> Aggiungi Slider
                    </button>
                  )}
                </div>

                {/* MODULO DI MODIFICA / CREAZIONE SLIDER INLINE */}
                {editingSliderId !== null && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider flex items-center gap-2 font-sans">
                        <Edit3 className="h-4 w-4 text-emerald-600" />
                        {editingSliderId === 'new' ? 'Aggiungi Nuovo Slider' : `Modifica Slider ID #${editingSliderId}`}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingSliderId(null)}
                        className="text-slate-450 hover:text-slate-600 p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ITALIANO */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/85 space-y-4">
                        <span className="text-[9px] font-black tracking-widest text-[#15803d] uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 block w-max font-mono">DATI IN ITALIANO</span>
                        
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Badge Superiore (Es: TUTELA & BENESSERE)</label>
                          <input
                            type="text"
                            required
                            value={sliderForm.badge_it}
                            onChange={(e) => setSliderForm({ ...sliderForm, badge_it: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Titolo Principale Slider</label>
                          <input
                            type="text"
                            required
                            value={sliderForm.title_it}
                            onChange={(e) => setSliderForm({ ...sliderForm, title_it: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Descrizione Slider / Sottotitolo</label>
                          <textarea
                            rows={3}
                            required
                            value={sliderForm.desc_it}
                            onChange={(e) => setSliderForm({ ...sliderForm, desc_it: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 font-sans"
                          />
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">CONFIGURAZIONE TAB LATERALE (IT)</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 font-sans font-sans">Etichetta Step (Es: Modulo A)</label>
                              <input
                                type="text"
                                required
                                value={sliderForm.tab_step_it}
                                onChange={(e) => setSliderForm({ ...sliderForm, tab_step_it: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 font-sans">Titolo Breve Tab (Es: Tutela)</label>
                              <input
                                type="text"
                                required
                                value={sliderForm.tab_title_it}
                                onChange={(e) => setSliderForm({ ...sliderForm, tab_title_it: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 font-sans">Sintesi Informativa Tab</label>
                            <input
                              type="text"
                              required
                              value={sliderForm.tab_desc_it}
                              onChange={(e) => setSliderForm({ ...sliderForm, tab_desc_it: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Testo Bottone 1</label>
                            <input
                              type="text"
                              required
                              value={sliderForm.btn1_label_it}
                              onChange={(e) => setSliderForm({ ...sliderForm, btn1_label_it: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Testo Bottone 2</label>
                            <input
                              type="text"
                              required
                              value={sliderForm.btn2_label_it}
                              onChange={(e) => setSliderForm({ ...sliderForm, btn2_label_it: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      {/* INGLESE */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/85 space-y-4">
                        <span className="text-[9px] font-black tracking-widest text-[#9a3412] uppercase bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 block w-max font-mono">DATI IN INGLESE</span>
                        
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Badge Superiore EN</label>
                          <input
                            type="text"
                            required
                            value={sliderForm.badge_en}
                            onChange={(e) => setSliderForm({ ...sliderForm, badge_en: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Titolo Principale Slider EN</label>
                          <input
                            type="text"
                            required
                            value={sliderForm.title_en}
                            onChange={(e) => setSliderForm({ ...sliderForm, title_en: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Descrizione Slider / Sottotitolo EN</label>
                          <textarea
                            rows={3}
                            required
                            value={sliderForm.desc_en}
                            onChange={(e) => setSliderForm({ ...sliderForm, desc_en: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 font-sans"
                          />
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block font-mono">CONFIGURAZIONE TAB LATERALE (EN)</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 font-sans">Etichetta Step EN (Es: Module A)</label>
                              <input
                                type="text"
                                required
                                value={sliderForm.tab_step_en}
                                onChange={(e) => setSliderForm({ ...sliderForm, tab_step_en: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 font-sans font-sans">Titolo Breve Tab EN (Es: Assistance)</label>
                              <input
                                type="text"
                                required
                                value={sliderForm.tab_title_en}
                                onChange={(e) => setSliderForm({ ...sliderForm, tab_title_en: e.target.value })}
                                className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 font-sans">Sintesi Informativa Tab EN</label>
                            <input
                              type="text"
                              required
                              value={sliderForm.tab_desc_en}
                              onChange={(e) => setSliderForm({ ...sliderForm, tab_desc_en: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Testo Bottone 1 EN</label>
                            <input
                              type="text"
                              required
                              value={sliderForm.btn1_label_en}
                              onChange={(e) => setSliderForm({ ...sliderForm, btn1_label_en: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Testo Bottone 2 EN</label>
                            <input
                              type="text"
                              required
                              value={sliderForm.btn2_label_en}
                              onChange={(e) => setSliderForm({ ...sliderForm, btn2_label_en: e.target.value })}
                              className="w-full p-2 border border-slate-200 rounded text-xs font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CONFIGURAZIONI COMUNI (ICONE, TEMI, LINK, IMMAGINE) */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-left">
                      <span className="text-[9px] font-black tracking-widest text-[#1e3a5f] uppercase bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 block w-max font-mono">CONFIGURAZIONI DI SISTEMA E LAYOUT</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Tema Cromatico (Color Theme)</label>
                          <select
                            value={sliderForm.color_theme}
                            onChange={(e) => setSliderForm({ ...sliderForm, color_theme: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white font-sans"
                          >
                            <option value="emerald">Emerald (Verde)</option>
                            <option value="amber">Amber (Arancione)</option>
                            <option value="sky">Sky (Azzurro)</option>
                            <option value="purple">Purple (Viola)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Icona Lucide Decorativa</label>
                          <select
                            value={sliderForm.icon}
                            onChange={(e) => setSliderForm({ ...sliderForm, icon: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white font-sans"
                          >
                            <option value="PawPrint">Zampa (PawPrint)</option>
                            <option value="ShieldCheck">Scudo Spuntato (ShieldCheck)</option>
                            <option value="AlertTriangle">Triangolo Allerta (AlertTriangle)</option>
                            <option value="Heart">Cuore (Heart)</option>
                            <option value="Info">Info (Info)</option>
                            <option value="HelpCircle">Punto Interrogativo (HelpCircle)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">URL Immagine di Copertina</label>
                          <input
                            type="url"
                            required
                            placeholder="https://images.unsplash.com/..."
                            value={sliderForm.image_url}
                            onChange={(e) => setSliderForm({ ...sliderForm, image_url: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Link di Destinazione Bottone 1</label>
                          <input
                            type="text"
                            required
                            value={sliderForm.btn1_link}
                            onChange={(e) => setSliderForm({ ...sliderForm, btn1_link: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1 font-sans">Link di Destinazione Bottone 2</label>
                          <input
                            type="text"
                            required
                            value={sliderForm.btn2_link}
                            onChange={(e) => setSliderForm({ ...sliderForm, btn2_link: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingSliderId(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs uppercase cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!sliderForm.badge_it || !sliderForm.title_it || !sliderForm.desc_it || !sliderForm.image_url) {
                              showPopup({
                                type: 'error',
                                title: "Campi Mancanti",
                                message: "Assicurati di inserire badge, titolo, descrizione e immagine copertina prima di confermare.",
                                confirmLabel: "Ok"
                              });
                              return;
                            }
                            if (editingSliderId === 'new') {
                              setSliders([...sliders, sliderForm]);
                            } else {
                              setSliders(sliders.map(s => s.id === editingSliderId ? sliderForm : s));
                            }
                            setEditingSliderId(null);
                          }}
                          className="bg-[#15803d] hover:bg-[#166534] text-white font-bold px-5 py-2 rounded-lg text-xs uppercase cursor-pointer"
                        >
                          Conferma Modifiche Slider
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* LISTA SLIDER ATTIVI */}
                {editingSliderId === null && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sliders.map((slider) => {
                      return (
                        <div key={slider.id} className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                          {/* Banner immagine copertina */}
                          <div className="h-32 w-full bg-slate-100 relative">
                            {slider.image_url ? (
                              <img src={slider.image_url} alt={slider.title_it} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                Nessuna immagine
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-white px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase font-mono">
                              ID: #{slider.id}
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-black uppercase text-[#15803d] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                              {slider.color_theme || 'emerald'}
                            </div>
                          </div>

                          {/* Dettagli slider */}
                          <div className="p-4 flex-1 text-left space-y-2">
                            <div>
                              <span className="text-[9px] font-black uppercase text-[#15853d] tracking-wide block font-sans">{slider.badge_it}</span>
                              <h4 className="text-sm font-extrabold text-[#1e3a5f] leading-snug line-clamp-1 mt-0.5 font-sans">{slider.title_it}</h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-sans">{slider.desc_it}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px]">
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase block font-sans">Step Tab</span>
                                <span className="font-bold text-slate-700 font-sans">{slider.tab_step_it}</span>
                              </div>
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase block font-sans">Titolo Tab</span>
                                <span className="font-bold text-slate-700 font-sans">{slider.tab_title_it}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pulsanti azioni */}
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nextId = sliders.length > 0 ? Math.max(...sliders.map(s => s.id || 0)) + 1 : 1;
                                const cloned = {
                                  ...slider,
                                  id: nextId,
                                  title_it: `${slider.title_it} (Copia)`,
                                  title_en: `${slider.title_en} (Clone)`,
                                  tab_step_it: `${slider.tab_step_it} (Copia)`,
                                  tab_step_en: `${slider.tab_step_en} (Clone)`
                                };
                                setSliders([...sliders, cloned]);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer font-sans"
                            >
                              <Copy className="h-3.5 w-3.5" /> Clona
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSliderForm({ ...slider });
                                setEditingSliderId(slider.id);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer font-sans"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Modifica
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (sliders.length <= 1) {
                                  showPopup({
                                    type: 'error',
                                    title: "Impossibile Eliminare",
                                    message: "Il sistema richiede almeno uno slider attivo sulla Home Page per poter funzionare correttamente.",
                                    confirmLabel: "Ok"
                                  });
                                  return;
                                }
                                setSliders(sliders.filter(s => s.id !== slider.id));
                              }}
                              className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg transition-all cursor-pointer"
                              title="Elimina"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TESTI LEGALI E INFORMATIVE (SUPER-CMS) */}
              <div className="space-y-6 pt-6 border-t border-slate-100 text-left">
                <h3 className="text-sm font-bold uppercase text-[#101b3a] border-b border-slate-100 pb-2.5 flex items-center gap-1.5 tracking-tight">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Editor Avanzato Testi Informativi & Conformità (CMS)
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl">
                  Personalizza i testi legali visibili sul portale usando l'editor di testo avanzato con formattazione Markdown e anteprima live in tempo reale. Se decidi di non personalizzarli, verranno riprodotti automaticamente i testi ministeriali standard.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AdvancedPolicyEditor
                    label="Testo dell'Informativa Privacy"
                    value={privacyText}
                    onChange={setPrivacyText}
                    defaultFallbackText={DEFAULT_PRIVACY_TEXT}
                    placeholder="Scrivi qui l'informativa sulla privacy..."
                    description="Supporta formattazione avanzata: Titoli (H1, H2, H3), Grassetto, Corsivo, Liste ed Hyperlink."
                  />
                  <AdvancedPolicyEditor
                    label="Testo dell'Informativa Cookie"
                    value={cookieText}
                    onChange={setCookieText}
                    defaultFallbackText={DEFAULT_COOKIE_TEXT}
                    placeholder="Scrivi qui l'informativa sui cookie..."
                    description="Supporta formattazione avanzata: Titoli (H1, H2, H3), Grassetto, Corsivo, Liste ed Hyperlink."
                  />
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
