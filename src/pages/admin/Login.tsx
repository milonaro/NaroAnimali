import { useState } from 'react';
import { UserCircle, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        navigate('/operatori');
      } else {
        const data = await res.json();
        setError(data.error || "Credenziali errate");
      }
    } catch (e) {
      setError("Errore di connessione");
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen justify-center items-center px-4">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 justify-center items-center">
        
        {/* Modern Header block */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all max-w-md w-full">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Ministero dell'Interno / Comune di Naro</span>
            <h1 className="text-xl sm:text-2xl font-black text-[#101b3a] tracking-tight mt-1">Area Operatori & Admin</h1>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="bg-[#101b3a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck className="text-[#101b3a] h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Accedi alla Console</h2>
            <p className="text-slate-500 text-xs font-bold mt-1.5 uppercase tracking-wide">Inserisci la tua matricola o codice autorizzato</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Matricola / ID Utente</label>
              <div className="relative">
                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-300"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Password di Servizio</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all cursor-pointer"
            >
              Accedi al Cruscotto Amministrativo
            </button>
          </form>
        </div>

        {/* Info box for testing multiple access levels */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl max-w-md w-full text-left space-y-2">
          <h3 className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.1em]">Account Operativi di Test</h3>
          <p className="text-[11px] text-emerald-700/80 leading-relaxed font-semibold">
            Il sistema è stato configurato con livelli di accesso differenziati per testare le autorizzazioni:
          </p>
          <ul className="text-[11px] text-emerald-800 space-y-1 font-mono">
            <li>• <strong className="font-sans">Admin (Completo + Gestione):</strong> admin / <span className="font-semibold select-all">admin2026</span></li>
            <li>• <strong className="font-sans">Polizia (B, C):</strong> polizia / <span className="font-semibold select-all">polizia2026</span></li>
            <li>• <strong className="font-sans">Canile (B, C, Adozioni):</strong> canile / <span className="font-semibold select-all">canile2026</span></li>
            <li>• <strong className="font-sans">Volontari (Solo B, sola lettura):</strong> volontario / <span className="font-semibold select-all">volontario2026</span></li>
          </ul>
        </div>

        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-4 flex items-center justify-center gap-2">
          <ShieldCheck className="h-3 w-3 text-[#15803d]" /> Accesso controllato dal Garante della Privacy
        </p>
      </div>
    </div>
  );
}
