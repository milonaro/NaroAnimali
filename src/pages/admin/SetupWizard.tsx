/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, Cloud, Server, Database, Key, 
  Settings, CheckCircle2, XCircle, ArrowRight, ArrowLeft, 
  Terminal, ExternalLink, Copy, Check, Lock, Loader2, Wifi, RefreshCw
} from 'lucide-react';
import { popup } from '../../lib/popup';

export default function SetupWizard() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [isVercel, setIsVercel] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // MySQL Form Fields
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('animalhub_db');
  const [dbUser, setDbUser] = useState('root');
  const [dbPass, setDbPass] = useState('');
  const [testingMysql, setTestingMysql] = useState(false);
  const [mysqlConnected, setMysqlConnected] = useState<boolean | null>(null);

  // Firebase Form Fields
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [appId, setAppId] = useState('');
  const [databaseId, setDatabaseId] = useState('(default)');
  const [serviceAccountKey, setServiceAccountKey] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup-status');
      if (res.ok) {
        const data = await res.json();
        setConfigured(data.configured);
        setIsVercel(data.isVercel);
        if (data.dbHost) setDbHost(data.dbHost);
        if (data.dbName) setDbName(data.dbName);
        if (data.dbUser) setDbUser(data.dbUser);
        if (data.dbPort) setDbPort(data.dbPort);
        
        if (data.configured) {
          localStorage.setItem('animalhub_configured', 'true');
        }
      }
    } catch (err) {
      console.error("Errore controllo stato setup:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMysql = async () => {
    if (!dbHost || !dbName || !dbUser) {
      popup.error("Inserisci Host, Nome Database e Utente per testare la connessione.");
      return;
    }
    setTestingMysql(true);
    setMysqlConnected(null);
    try {
      const res = await fetch('/api/admin/test-mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbHost, dbPort, dbName, dbUser, dbPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMysqlConnected(true);
        popup.success(data.message || "Connessione al Database MySQL/MariaDB riuscita!");
      } else {
        setMysqlConnected(false);
        popup.error(data.message || "Impossibile connettersi al Database MySQL.");
      }
    } catch (err: any) {
      setMysqlConnected(false);
      popup.error(`Errore di rete durante il test MySQL: ${err.message}`);
    } finally {
      setTestingMysql(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(id);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/setup-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPass,
          apiKey,
          authDomain,
          projectId,
          storageBucket,
          appId,
          databaseId,
          serviceAccountKey
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('animalhub_configured', 'true');
        popup.success(data.message || "Configurazione inviata correttamente!");
        setStep(4); // Go to final summary
      } else {
        popup.error(data.error || "Errore durante il salvataggio");
      }
    } catch (err: any) {
      popup.error(`Errore di connessione: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#15803d] animate-spin mx-auto" />
          <p className="text-xs font-black uppercase text-slate-500 font-mono tracking-widest">
            Caricamento Assistente Installazione...
          </p>
        </div>
      </div>
    );
  }

  // Security Lock check
  if (configured) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-slate-50 flex items-center justify-center font-sans px-4">
        <div className="max-w-xl w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600" />
          
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#1e3a5f] uppercase tracking-wider">
              INSTALLATORE BLOCCATO
            </h2>
            <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-3 py-1 rounded-full tracking-wider">
              STATO: CONFIGURATO (LIVE)
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-left">
            La piattaforma AnimalHub di questo ente è già stata agganciata con successo ad un database Cloud/MySQL attivo. Per motivi di sicurezza e rispetto delle policy GDPR della PA, non è consentito sovrascrivere la configurazione pubblicamente.
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-2">
            <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide">
              Sei un amministratore autorizzato?
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Puoi modificare queste chiavi in ogni momento eseguendo il login e accedendo al <strong>Centro di Controllo Ente</strong> nella sezione "Diagnostica".
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/admin/login"
              className="flex-1 inline-flex items-center justify-center bg-[#15803d] hover:bg-[#15803d]/90 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Accedi alla Console
            </Link>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render the setup wizard
  return (
    <div className="pt-28 pb-16 min-h-screen bg-slate-50 font-sans px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Setup */}
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-md">
          <div className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#15803d] text-white px-2.5 py-0.5 rounded">
                ESCLUSIVO PA
              </span>
              <span className="text-[10px] font-mono text-slate-400">v1.2.0</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-400">
              Installatore Autonomo AnimalHub PA
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-normal max-w-2xl">
              Procedura guidata per l'inizializzazione del Database Relazionale MySQL/MariaDB e delle credenziali Cloud Firebase per il Comune.
            </p>
          </div>
          <div className="shrink-0 bg-slate-800 p-3 rounded-2xl border border-slate-700">
            <Settings className="w-10 h-10 text-emerald-400 animate-spin" />
          </div>
        </div>

        {/* Indicatori dei Passi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          {[
            { id: 1, name: "Database MySQL", sub: "Cluster Relazionale PA", icon: Database },
            { id: 2, name: "Web SDK", sub: "Client Browser", icon: Cloud },
            { id: 3, name: "Admin SDK", sub: "Sicurezza Server", icon: Server },
            { id: 4, name: "Attivazione", sub: "Finalizzazione", icon: ShieldCheck }
          ].map((s) => {
            const IconComponent = s.icon;
            return (
              <div 
                key={s.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  step === s.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-emerald-500/50' 
                    : step > s.id 
                    ? 'bg-emerald-50/70 border-emerald-200 text-[#1e3a5f]' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${step === s.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    Passo 0{s.id}
                  </span>
                  <IconComponent className={`w-4 h-4 ${step === s.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider">{s.name}</h4>
                <p className="text-[10px] opacity-75 mt-0.5 truncate">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Corpo del Setup */}
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm text-left space-y-8">
          
          {/* PASSO 1: CONFIGURAZIONE MYSQL / MARIADB */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-[#15803d] rounded-xl border border-emerald-100">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">
                      Passo 1: Configurazione Database MySQL / MariaDB (Server PA)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Inserisci le credenziali del database SQL principale dell'Ente per le tabelle istituzionali, il catasto ed il registro verbali.
                    </p>
                  </div>
                </div>

                {mysqlConnected === true && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> MySQL Connesso
                  </span>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" /> Per quale motivo occorre configurare MySQL?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  MySQL costituisce il <strong>registro relazionale ufficiale della PA</strong> (utenti operativi, geofencing dei comuni, registro verbali, storico adozioni e CMS della Home). Se lasci i valori di default o non hai un server MySQL esterno, la piattaforma attiverà automaticamente la modalità di fallback sicura con salvataggio locale SQLite integrato.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Host / Indirizzo Server MySQL (DB_HOST) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es: 127.0.0.1, localhost o db.comune.it"
                    value={dbHost}
                    onChange={(e) => { setDbHost(e.target.value); setMysqlConnected(null); }}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Porta (DB_PORT)
                  </label>
                  <input
                    type="text"
                    placeholder="3306"
                    value={dbPort}
                    onChange={(e) => { setDbPort(e.target.value); setMysqlConnected(null); }}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Nome Schema Database (DB_NAME) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="animalhub_db"
                    value={dbName}
                    onChange={(e) => { setDbName(e.target.value); setMysqlConnected(null); }}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Utente Database (DB_USER) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="root o animalhub_user"
                    value={dbUser}
                    onChange={(e) => { setDbUser(e.target.value); setMysqlConnected(null); }}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Password Database (DB_PASS)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={dbPass}
                    onChange={(e) => { setDbPass(e.target.value); setMysqlConnected(null); }}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              {/* Pulsante Test Connessione MySQL */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs text-slate-700 font-medium">
                      Verifica se il server MySQL è raggiungibile dall'esterno sulla porta 3306.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestMysql}
                    disabled={testingMysql}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {testingMysql ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        Verifica in corso...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 text-emerald-400" />
                        Test Connessione MySQL
                      </>
                    )}
                  </button>
                </div>

                {/* AVVISO DI ARUBA / HOSTING CONDIVISO CON PORTA 3306 BLOCCATA */}
                {mysqlConnected === false && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Avviso Hosting Condiviso (es. Aruba MySQL)
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      Gli hosting condivisi tradizionali come Aruba bloccano per sicurezza le connessioni remote dirette sulla porta 3306.
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-bold">
                      💡 Nessun problema! Le credenziali Aruba inserite verranno salvate regolarmente. L'applicazione proseguirà l'attivazione in <u>Modalità Fallback Sicura</u>. Successivamente, dal pannello Super Admin potrai gestire la migrazione ed il popolamento del database Aruba.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
                  {mysqlConnected === false 
                    ? "⚠️ Connessione remota non aperta: le credenziali verranno salvate per il popolamento successivo."
                    : "Puoi proseguire liberamente inserendo i dati dell'Ente."}
                </span>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Continua al Passo 2 <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}
          
          {/* PASSO 2: FIREBASE CLIENT WEB SDK */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-[#15803d] rounded-xl border border-emerald-100">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">
                      Passo 2: Configurazione Client Web SDK (Firebase Cloud)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Inserisci i parametri dell'applicazione Web generata all'interno del progetto Firebase per l'autenticazione ed il real-time dei cittadini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    API Key (VITE_FIREBASE_API_KEY) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Auth Domain (VITE_FIREBASE_AUTH_DOMAIN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="animalhub-comune.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Project ID (VITE_FIREBASE_PROJECT_ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="animalhub-comune"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    App ID (VITE_FIREBASE_APP_ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1:766098419020:web:b3e6..."
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Storage Bucket (VITE_FIREBASE_STORAGE_BUCKET)
                  </label>
                  <input
                    type="text"
                    placeholder="animalhub-comune.firebasestorage.app"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Database ID (VITE_FIREBASE_DATABASE_ID)
                  </label>
                  <input
                    type="text"
                    placeholder="(default)"
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Indietro a MySQL
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!apiKey || !authDomain || !projectId || !appId}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  Continua al Passo 3 <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: FIREBASE ADMIN SDK */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-[#15803d] rounded-xl border border-emerald-100">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">
                      Passo 3: Configurazione Admin SDK (Chiave Privata Server)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Incolla la chiave dell'Account di Servizio JSON scaricata dal pannello Firebase per le operazioni privilegiate di amministrazione.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                  Chiave Account di Servizio JSON (FIREBASE_SERVICE_ACCOUNT_KEY) *
                </label>
                <textarea
                  required
                  rows={7}
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "${projectId || 'vostro-id'}",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  "client_email": "..."\n}`}
                  value={serviceAccountKey}
                  onChange={(e) => setServiceAccountKey(e.target.value)}
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">Trattamento Sicuro dei dati della PA:</h5>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Questa chiave viene utilizzata esclusivamente dal backend sicuro dell'ente per firmare gli audit-log e validare le operazioni riservate dei verbali.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Indietro
                </button>

                <button
                  type="submit"
                  disabled={submitting || !serviceAccountKey}
                  className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#15803d]/90 text-white font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvataggio in corso...
                    </>
                  ) : (
                    <>
                      Attiva Piattaforma AnimalHub PA <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PASSO 4: RIEPILOGO FINALE */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider">
                  Configurazione Validata ed Inviata!
                </h3>
              </div>

              {isVercel ? (
                /* BOX ISTRUZIONI ESCLUSIVE PER VERCEL */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Rilevato Hosting Serverless (Vercel)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Complimenti! La chiave ed i parametri sono stati controllati e sono conformi. 
                      Tuttavia, trovandosi su una piattaforma <strong>Serverless Cloud (Vercel)</strong> con file-system protetto a sola lettura, non possiamo salvare direttamente le modifiche sul file locale <code className="bg-white px-1 py-0.5 rounded font-mono">.env</code>.
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-bold">
                      Per rendere definitive ed attive le chiavi, devi copiarle ed incollarle subito nel pannello di controllo della tua istanza Vercel:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-[#1e3a5f] tracking-wider border-b pb-1.5">
                      1. Stringhe di Configurazione Ambientale (su Vercel):
                    </h4>

                    {[
                      { label: "DB_HOST", val: dbHost },
                      { label: "DB_USER", val: dbUser },
                      { label: "DB_PASS", val: dbPass },
                      { label: "DB_NAME", val: dbName },
                      { label: "DB_PORT", val: dbPort },
                      { label: "VITE_FIREBASE_API_KEY", val: apiKey },
                      { label: "VITE_FIREBASE_AUTH_DOMAIN", val: authDomain },
                      { label: "VITE_FIREBASE_PROJECT_ID", val: projectId },
                      { label: "VITE_FIREBASE_STORAGE_BUCKET", val: storageBucket },
                      { label: "VITE_FIREBASE_APP_ID", val: appId },
                      { label: "VITE_FIREBASE_DATABASE_ID", val: databaseId },
                      { label: "FIREBASE_SERVICE_ACCOUNT_KEY", val: serviceAccountKey }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="text-left">
                          <span className="text-[10px] font-black font-mono text-[#1e3a5f] block">{item.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[380px] block" title={item.val}>{item.val || '(Non specificato)'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.val, item.label)}
                          className="self-end md:self-auto inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                        >
                          {copiedVar === item.label ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedVar === item.label ? 'Copiato!' : 'Copia'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-50 border rounded-xl space-y-2.5">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Procedura guidata passo-passo su Vercel:
                    </h5>
                    <ul className="list-decimal list-inside text-[11px] text-slate-600 space-y-1.5">
                      <li>Apri la tua dashboard su <a href="https://vercel.com" target="_blank" referrerPolicy="no-referrer" className="text-[#15803d] hover:underline font-bold inline-flex items-center gap-0.5">Vercel <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                      <li>Fai clic sul progetto dell'applicazione (es: <code className="bg-slate-100 px-1 font-bold">animalhubpa</code>).</li>
                      <li>Vai nella scheda <strong>"Settings"</strong> (Impostazioni) in alto &rarr; <strong>"Environment Variables"</strong> a sinistra.</li>
                      <li>Incolla ciascuna chiave sopra indicata e fai clic su <strong>"Save"</strong> (Salva).</li>
                      <li><strong>IMPORTANTE:</strong> Al termine dell'inserimento, vai nella scheda <strong>"Deployments"</strong>, seleziona l'ultimo deployment, fai clic sui tre puntini a destra e clicca su <strong>"Redeploy"</strong> per attivare le nuove variabili d'ambiente.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* INFORMAZIONE PER DOCKER / LOCALHOST / VPS */
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    Scrittura locale ed inizializzazione avvenuta con successo!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Tutte le chiavi d'ambiente inserite (MySQL e Firebase) sono state scritte correttamente all'interno del file <code className="bg-white px-1 py-0.5 rounded font-bold font-mono">.env</code> e nei file di sincronizzazione JSON dell'applicazione. Il database relazionale ed il cluster Cloud sono ora allineati.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                  Accedi ora alla Console Amministrativa
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
