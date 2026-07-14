/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  RefreshCw, Terminal, Server, Key, Database, Globe, Copy, Check 
} from 'lucide-react';

interface DiagnosticData {
  success: boolean;
  client: {
    hasApiKey: boolean;
    hasAuthDomain: boolean;
    hasProjectId: boolean;
    hasAppId: boolean;
    hasStorageBucket: boolean;
    projectId: string;
    databaseId: string;
  };
  server: {
    hasServiceAccount: boolean;
    isServiceAccountValid: boolean;
    projectId: string;
    clientEmail: string;
  };
  firestore: {
    adminConnected: boolean;
    adminPingError?: string;
  };
  sync: {
    envAndConfigMatch: boolean;
    mismatchFields: string[];
  };
}

export default function SetupDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/firebase-diagnostic');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const errText = await res.text();
        setError(`Errore durante il test di diagnostica: ${errText || res.statusText}`);
      }
    } catch (err: any) {
      setError(`Errore di connessione al server diagnostico: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleCopyReport = () => {
    if (!data) return;
    const report = `
=== REPORT DIAGNOSTICA FIREBASE - ANIMALHUB ===
Generato il: ${new Date().toLocaleString()}

CONFIGURAZIONE CLIENT (BROWSER):
- API Key: ${data.client.hasApiKey ? 'OK' : 'Mancante'}
- Auth Domain: ${data.client.hasAuthDomain ? 'OK' : 'Mancante'}
- Project ID: ${data.client.projectId || 'Mancante'}
- App ID: ${data.client.hasAppId ? 'OK' : 'Mancante'}
- Storage Bucket: ${data.client.hasStorageBucket ? 'OK' : 'Mancante'}
- Database ID (Firestore): ${data.client.databaseId || 'Default (default)'}

CONFIGURAZIONE SERVER (ADMIN SDK):
- Service Account Key: ${data.server.hasServiceAccount ? 'Presente' : 'Mancante'}
- Validità JSON Chiave: ${data.server.isServiceAccountValid ? 'Valido JSON' : 'Non Valido/Mancante'}
- Project ID Chiave: ${data.server.projectId || 'N/D'}
- Client Email: ${data.server.clientEmail || 'N/D'}

STATO SINCRO E CONNESSIONE:
- Sincronizzazione .env / Config JSON: ${data.sync.envAndConfigMatch ? 'Sincronizzato' : 'Disallineato (' + data.sync.mismatchFields.join(', ') + ')'}
- Connessione Database (Admin SDK): ${data.firestore.adminConnected ? 'OK' : 'Fallita: ' + (data.firestore.adminPingError || '')}
==============================================
    `;
    navigator.clipboard.writeText(report.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calcolo stato globale
  const isAllGreen = data && 
    data.client.hasApiKey && 
    data.client.hasProjectId && 
    data.server.hasServiceAccount && 
    data.server.isServiceAccountValid && 
    data.firestore.adminConnected;

  return (
    <div className="space-y-6">
      {/* Header Diagnostica */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-wider">
            Diagnostica Firebase & Sicurezza
          </h3>
          <p className="text-xs text-slate-500">
            Monitoraggio automatizzato dell'integrazione con Firestore Database e Firebase Authentication.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Riesegui Test
          </button>
          {data && (
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiato!' : 'Copia Report'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 text-[#15803d] animate-spin" />
          <p className="text-sm font-semibold text-slate-500 font-mono">
            Esecuzione dei test di sicurezza e ping del database in corso...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 rounded-xl border border-rose-200 text-left space-y-3">
          <div className="flex items-center gap-2.5 text-rose-800">
            <XCircle className="h-6 w-6 shrink-0 text-rose-600" />
            <span className="font-black uppercase text-sm tracking-wider">Errore di Diagnostica</span>
          </div>
          <p className="text-xs text-rose-700 font-medium font-mono leading-relaxed">{error}</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verifica che il server sia avviato correttamente e che non vi siano errori di sintassi nel file <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">.env</code>.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6 text-left">
          {/* Card Stato Globale */}
          <div className={`p-6 rounded-xl border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${isAllGreen ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-current text-emerald-600" />
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full shrink-0 ${isAllGreen ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isAllGreen ? <ShieldCheck className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
              </div>
              <div className="space-y-1">
                <h4 className={`text-base font-black uppercase tracking-wider ${isAllGreen ? 'text-emerald-900' : 'text-amber-900'}`}>
                  {isAllGreen ? 'Infrastruttura Integrata & Sicura' : 'Configurazione Parziale o da Completare'}
                </h4>
                <p className={`text-xs leading-relaxed max-w-2xl ${isAllGreen ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isAllGreen 
                    ? "Tutti i sistemi Firebase (Client SDK, Admin Service Account e Firestore DB) sono configurati correttamente e operativi. Le policy e le chiavi crittografiche sono attive." 
                    : "Alcune configurazioni necessarie per l'allineamento sicuro con il Cloud non sono state completate o presentano disallineamenti. Segui la guida per inserire le chiavi mancanti."}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-1.5 items-end">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isAllGreen ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                {isAllGreen ? 'STATUS: PRONTO (LIVE)' : 'STATUS: CONFIGURAZIONE APERTA'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ID: {data.client.projectId || 'N/D'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blocco 1: Firebase Client SDK */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-[#1e3a5f] tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="h-4.5 w-4.5 text-[#15803d]" />
                Client Web SDK (Browser)
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Queste variabili consentono all'app nel browser del cittadino di interfacciarsi in sicurezza con Firebase per l'autenticazione ed il caricamento delle immagini.
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">API Key (VITE_FIREBASE_API_KEY)</span>
                  {data.client.hasApiKey ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Presente</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Mancante</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">Auth Domain (VITE_FIREBASE_AUTH_DOMAIN)</span>
                  {data.client.hasAuthDomain ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Presente</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Mancante</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">Project ID (VITE_FIREBASE_PROJECT_ID)</span>
                  {data.client.projectId ? (
                    <span className="text-emerald-600 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{data.client.projectId}</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Mancante</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">App ID (VITE_FIREBASE_APP_ID)</span>
                  {data.client.hasAppId ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Presente</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Mancante</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">Database ID (VITE_FIREBASE_DATABASE_ID)</span>
                  <span className="text-blue-700 font-mono text-[10px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {data.client.databaseId || 'Default (default)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Blocco 2: Firebase Admin SDK */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-[#1e3a5f] tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Server className="h-4.5 w-4.5 text-[#15803d]" />
                Admin SDK (Backend Sicuro)
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                La chiave di sicurezza del server (Service Account) garantisce privilegi amministrativi protetti per eseguire le query, l'audit-logging e il controllo incrociato dell'anagrafe.
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">Service Account Key</span>
                  {data.server.hasServiceAccount ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Caricata</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Mancante</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">Validità Formato JSON</span>
                  {data.server.isServiceAccountValid ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Valido</span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Non Valido</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">ID Progetto Associato</span>
                  {data.server.projectId ? (
                    <span className="text-slate-700 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{data.server.projectId}</span>
                  ) : (
                    <span className="text-slate-400">N/D</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold p-2 rounded bg-slate-50">
                  <span className="text-slate-600 font-mono">Email Account Servizio</span>
                  <span className="text-slate-700 font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[180px] block" title={data.server.clientEmail}>
                    {data.server.clientEmail || 'N/D'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blocco 3: Connessione Firestore */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-[#1e3a5f] tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Database className="h-4.5 w-4.5 text-[#15803d]" />
                Test di Connessione Firestore DB
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Il backend sicuro del Comune ha eseguito una transazione di prova (ping) sul database Firestore per verificare la raggiungibilità dei cluster cloud.
              </p>

              <div className="p-4 rounded-xl border flex items-center justify-between gap-4 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-full ${data.firestore.adminConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {data.firestore.adminConnected ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-slate-700 block">Stato Connessione</span>
                    <span className="text-xs text-slate-500">
                      {data.firestore.adminConnected ? 'Raggiungibile (Connessione OK)' : 'Database non raggiungibile'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${data.firestore.adminConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                  {data.firestore.adminConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {data.firestore.adminPingError && (
                <div className="p-3 bg-rose-50 rounded border border-rose-100 text-[11px] font-mono text-rose-700 leading-relaxed">
                  <strong>Dettaglio Errore:</strong> {data.firestore.adminPingError}
                </div>
              )}
            </div>

            {/* Blocco 4: Sincronizzazione file ambiente */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-[#1e3a5f] tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Terminal className="h-4.5 w-4.5 text-[#15803d]" />
                Allineamento File di Configurazione
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Verifica se i valori presenti nel file locale <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono font-bold">.env</code> corrispondono esattamente a quelli di <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono font-bold">firebase-applet-config.json</code>.
              </p>

              <div className="p-4 rounded-xl border flex items-center justify-between gap-4 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-full ${data.sync.envAndConfigMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {data.sync.envAndConfigMatch ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-slate-700 block">Allineamento File</span>
                    <span className="text-xs text-slate-500 leading-tight">
                      {data.sync.envAndConfigMatch 
                        ? 'Tutti i file sono perfettamente allineati.' 
                        : 'Disallineamento rilevato tra .env e configuratore JSON.'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${data.sync.envAndConfigMatch ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                  {data.sync.envAndConfigMatch ? 'ALLINEATO' : 'DISALLINEATO'}
                </span>
              </div>

              {!data.sync.envAndConfigMatch && data.sync.mismatchFields.length > 0 && (
                <div className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded border border-amber-100 text-left">
                  <span className="font-bold text-amber-800 block mb-1">Campi non corrispondenti:</span>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px] text-amber-700">
                    {data.sync.mismatchFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                  <span className="text-[10px] text-slate-400 mt-2 block leading-normal">
                    Suggerimento: Esegui <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold font-mono">npm run setup</code> nel terminale per riallineare i file automaticamente.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
