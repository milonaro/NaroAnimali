import { useState, useEffect } from 'react';
import { Building } from 'lucide-react';

export default function Config() {
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Comune di Naro");
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteName, siteLogo })
      });
      if (res.ok) {
        alert("Impostazioni salvate con successo. Ricarica la pagina per renderle visibili.");
      } else {
        const errData = await res.json();
        alert(errData.error || "Errore durante il salvataggio.");
      }
    } catch(err) {
      alert("Errore salvataggio");
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

  if (role !== 'Admin') {
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
          <a href="/operatori" className="inline-block bg-[#15803d] hover:bg-[#166534] text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all">
            Torna al Portale Operativo
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black text-[#1e3a5f] mb-6 flex items-center gap-3">
            <Building className="h-6 w-6 text-[#15803d]" /> 
            Configurazione Backend Admin
          </h2>
          
          <form onSubmit={handleSaveSettings} className="space-y-8 text-left">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">Informazioni Ente</h3>
              
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nome Ente (Es. Comune di Naro)</label>
                <input 
                  type="text" 
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded text-sm text-[#1e3a5f] font-semibold outline-none focus:border-[#15803d]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">Personalizzazione Grafica</h3>
              
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">URL Logo Istituzionale</label>
                <input 
                  type="url" 
                  value={siteLogo}
                  onChange={(e) => setSiteLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 border border-slate-200 rounded text-sm text-slate-600 outline-none focus:border-[#15803d]"
                />
                <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                  {siteLogo ? (
                    <div className="text-center space-y-2">
                       <img src={siteLogo} alt="Anteprima Logo" className="h-16 object-contain mx-auto mix-blend-multiply" />
                       <p className="text-[9px] uppercase font-bold text-slate-400">Anteprima Logo</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Nessun logo configurato</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                className="bg-[#15803d] hover:bg-[#166534] text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-[#15803d]/20 transition-all uppercase text-xs tracking-wider cursor-pointer"
              >
                Salva Impostazioni
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
