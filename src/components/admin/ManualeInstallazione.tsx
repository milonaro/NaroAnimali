/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BookOpen, Terminal, Key, ShieldAlert, Cloud, HelpCircle, 
  Copy, Check, ArrowRight, ArrowLeft, ExternalLink, ShieldCheck, Database, Server 
} from 'lucide-react';

interface GuideStep {
  id: number;
  title: string;
  subtitle: string;
  icon: any;
}

export default function ManualeInstallazione() {
  const [activeStep, setActiveStep] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const steps: GuideStep[] = [
    { id: 1, title: 'Console Firebase', subtitle: 'Creazione del Progetto Cloud', icon: Cloud },
    { id: 2, title: 'Firebase & Auth', subtitle: 'Abilitazione di Firestore e Autenticazione', icon: ShieldAlert },
    { id: 3, title: 'Database MySQL', subtitle: 'Schema Relazionale e Inizializzazione Pool', icon: Database },
    { id: 4, title: 'Regole di Sicurezza', subtitle: 'Configurazione di firestore.rules', icon: ShieldCheck },
    { id: 5, title: 'Chiavi & Setup', subtitle: 'Inizializzazione delle chiavi d\'ambiente', icon: Key },
    { id: 6, title: 'Deploy Ente', subtitle: 'Messa in produzione sul cloud', icon: Terminal },
  ];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const securityRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regole di sicurezza per l'Anagrafe Canina e Segnalazioni
    match /segnalazioni/{document} {
      allow read: if true; // Lettura pubblica per geolocalizzazione sulla mappa
      allow create: if true; // Chiunque può inviare una segnalazione (cittadini)
      allow update, delete: if request.auth != null && request.auth.token.role == 'admin'; // Solo amministratori registrati
    }
    
    match /registro_anagrafica/{document} {
      allow read: if request.auth != null; // Lettura consentita solo agli utenti autenticati
      allow create: if request.auth != null; // Iscrizione permessa ad utenti registrati via OTP
      allow update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}`;

  const envSampleCode = `VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="animalhub-comune.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="animalhub-comune"
VITE_FIREBASE_STORAGE_BUCKET="animalhub-comune.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="766098419020"
VITE_FIREBASE_APP_ID="1:766098419020:web:b3e6..."

# Chiave Privata Admin SDK (formattata in singola riga JSON)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'`;

  return (
    <div className="space-y-6">
      {/* Header Guida */}
      <div className="border-b border-slate-100 pb-4 text-left">
        <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#15803d]" />
          Manuale Operativo di Installazione (PA & Comuni)
        </h3>
        <p className="text-xs text-slate-500">
          Guida passo-passo riservata agli amministratori e ai tecnici comunali per configurare e attivare nuove istanze autonome di AnimalHub.
        </p>
      </div>

      {/* Stepper Orizzontale */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                isActive 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : isCompleted 
                  ? 'bg-emerald-50/50 border-emerald-100 text-[#1e3a5f] hover:bg-slate-50' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  0{step.id}
                </span>
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-400' : 'text-[#15803d]'}`} />
              </div>
              <h5 className="text-xs font-black uppercase tracking-wider mt-2.5 truncate">{step.title}</h5>
              <p className="text-[9px] opacity-75 truncate">{step.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Box dei Contenuti */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[380px] flex flex-col justify-between text-left">
        
        {/* PASSO 1 */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#15803d] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Fase 1: Configurazione Cloud Primaria
              </span>
              <a 
                href="https://console.firebase.google.com" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="text-xs font-bold text-[#15803d] hover:underline flex items-center gap-1 font-sans"
              >
                Apri Firebase Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">Creazione del Progetto Firebase</h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Il Comune o l'Ente PA gestore deve creare un account Firebase dedicato per assicurare l'isolamento dei dati e l'autonomia gestionale. Segui questi passi nella console Firebase:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-[#15803d]/10 text-[#15803d] rounded-full flex items-center justify-center font-black shrink-0 text-[10px]">1</span>
                <span>Clicca su <strong>"Aggiungi progetto"</strong> (Add Project) nella console principale.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-[#15803d]/10 text-[#15803d] rounded-full flex items-center justify-center font-black shrink-0 text-[10px]">2</span>
                <span>Assegna un nome univoco legato all'ente (Es: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold font-mono">animalhub-comune-naro</code>).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-[#15803d]/10 text-[#15803d] rounded-full flex items-center justify-center font-black shrink-0 text-[10px]">3</span>
                <span>Disabilita o Abilita <strong>Google Analytics</strong> a seconda delle linee guida per la privacy dei dati del Comune (GDPR compliant).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-[#15803d]/10 text-[#15803d] rounded-full flex items-center justify-center font-black shrink-0 text-[10px]">4</span>
                <span>Attendi il completamento del provisioning (solitamente circa 10 secondi) e fai clic su <strong>"Continua"</strong>.</span>
              </li>
            </ul>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 mt-2">
              <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h6 className="text-xs font-black text-blue-950 uppercase tracking-wide">Importante per la PA:</h6>
                <p className="text-[11px] text-blue-800 leading-normal">
                  Consigliamo di associare il progetto a un account e-mail istituzionale dell'ufficio transizione digitale o della Polizia Municipale per evitare la perdita di possesso delle chiavi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2 */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#15803d] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Fase 2: Abilitazione Database & Sicurezza
            </span>
            <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">Abilitazione Cloud Firestore & Authentication</h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Una volta creato il progetto, è necessario configurare le risorse per ospitare l'anagrafe canina (Firestore) ed abilitare gli accessi con e-mail OTP (Authentication):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h5 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-[#15803d]" /> Cloud Firestore
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  1. Nel menu di sinistra clicca su <strong>Cloud Firestore</strong>.<br />
                  2. Clicca su <strong>"Crea database"</strong>.<br />
                  3. Seleziona l'area geografica più adatta (consigliato <strong>europe-west3 (Frankfurt)</strong> per rispettare il GDPR).<br />
                  4. Avvia il database in <strong>"Modalità di produzione"</strong> (le regole di sicurezza verranno sovrascritte al passo successivo).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h5 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                  <Key className="h-4.5 w-4.5 text-[#15803d]" /> Authentication
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  1. Clicca su <strong>Authentication</strong> nel menu laterale.<br />
                  2. Fai clic su <strong>"Inizia"</strong> (Get Started).<br />
                  3. Abilita il provider <strong>"E-mail/Password"</strong> o <strong>"Link e-mail (accesso senza password)"</strong> per abilitare l'invio e-mail dei codici OTP temporanei di sicurezza ai cittadini dell'ente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3 - MYSQL DATABASE */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Fase 3: Database Relazionale MySQL & Pool
            </span>
            <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">Inizializzazione Schema MySQL Integrato</h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              AnimalHub PA utilizza un database relazionale MySQL (tramite pool parametrizzato <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">mysql2/promise</code>) per la gestione ad alte prestazioni dell'anagrafe canina, registro delle segnalazioni, adozioni, spese, fatture e log di audit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h5 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-blue-600" /> Inizializzazione Automatica
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  L'inizializzazione dello schema avviane automaticamente all'avvio del server tramite <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">src/lib/mysql_init.ts</code>. Tutte le tabelle obbligatorie (inclusi utenti, registro anagrafica, segnalazioni, interventi, adozioni, strutture e fatture) vengono create se non esistenti.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h5 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                  <Server className="h-4.5 w-4.5 text-blue-600" /> Variabili di Connessione MySQL
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                  MYSQL_HOST=localhost<br />
                  MYSQL_PORT=3306<br />
                  MYSQL_USER=animalhub_user<br />
                  MYSQL_PASSWORD=******<br />
                  MYSQL_DATABASE=animalhub_db
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4 */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Fase 4: Regole di Sicurezza ed Audit
            </span>
            <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">Regole di Sicurezza di Firestore</h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Le regole di sicurezza impediscono ad utenti non autorizzati di modificare o cancellare i registri dell'anagrafe canina del Comune, assicurando che solo gli operatori autorizzati firmino gli attestati sanitari.
            </p>

            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-t-xl text-white">
                <span className="text-[10px] font-bold font-mono text-emerald-400">firestore.rules</span>
                <button
                  type="button"
                  onClick={() => handleCopy(securityRulesCode, 'rules')}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 font-bold px-2.5 py-1 rounded transition-all flex items-center gap-1 shrink-0"
                >
                  {copiedCode === 'rules' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode === 'rules' ? 'Copiato!' : 'Copia'}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 text-[10px] font-mono text-slate-200 rounded-b-xl overflow-x-auto max-h-[180px] leading-relaxed">
                {securityRulesCode}
              </pre>
            </div>
          </div>
        )}

        {/* PASSO 5 */}
        {activeStep === 5 && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#15803d] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Fase 5: Setup delle Variabili d'Ambiente
            </span>
            <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">Generazione delle Chiavi d'Ambiente</h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Per collegare l'applicazione al Cloud Firebase e MySQL, abbiamo implementato un assistente automatico nel terminale. Ottieni le chiavi:
            </p>

            <ul className="space-y-2 text-xs text-slate-600">
              <li>1. Clicca sull'icona <strong>Ingranaggio</strong> &rarr; <strong>"Impostazioni Progetto"</strong>.</li>
              <li>2. In basso, registra una <strong>Web App</strong> (es: "AnimalHub Web") per generare i dati di configurazione client.</li>
              <li>3. Vai nella sezione <strong>"Account di servizio"</strong>, clicca su <strong>"Genera nuova chiave privata"</strong> per scaricare il file JSON di amministrazione.</li>
            </ul>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Comando Terminale per la Configurazione Guidata:</p>
              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl font-mono text-xs text-emerald-400">
                <span>npm run setup</span>
                <button
                  type="button"
                  onClick={() => handleCopy('npm run setup', 'cmd')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-all cursor-pointer"
                >
                  {copiedCode === 'cmd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">Questo comando avvierà la configurazione interattiva che scriverà automaticamente i file d'ambiente.</span>
            </div>
          </div>
        )}

        {/* PASSO 6 */}
        {activeStep === 6 && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#15803d] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Fase 6: Messa in Produzione (Deploy)
            </span>
            <h4 className="text-base font-black text-[#1e3a5f] uppercase tracking-wider">Procedura di Deploy Finale</h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Al termine della configurazione locale delle chiavi di Firebase e MySQL, l'applicazione può essere compilata ed esportata per la messa in produzione:
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block font-mono">Comandi di compilazione e avvio del servizio:</span>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-200/50">
                  <span>npm run build</span>
                  <span className="text-[10px] text-slate-500 font-sans">Compila il server e il bundle client</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-200/50">
                  <span>npm start</span>
                  <span className="text-[10px] text-slate-500 font-sans">Avvia l'istanza Node.js in produzione sul porto 3000</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              Se l'applicazione è ospitata su infrastrutture server PaaS (es. <strong>Google Cloud Run</strong> o <strong>Vercel</strong>), assicurati di inserire le variabili d'ambiente presenti nel file <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-bold font-mono">.env</code> all'interno del pannello di controllo cloud dell'hosting prescelto dell'ente.
            </p>
          </div>
        )}

        {/* Pulsanti di Navigazione */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Passo Prec.
          </button>
          
          <span className="text-xs font-black text-slate-500 font-mono">Passo {activeStep} di {steps.length}</span>

          <button
            type="button"
            disabled={activeStep === steps.length}
            onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            Passo Succ. <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
