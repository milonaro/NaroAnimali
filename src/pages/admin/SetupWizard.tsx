/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, Cloud, Server, Database, Key, 
  Settings, CheckCircle2, XCircle, ArrowRight, ArrowLeft, 
  Terminal, ExternalLink, Copy, Check, Lock, Loader2 
} from 'lucide-react';
import { popup } from '../../lib/popup';

export default function SetupWizard() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [isVercel, setIsVercel] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Form Fields
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
      }
    } catch (err) {
      console.error("Errore controllo stato setup:", err);
    } finally {
      setLoading(false);
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
        popup.success(data.message || "Configurazione inviata correttamente!");
        setStep(3); // Go to final summary
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
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6 relative overflow-hidden">
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
            La piattaforma AnimalHub di questo ente è già stata agganciata con successo ad un database Firebase Cloud attivo. Per motivi di sicurezza e rispetto delle policy GDPR della PA, non è consentito sovrascrivere la configurazione pubblicamente.
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
    <div className="pt-32 pb-16 min-h-screen bg-slate-50 font-sans px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Setup */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-850 shadow-md">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#15803d] text-white px-2 py-0.5 rounded">
                ESCLUSIVO PA
              </span>
              <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-emerald-400">
              Installatore Autonomo AnimalHub
            </h2>
            <p className="text-xs text-slate-400 leading-normal">
              Inizializzazione guidata delle credenziali e dei cluster Cloud Firebase per la PA.
            </p>
          </div>
          <div className="shrink-0">
            <Settings className="w-10 h-10 text-slate-600 animate-spin" />
          </div>
        </div>

        {/* Indicatori dei Passi */}
        <div className="grid grid-cols-3 gap-2 text-left">
          {[
            { id: 1, name: "Web SDK", sub: "Client Browser" },
            { id: 2, name: "Admin SDK", sub: "Sicurezza Server" },
            { id: 3, name: "Attivazione", sub: "Finalizzazione" }
          ].map((s) => (
            <div 
              key={s.id} 
              className={`p-3.5 rounded-xl border transition-all ${
                step === s.id 
                  ? 'bg-slate-900 border-slate-900 text-white shadow' 
                  : step > s.id 
                  ? 'bg-emerald-50/50 border-emerald-100 text-[#1e3a5f]' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${step === s.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  0{s.id}
                </span>
                <span className="text-xs font-black uppercase tracking-wider">{s.name}</span>
              </div>
              <p className="text-[9px] opacity-75 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Corpo del Setup */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left space-y-6">
          
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-[#15803d]" />
                <h3 className="text-sm font-black text-[#1e3a5f] uppercase tracking-wider">
                  Configurazione Client Web SDK
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inserisci i dati dell'applicazione Web generata all'interno delle impostazioni del tuo progetto Firebase. Questi parametri permettono all'app nel browser dei cittadini di autenticarsi in totale sicurezza.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    API Key (VITE_FIREBASE_API_KEY) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    Auth Domain (VITE_FIREBASE_AUTH_DOMAIN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="animalhub-comune.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    Project ID (VITE_FIREBASE_PROJECT_ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="animalhub-comune"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    App ID (VITE_FIREBASE_APP_ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1:766098419020:web:b3e6..."
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    Storage Bucket (VITE_FIREBASE_STORAGE_BUCKET)
                  </label>
                  <input
                    type="text"
                    placeholder="animalhub-comune.firebasestorage.app"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    Database ID (VITE_FIREBASE_DATABASE_ID)
                  </label>
                  <input
                    type="text"
                    placeholder="(default)"
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!apiKey || !authDomain || !projectId || !appId}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-[#15803d]" />
                <h3 className="text-sm font-black text-[#1e3a5f] uppercase tracking-wider">
                  Configurazione Admin SDK (Server Key)
                </h3>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Inserisci l'intera chiave privata di amministrazione scaricata come file JSON nella sezione <strong>"Account di Servizio"</strong> del tuo pannello di controllo Firebase. 
                Questa chiave deve essere fornita in formato stringa JSON compatta.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                  Chiave Account di Servizio JSON (FIREBASE_SERVICE_ACCOUNT_KEY) *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "${projectId || 'vostro-id'}",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  "client_email": "..."\n}`}
                  value={serviceAccountKey}
                  onChange={(e) => setServiceAccountKey(e.target.value)}
                  className="w-full text-[11px] font-mono p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">Trattamento Sicuro dei dati della PA:</h5>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Questa chiave non viene memorizzata né inviata a server terzi. Viene inserita direttamente sul server sicuro di questo ente locale per eseguire l'audit-logging e la validazione dei certificati sanitari.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Indietro
                </button>

                <button
                  type="submit"
                  disabled={submitting || !serviceAccountKey}
                  className="inline-flex items-center gap-1.5 bg-[#15803d] hover:bg-[#15803d]/90 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    <>
                      Attiva Piattaforma <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                  Configurazione Validata ed Inviata!
                </h3>
              </div>

              {isVercel ? (
                /* BOX ISTRUZIONI ESCLUSIVE PER VERCEL */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/50 px-2.5 py-0.5 rounded-full border border-amber-200">
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
                      { label: "VITE_FIREBASE_API_KEY", val: apiKey },
                      { label: "VITE_FIREBASE_AUTH_DOMAIN", val: authDomain },
                      { label: "VITE_FIREBASE_PROJECT_ID", val: projectId },
                      { label: "VITE_FIREBASE_STORAGE_BUCKET", val: storageBucket },
                      { label: "VITE_FIREBASE_APP_ID", val: appId },
                      { label: "VITE_FIREBASE_DATABASE_ID", val: databaseId },
                      { label: "FIREBASE_SERVICE_ACCOUNT_KEY", val: serviceAccountKey }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="text-left">
                          <span className="text-[10px] font-black font-mono text-[#1e3a5f] block">{item.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[280px] block" title={item.val}>{item.val || '(Non specificato)'}</span>
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
                    Scrittura locale avvenuta con successo!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Tutte le chiavi d'ambiente inserite sono state scritte correttamente all'interno del file <code className="bg-white px-1 py-0.5 rounded font-bold font-mono">.env</code> e nel file di sincronizzazione JSON dell'applicazione. Il database è ora allineato e sicuro.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
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
