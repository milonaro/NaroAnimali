import { useState } from 'react';
import { UserCircle, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin2026');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#101b3a] text-white rounded-full flex items-center justify-center">
             <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-center text-[#101b3a] mb-2">Accesso Operatori</h1>
        <p className="text-center text-slate-500 text-sm mb-8">Inserisci le tue credenziali per accedere al cruscotto di AnimalHub PA.</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nome EUtente / Matricola</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-[#15803d]"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-[#15803d]"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-bold py-3 rounded-lg shadow-lg shadow-[#15803d]/20 transition-all uppercase tracking-wider text-xs">
            Accedi al Cruscotto
          </button>
        </form>
      </div>
    </div>
  );
}
