import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Trash2, Edit, Shield, CheckSquare, Square, Lock, RefreshCw } from 'lucide-react';

interface Operator {
  id: number;
  username: string;
  role: string;
  comune_key: string;
  visible_modules: string | string[] | null;
}

export default function GestioneOperatoriTab({ currentUser }: { currentUser: any }) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [id, setId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('POLIZIA_LOCALE');
  const [comuneKey, setComuneKey] = useState('naro');
  const [selectedModules, setSelectedModules] = useState<string[]>(['modulo-b']);

  const availableModules = [
    { id: 'statistiche', name: 'Dashboard Statistiche (KPI)' },
    { id: 'modulo-b', name: 'Modulo B — Operativa Uffici & Segnalazioni' },
    { id: 'modulo-c', name: 'Modulo C — Registro Anagrafico Digitale' },
    { id: 'modulo-adozioni', name: 'Modulo Adozioni & Gestione Costi / Bilancio' },
  ];

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setOperators(data);
      } else {
        setError('Impossibile caricare l\'elenco degli operatori.');
      }
    } catch (e) {
      setError('Errore nella connessione con il server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleModuleToggle = (modId: string) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter(m => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleResetForm = () => {
    setId(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setRole('POLIZIA_LOCALE');
    setComuneKey('naro');
    setSelectedModules(['modulo-b']);
    setError('');
    setSuccess('');
  };

  const handleEditClick = (op: any) => {
    setError('');
    setSuccess('');
    setId(op.id);
    setUsername(op.username);
    setPassword(''); // lasciata vuota per non interferire con l'hash esistente
    setEmail(op.email || '');
    setRole(op.role);
    setComuneKey(op.comune_key || 'naro');
    
    // Parse visible modules
    let parsed: string[] = ['modulo-b'];
    if (op.visible_modules) {
      if (typeof op.visible_modules === 'string') {
        try {
          parsed = JSON.parse(op.visible_modules);
        } catch (e) {}
      } else if (Array.isArray(op.visible_modules)) {
        parsed = op.visible_modules;
      }
    }
    setSelectedModules(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || (!id && !password)) {
      setError('Compila tutti i campi richiesti.');
      return;
    }

    const payload = {
      username,
      password: password || undefined,
      email: email || undefined,
      role,
      comune_key: comuneKey,
      visible_modules: selectedModules
    };

    try {
      const url = id ? `/api/admin/users/${id}` : '/api/admin/users';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(id ? 'Operatore aggiornato con successo!' : 'Nuovo operatore registrato con successo!');
        handleResetForm();
        fetchOperators();
      } else {
        setError(data.error || 'Errore durante l\'operazione.');
      }
    } catch (e) {
      setError('Errore di connessione nel salvataggio.');
    }
  };

  const handleDelete = async (targetId: number, targetName: string) => {
    if (targetName === 'admin') {
      alert('Non è possibile eliminare l\'amministratore principale di sistema.');
      return;
    }
    if (!confirm(`Sei sicuro di voler revocare l'accesso ed eliminare l'operatore "${targetName}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/admin/users/${targetId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Operatore "${targetName}" eliminato con successo.`);
        fetchOperators();
      } else {
        setError(data.error || 'Errore nella cancellazione dell\'utente.');
      }
    } catch (e) {
      setError('Errore di connessione.');
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Pannello Super-User</span>
          <h2 className="text-2xl font-black text-[#101b3a] tracking-tight mt-1">Console d'Amministrazione Operatori PA</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Crea, modifica e configura granularmente i livelli d'accesso e la visibilità dei moduli per ciascun operatore comunale dell'Ente.</p>
        </div>
        <button 
          onClick={fetchOperators}
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center transition-all shrink-0 cursor-pointer"
          title="Aggiorna elenco"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* FORM OPERATORE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#15803d]/10 rounded-xl text-[#15803d]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#101b3a] uppercase tracking-wider">{id ? 'Modifica Operatore' : 'Registra Nuovo Operatore'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{id ? `ID Utente: ${id}` : 'Inquadra nel backoffice'}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-xs font-bold text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 block">Username / ID d'Accesso</label>
              <input
                type="text"
                required
                disabled={username === 'admin' && id !== null}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="es. m.rossi"
                className="w-full p-2.5 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg text-xs font-bold outline-none focus:border-[#15803d] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 block">Indirizzo Email (Per Token 2FA)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="es. operatore@comune.it"
                className="w-full p-2.5 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg text-xs font-bold outline-none focus:border-[#15803d] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 block">
                {id ? 'Password (lascia vuoto per non cambiare)' : 'Password Iniziale'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required={!id}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg text-xs font-bold outline-none focus:border-[#15803d] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 block">Ruolo Istituzionale</label>
              <select
                value={role}
                disabled={username === 'admin'}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-[#15803d] transition-all cursor-pointer"
              >
                <option value="ADMIN">Amministratore Ente Sviluppatore / Segretario</option>
                <option value="POLIZIA_LOCALE">Polizia Locale - Municipale</option>
                <option value="CANILE_SANITARIO">Veterinario / Gestore Strutture ASP</option>
                <option value="VOLONTARIO">Volontario Associazione Protezione</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 block">Comune d'Competenza</label>
              <input
                type="text"
                required
                disabled={username === 'admin'}
                value={comuneKey}
                onChange={(e) => setComuneKey(e.target.value.toLowerCase())}
                placeholder="naro"
                className="w-full p-2.5 border border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg text-xs font-bold outline-none focus:border-[#15803d] transition-all font-mono"
              />
            </div>

            {/* CHECKBOX VISUAL MODULES */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 block">Visibilità Moduli Abilitati</label>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Associa quali schede operative l'utente visualizzerà nel proprio portale operativo.</p>
              
              <div className="space-y-2 pt-2">
                {availableModules.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleModuleToggle(mod.id)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all border ${
                        isChecked 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-bold' 
                          : 'bg-slate-50/50 border-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-[#15803d]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[11px] leading-tight">{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              {id && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-slate-50 cursor-pointer"
                >
                  Annulla
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-[#15803d] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-[#166534] transition-all cursor-pointer"
              >
                {id ? 'Aggiorna Profilo' : 'Salva Operatore'}
              </button>
            </div>
          </form>
        </div>

        {/* TABELLA OPERATORI */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-[#101b3a]/5 rounded-xl text-[#101b3a]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#101b3a] uppercase tracking-wider font-sans">Operatori Correntemente Abilitati</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dati memorizzati nel pool regionale MySQL</p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Caricamento in corso...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2">Username</th>
                    <th className="py-3 px-2">Ruolo</th>
                    <th className="py-3 px-2">Comune</th>
                    <th className="py-3 px-2">Moduli Abilitati</th>
                    <th className="py-3 px-2 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operators.map((op) => {
                    let opModules: string[] = [];
                    if (op.visible_modules) {
                      if (typeof op.visible_modules === 'string') {
                        try {
                          opModules = JSON.parse(op.visible_modules);
                        } catch (e) {}
                      } else if (Array.isArray(op.visible_modules)) {
                        opModules = op.visible_modules;
                      }
                    } else {
                      // Se i moduli visibili sono vuoti, impostiamo default statici in base al ruolo
                      if (op.role === 'ADMIN') opModules = ['statistiche', 'modulo-b', 'modulo-c', 'modulo-adozioni'];
                      else if (op.role === 'POLIZIA_LOCALE') opModules = ['modulo-b', 'modulo-c'];
                      else if (op.role === 'CANILE_SANITARIO') opModules = ['modulo-b', 'modulo-c', 'modulo-adozioni'];
                      else opModules = ['modulo-b'];
                    }

                    return (
                      <tr key={op.id} className="hover:bg-slate-50/50 transition-colors font-semibold text-slate-700">
                        <td className="py-4 px-2 font-bold text-slate-900 flex items-center gap-1.5">
                          {op.username === 'admin' && <Shield className="h-3.5 w-3.5 text-amber-500 fill-amber-100" />}
                          {op.username}
                        </td>
                        <td className="py-4 px-2">
                          <span className={`text-[9px] px-2 py-1 rounded-full uppercase tracking-wider font-extrabold border ${
                            op.role === 'ADMIN' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200/50' 
                              : op.role === 'POLIZIA_LOCALE' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200/50' 
                              : op.role === 'CANILE_SANITARIO' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50'
                              : 'bg-purple-50 text-purple-700 border-purple-200/30'
                          }`}>
                            {op.role}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-mono text-slate-400 capitalize">{op.comune_key}</td>
                        <td className="py-4 px-2 font-sans">
                          <div className="flex flex-wrap gap-1">
                            {opModules.map(m => (
                              <span key={m} className="bg-slate-100 text-slate-600 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold border border-slate-200/50">
                                {m.replace('modulo-', 'Mod. ')}
                              </span>
                            ))}
                            {opModules.length === 0 && <span className="text-slate-400 italic text-[9px]">Sotto-mansionato</span>}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditClick(op)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-all cursor-pointer"
                              title="Modifica privilegi ed operatore"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {op.username !== 'admin' && (
                              <button
                                onClick={() => handleDelete(op.id, op.username)}
                                className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-all cursor-pointer"
                                title="Revoca accesso"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
