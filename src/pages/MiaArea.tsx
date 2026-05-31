import { useState } from 'react';
import { Mail, ShieldCheck, Search, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MiaArea() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: dashboard
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error("Errore nell'invio del codice");
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (!res.ok) throw new Error("Codice non valido o scaduto");
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 min-h-[600px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <div className="bg-zinc-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-xl">
                <Mail className="text-indigo-500 h-8 w-8" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mia Area</h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Accesso Istituzionale</p>
            </div>
            
            <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-bold uppercase tracking-widest text-white focus:border-indigo-500 outline-none transition-colors"
                  placeholder="tua@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
              <button
                disabled={!email || loading}
                onClick={handleSendOTP}
                className="w-full bg-white text-zinc-950 py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
              >
                {loading ? 'Requesting...' : 'Richiedi Accesso'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <div className="bg-zinc-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-xl">
                <ShieldCheck className="text-indigo-500 h-8 w-8" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Verifica</h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Codice inviato via email</p>
            </div>
            
            <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Inserisci Codice</label>
                <input
                  type="text"
                  maxLength={6}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center text-4xl font-black tracking-[0.5em] text-white focus:border-indigo-500 outline-none transition-colors"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
              <button
                disabled={otp.length !== 6 || loading}
                onClick={handleVerifyOTP}
                className="w-full bg-indigo-600 text-white py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 disabled:opacity-20"
              >
                {loading ? 'Verifying...' : 'Accedi Ora'}
              </button>
              <button onClick={() => setStep(1)} className="w-full text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Modifica Email</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2 block">Dossier Utente</span>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Le mie segnalazioni</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Sessione attiva per: {email}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors py-2 px-4 bg-zinc-900 border border-zinc-800 rounded-lg">Termina Sessione</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { code: 'NARO-2025-0042', status: 'IN_CARICO', date: '21 Maggio 2025', desc: 'Cane ferito avvistato in Contrada San Giorgio' },
                { code: 'NARO-2025-0015', status: 'CHIUSA', date: '12 Maggio 2025', desc: 'Gatto con cucciolata vicino al castello' }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-zinc-950 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em]">{item.code}</span>
                    <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                      item.status === 'CHIUSA' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' : 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-3 group-hover:text-indigo-400 transition-colors leading-tight">{item.desc}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <Clock className="h-3 w-3" /> {item.date}
                  </div>
                  <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-black text-indigo-500 group-hover:translate-x-1 transition-transform">
                    Dettagli Pratica <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state simulation */}
            <div className="bg-zinc-950 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-zinc-900">
              <Search className="h-12 w-12 text-zinc-800 mx-auto mb-6" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Archivio Storico Vuoto</h3>
              <p className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs mx-auto mt-4 px-8 border-t border-zinc-900 pt-4">Nessun'altra segnalazione rilevata per questa utenza.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
