/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const envPath = path.join(process.cwd(), '.env');
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

// Colori ANSI per il terminale
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function logo() {
  console.log(`
${colors.cyan}${colors.bright}=============================================================
      _           _                 _ _    _       _     
     / \\   _ __  (_)_ __ ___   __ _| | |__| |     | |    
    / _ \\ | '_ \\ | | '_ \` _ \\ / _\` | | '_ \\ |     | |    
   / ___ \\| | | || | | | | | | (_| | | | | | |___  |_|    
  /_/   \\_\\_| |_|/ |_| |_| |_|\\__,_|_|_| |_|_____| (_)    
               |__/                                       
=============================================================
   Configuratore Automatico Firebase - per Comuni/Enti PA
=============================================================${colors.reset}
`);
}

// Funzione helper per chiedere l'input
function askQuestion(query, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptText = defaultValue 
    ? `${query} ${colors.yellow}[${defaultValue}]${colors.reset}: `
    : `${query}: `;

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

// Carica configurazioni esistenti da .env
function parseEnv() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      // Rimuove gli apici se presenti
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      envVars[key] = val;
    }
  });
  return envVars;
}

// Carica configurazione esistente da firebase-applet-config.json
function parseConfig() {
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

// Salva o aggiorna .env senza intaccare le altre variabili esistenti
function saveEnv(newVars) {
  let existingContent = '';
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, 'utf8');
  }

  const lines = existingContent.split('\n');
  const updatedKeys = new Set();
  const resultLines = [];

  // Scorri le righe esistenti e aggiorna se corrispondono
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      if (newVars.hasOwnProperty(key)) {
        resultLines.push(`${key}="${newVars[key]}"`);
        updatedKeys.add(key);
      } else {
        resultLines.push(line);
      }
    } else {
      resultLines.push(line);
    }
  }

  // Aggiungi nuove chiavi che non esistevano
  const firebaseHeaderAdded = false;
  for (const [key, value] of Object.entries(newVars)) {
    if (!updatedKeys.has(key)) {
      resultLines.push(`${key}="${value}"`);
    }
  }

  fs.writeFileSync(envPath, resultLines.join('\n'), 'utf8');
}

// Salva o aggiorna firebase-applet-config.json
function saveConfig(configData) {
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
}

