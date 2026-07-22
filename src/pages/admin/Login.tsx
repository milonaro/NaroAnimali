import { useState, useEffect } from 'react';
import { UserCircle, Lock, ShieldCheck, Eye, EyeOff, KeyRound, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { popup } from '../../lib/popup';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Login, 2: OTP
  const [otp, setOtp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/admin/setup-status')
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(data => {
        if (data) {
          setIsConfigured(data.configured);
        }
      })
      .catch(e => console.error(e));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requireOtp) {
          setUserEmail(data.email);
          setStep(2);
          let successMsg = `Token inviato all'indirizzo email: ${data.email || 'registrato'}`;
          if (data.debugOtp) {
            successMsg += ` (SMTP non configurato. Token di test: ${data.debugOtp})`;
          }
          setMessage(successMsg);
        } else {
          navigate('/operatori');
        }
      } else {
        if (data.VERCEL_WRAPPER_ERROR) {
          setError(`Errore Server Vercel: ${data.VERCEL_WRAPPER_ERROR}. Verifica le variabili d'ambiente (.env) su Vercel.`);
        } else {
          setError(data.error || "Credenziali o codice non validi");
        }
      }
    } catch (e) {
      setError("Errore di connessione");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp })
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/operatori');
      } else {
        if (data.VERCEL_WRAPPER_ERROR) {
          setError(`Errore Server Vercel: ${data.VERCEL_WRAPPER_ERROR}`);
        } else {
          setError(data.error || "Codice OTP non valido");
        }
      }
    } catch (e) {
      setError("Errore di connessione OTP");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      setError("Inserire l'indirizzo email associato");
      return;
    }
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setStep(4);
        setMessage(`OTP per ripristino password inviato a: ${userEmail}. ${data.debugOtp ? `Token di test: ${data.debugOtp}` : ''}`);
      } else {
        setError(data.error || "Errore durante l'invio del reset");
      }
    } catch (e) {
      setError("Errore di connessione");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        popup.success("Password modificata con successo.");
        setStep(1);
        setPassword('');
        setUsername('');
        setOtp('');
      } else {
        setError(data.error || "Codice OTP non valido o scaduto");
      }
    } catch (e) {
      setError("Errore di connessione OTP");
    }
  };

  const handleForgotPassword = () => {
    setStep(3);
    setError('');
    setMessage('');
  };

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen justify-center items-center px-4">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 justify-center items-center">
        
        {/* Modern Header block */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all max-w-md w-full">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">AnimalHub PA / Enti Locali Convenzionati</span>
            <h1 className="text-xl sm:text-2xl font-black text-[#101b3a] tracking-tight mt-1">Area Operatori & Admin</h1>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="bg-[#101b3a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              {step === 1 ? <ShieldCheck className="text-[#101b3a] h-6 w-6" /> : <KeyRound className="text-[#15803d] h-6 w-6" />}
            </div>
            <h2 className="text-xl font-black text-[#101b3a] tracking-tight">{step === 1 ? 'Accedi alla Console' : 'Verifica Sicurezza 2FA'}</h2>
            <p className="text-slate-500 text-xs font-bold mt-1.5 uppercase tracking-wide">
              {step === 1 ? 'Inserisci la tua matricola o codice autorizzato' : 'Inserisci il token ricevuto via email per accedere'}
            </p>
          </div>

          {!isConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl text-xs space-y-2.5 relative overflow-hidden text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
              <div className="flex items-start gap-2.5">
                <Settings className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-black text-amber-950 uppercase tracking-wide">
                    Prima Installazione Rilevata
                  </h4>
                  <p className="text-slate-600 leading-relaxed font-normal">
                    Questa istanza di AnimalHub non è agganciata a Firebase. L'autenticazione è bloccata finché non inserisci le chiavi.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/setup"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#15803d] hover:bg-[#15803d]/90 text-white font-black py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-sm"
              >
                Avvia Installatore Esclusivo
              </Link>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-bold text-center">
              {message}
            </div>
          )}

          {step === 1 ? (
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Password di Servizio</label>
                  <button type="button" onClick={handleForgotPassword} className="text-[10px] font-bold text-[#15803d] hover:underline uppercase tracking-wider">
                    Password Dimenticata?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all cursor-pointer"
              >
                Accedi al Cruscotto Amministrativo
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block text-center">Token Monouso (OTP)</label>
                <div className="relative max-w-[200px] mx-auto">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-2xl tracking-[0.4em] font-black text-center text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={otp.length !== 6}
                className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all cursor-pointer disabled:opacity-50"
              >
                Verifica ed Entra
              </button>
              <button 
                type="button" 
                onClick={() => {setStep(1); setOtp('');}}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all cursor-pointer"
              >
                Torna al Login
              </button>
            </form>
          ) : step === 3 ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Indirizzo Email Autorizzato</label>
                <input 
                  type="email" 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-300"
                  placeholder="admin@comune.it"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all cursor-pointer"
              >
                Invia Token Ripristino
              </button>
              <button 
                type="button" 
                onClick={() => {setStep(1); setUserEmail('');}}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all cursor-pointer"
              >
                Torna al Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block text-center">Token Monouso (OTP)</label>
                <div className="relative max-w-[200px] mx-auto">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-2xl tracking-[0.4em] font-black text-center text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Nuova Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={otp.length !== 6 || password.length < 8}
                className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all cursor-pointer disabled:opacity-50"
              >
                Imposta Nuova Password
              </button>
            </form>
          )}
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
