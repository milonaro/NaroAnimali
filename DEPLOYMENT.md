# Guida al Deployment - AnimalHub PA

Questa guida spiega come configurare e pubblicare l'applicazione su diverse piattaforme.

## 1. Configurazione Firebase (Fondamentale)
Indipendentemente dalla piattaforma, devi ottenere le credenziali dal tuo progetto Firebase:
1. Vai su [Firebase Console](https://console.firebase.google.com/).
2. Seleziona il tuo progetto.
3. Clicca sull'icona **Ingranaggio (Impostazioni progetto)**.
4. In fondo alla pagina, nella sezione 'Le tue app', copia i valori della configurazione web:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 2. Deploy su Vercel (Demo Automatica)
Vercel è ottimizzato per app React e gestisce bene il frontend.

### Passaggi:
1. Connetti il tuo repository GitHub a Vercel.
2. Nelle **Environment Variables**, aggiungi le seguenti chiavi (corrispondenti ai valori di Firebase):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Il file `vercel.json` incluso nel progetto gestirà i reindirizzamenti (SPA routing).
4. Clicca su **Deploy**.

---

## 3. Deploy su Aruba (Linux con FTP)
Su Aruba (piani Shared Hosting Linux), solitamente non è possibile far girare un server Node.js persistente a meno che non sia un piano specifico "Cloud". 

### Opzione A: Solo Frontend (SPA)
Se vuoi pubblicare solo l'interfaccia (senza il database server-side dinamico):
1. Esegui localmente: `npm run build`.
2. Carica il contenuto della cartella `dist/` nella root del tuo spazio FTP via FileZilla.
3. Assicurati di caricare anche un file `.htaccess` per gestire il routing React.

### Opzione B: Node.js (Aruba Cloud / VPS)
Se hai accesso a un server Linux con Node.js installato:
1. Carica tutti i file (tranne `node_modules`).
2. Tramite SSH, entra nella cartella del progetto.
3. Esegui `npm install`.
4. Configura le variabili d'ambiente in un file `.env`.
5. Esegui `npm run build`.
6. Avvia l'app con un gestore di processi come PM2: `pm2 start dist/server.cjs`.

---

## 4. Variabili d'Ambiente Server (Sezione Segreta)
Se utilizzi funzioni server-side (come l'invio segnalazioni via API), devi configurare anche queste sul server:
- `GEMINI_API_KEY` (Per future integrazioni AI)
- `FIREBASE_SERVICE_ACCOUNT` (JSON dell'account di servizio per accesso admin al database)