async function main() {
  logo();

  console.log(`${colors.green}Caricamento delle configurazioni correnti in corso...${colors.reset}`);
  const currentEnv = parseEnv();
  const currentConfig = parseConfig();

  // Estraiamo i valori di default provando da .env o da firebase-applet-config.json
  const defaultApiKey = currentEnv.VITE_FIREBASE_API_KEY || currentEnv.NEXT_PUBLIC_FIREBASE_API_KEY || currentConfig.apiKey || '';
  const defaultAuthDomain = currentEnv.VITE_FIREBASE_AUTH_DOMAIN || currentEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || currentConfig.authDomain || '';
  const defaultProjectId = currentEnv.VITE_FIREBASE_PROJECT_ID || currentEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || currentConfig.projectId || '';
  const defaultStorageBucket = currentEnv.VITE_FIREBASE_STORAGE_BUCKET || currentEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || currentConfig.storageBucket || '';
  const defaultMessagingSenderId = currentEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || currentEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || currentConfig.messagingSenderId || '';
  const defaultAppId = currentEnv.VITE_FIREBASE_APP_ID || currentEnv.NEXT_PUBLIC_FIREBASE_APP_ID || currentConfig.appId || '';
  const defaultDatabaseId = currentEnv.VITE_FIREBASE_DATABASE_ID || currentConfig.firestoreDatabaseId || '';
  const defaultServiceAccount = currentEnv.FIREBASE_SERVICE_ACCOUNT_KEY || '';

  console.log(`\n${colors.cyan}--- FASE 1: Configurazione Firebase Client (per browser) ---${colors.reset}\n`);

  const apiKey = await askQuestion('Inserisci Firebase API Key', defaultApiKey);
  const authDomain = await askQuestion('Inserisci Firebase Auth Domain', defaultAuthDomain);
  const projectId = await askQuestion('Inserisci Firebase Project ID', defaultProjectId);
  const storageBucket = await askQuestion('Inserisci Firebase Storage Bucket', defaultStorageBucket);
  const messagingSenderId = await askQuestion('Inserisci Firebase Messaging Sender ID', defaultMessagingSenderId);
  const appId = await askQuestion('Inserisci Firebase App ID', defaultAppId);
  const databaseId = await askQuestion('Inserisci Firestore Database ID (facoltativo - invio per default/vuoto)', defaultDatabaseId);

  console.log(`\n${colors.cyan}--- FASE 2: Configurazione Firebase Admin SDK (per server) ---${colors.reset}\n`);
  console.log(`${colors.magenta}La chiave di servizio Admin SDK (Service Account) è richiesta per consentire al server sicuro${colors.reset}`);
  console.log(`${colors.magenta}di sincronizzare i dati e applicare le politiche di audit. Puoi inserire:${colors.reset}`);
  console.log(`  1. Il ${colors.bright}percorso di un file JSON${colors.reset} scaricato (es: ${colors.yellow}./service-account.json${colors.reset})`);
  console.log(`  2. Direttamente la ${colors.bright}stringa JSON${colors.reset} della chiave privata\n`);

  let rawServiceAccount = await askQuestion('Percorso file o Stringa JSON del Service Account', defaultServiceAccount ? '[GIA CONFIGURATO - Premi Invio per mantenere o inserisci nuovo]' : '');

  let serviceAccountValue = defaultServiceAccount;

  if (rawServiceAccount && rawServiceAccount !== '[GIA CONFIGURATO - Premi Invio per mantenere o inserisci nuovo]') {
    // Controlliamo se è un percorso file valido
    const potentialPath = path.resolve(process.cwd(), rawServiceAccount);
    if (fs.existsSync(potentialPath) && fs.statSync(potentialPath).isFile()) {
      try {
        console.log(`${colors.green}Lettura della chiave dal file: ${rawServiceAccount}...${colors.reset}`);
        const fileContent = fs.readFileSync(potentialPath, 'utf8');
        // validiamo che sia un json
        JSON.parse(fileContent);
        serviceAccountValue = fileContent.trim();
        console.log(`${colors.green}File JSON letto e validato con successo!${colors.reset}`);
      } catch (err) {
        console.log(`${colors.red}Errore nella lettura del file o formato JSON non valido: ${err.message}${colors.reset}`);
        console.log(`${colors.yellow}Verrà utilizzato il valore letterale inserito.${colors.reset}`);
        serviceAccountValue = rawServiceAccount;
      }
    } else {
      // Proviamo a validarlo come stringa JSON diretta
      try {
        JSON.parse(rawServiceAccount);
        serviceAccountValue = rawServiceAccount;
        console.log(`${colors.green}Stringa JSON validata con successo!${colors.reset}`);
      } catch (err) {
        console.log(`${colors.yellow}Attenzione: La stringa inserita non sembra un JSON valido.${colors.reset}`);
        serviceAccountValue = rawServiceAccount;
      }
    }
  }

  // Prepariamo le variabili d'ambiente da scrivere
  const updatedEnvVars = {
    // Scriviamo sia in formato VITE_ che in formato NEXT_PUBLIC_ per retrocompatibilità
    VITE_FIREBASE_API_KEY: apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: authDomain,
    VITE_FIREBASE_PROJECT_ID: projectId,
    VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
    VITE_FIREBASE_APP_ID: appId,
    VITE_FIREBASE_DATABASE_ID: databaseId,

    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: appId,

    FIREBASE_SERVICE_ACCOUNT_KEY: serviceAccountValue
  };

  console.log(`\n${colors.cyan}--- FASE 3: Salvataggio e Scrittura File ---${colors.reset}\n`);

  // Salva in .env
  console.log(`Aggiornamento del file ${colors.bright}.env${colors.reset}...`);
  saveEnv(updatedEnvVars);
  console.log(`${colors.green}File .env aggiornato con successo!${colors.reset}`);

  // Aggiorna firebase-applet-config.json
  console.log(`Aggiornamento di ${colors.bright}firebase-applet-config.json${colors.reset}...`);
  const newConfig = {
    projectId: projectId,
    appId: appId,
    apiKey: apiKey,
    authDomain: authDomain,
    firestoreDatabaseId: databaseId || undefined,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId
  };
  saveConfig(newConfig);
  console.log(`${colors.green}File firebase-applet-config.json aggiornato con successo!${colors.reset}`);

  console.log(`\n${colors.green}${colors.bright}=============================================================
  ✓ CONFIGURAZIONE COMPLETATA CON SUCCESSO!
=============================================================${colors.reset}\n`);
  console.log(`La tua installazione di AnimalHub per il Comune è pronta.`);
  console.log(`Puoi adesso procedere con i test locali o eseguire il deploy.`);
  console.log(`\nPer riavviare il server in modalità sviluppo esegui:\n  ${colors.cyan}npm run dev${colors.reset}\n`);
}

main().catch(err => {
  console.error(`${colors.red}Errore irreversibile durante la configurazione:${colors.reset}`, err);
});
