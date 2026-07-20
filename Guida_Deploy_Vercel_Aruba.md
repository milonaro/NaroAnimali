# Guida al Deploy Globale: Vercel, Firebase e MySQL (Aruba)

Questa guida ti spiega in modo semplice e dettagliato come mettere online il tuo progetto, come collegare i database e dove inserire le variabili d'ambiente (`.env`).

## 1. Il mistero del file `.env`: Dove va messo?

**ATTENZIONE:** Il file `.env` **NON** va messo sul server o sull'hosting Aruba dove si trova il tuo database MySQL (`www.bookping.it`).

Il file `.env` (Environment Variables) contiene le "chiavi segrete" della tua applicazione (password del DB, chiavi Firebase). Queste chiavi devono essere inserite **nel server che esegue la tua applicazione Node.js/React**, ovvero la piattaforma di hosting del codice (ad esempio **Vercel**, Render, o Google Cloud).

**Regola d'oro:**
- **Il Database (MySQL)** sta su Aruba (è solo un deposito dati).
- **L'Applicazione (Codice)** starà su Vercel.
- **Il file `.env` / Variabili** va configurato sul pannello Web di **Vercel**!

---

## 2. Configurazione Firebase (Il Database Realtime)

Firebase è essenziale per far funzionare i "Pin" sulla mappa in tempo reale. Che sia nuovo o vecchio, ecco cosa fare:

1. Vai sulla [Console di Firebase](https://console.firebase.google.com/) e crea un nuovo progetto (es. "AnimalHub Naro").
2. **Attiva Firestore Database** (in "Build" -> "Firestore Database") e clicca su "Crea Database" (per il momento in Modalità Test o definendo poi regole più stringenti).
3. **Crea l'App Web Firebase**: Nelle impostazioni del progetto (l'icona ingranaggio), vai in Generale, scorri in basso e crea una "Web App". Firebase ti darà un pezzo di configurazione contenente `apiKey`, `projectId`, ecc. Questi andranno nelle tua variabili `VITE_FIREBASE_...`.
4. **Chiavi di Amministrazione (Server-Side Firebase)**: Per permettere al backend (Express) di scrivere su Firebase, vai in **Impostazioni progetto > Account di servizio**. Clicca "Genera nuova chiave privata". Ti scaricherà un file JSON. I dati di questo JSON vanno in una singola variabile d'ambiente chiamata `FIREBASE_SERVICE_ACCOUNT_KEY` (per la tua app backend).

---

## 3. Preparazione di MySQL su Aruba

Dato che il tuo database MySQL vive sull'infrastruttura di Aruba (`31.11.38.16` / `Sql1906971_1`), **Vercel (o qualsiasi altro server esterno) deve avere il permesso di parlargli.**

**Il blocco Aruba:** Spesso gli hosting condivisi di Aruba *bloccano* le connessioni al database provenienti da IP esterni per ragioni di sicurezza.
Prima del deploy, è FONDAMENTALE che tu acceda al pannello di controllo MySQL di Aruba:
- Verifica che le **Connessioni esterne (o Remote SQL)** siano abilitate.
- A volte è necessario definire gli IP autorizzati. Se Aruba lo richiede e tu sei su Vercel (che usa IP dinamici), potresti dover autorizzare l'Host globale `%` (tutti gli IP) per l'utente MySQL specifico.

---

## 4. Deploy su Vercel Passo per Passo

Per pubblicare il sito e collegarlo al dominio `www.bookping.it`:

### Passo A: Prendi il Codice
1. Dalle impostazioni in alto a destra qui su AI Studio, esporta il tuo progetto. Puoi **Esportare come ZIP** (e usare un tuo terminale per inviarlo a GitHub) oppure puoi cliccare su **Condivisione > Push to GitHub** (creerà una repo per te).

### Passo B: Importa in Vercel
1. Vai su [Vercel.com](https://vercel.com) e accedi (o registrati usando GitHub).
2. Clicca su **Add New Project**.
3. Collega il tuo account GitHub e seleziona il repository in cui hai appena salvato il progetto.

### Passo C: Configura le Variabili (.env)
Prima di cliccare "Deploy", vedrai una sezione chiamata **Environment Variables**. Qui devi incollare TUTTE le chiavi necessarie (ignorando il commento, per Vercel servono solo Nome e Valore):

* Variabili Backend Node:
  - `DB_HOST` = `31.11.38.16`
  - `DB_NAME` = `Sql1906971_1`
  - `DB_USER` = `Sql1906971`
  - `DB_PASS` = `[tua_password_aruba]`
  - `FIREBASE_DATABASE_ID` = `[id_database_firestore]` (OPZIONALE: Incolla l'id del tuo database Firestore, ad esempio quello che vedi nel file `firebase-applet-config.json` se desideri mantenere il medesimo database, oppure lascialo vuoto per far sì che Vercel punti automaticamente all'istanza standard di Firestore chiamata `(default)`).
  - `FIREBASE_SERVICE_ACCOUNT_KEY` = `{ "type": "service_account", "project_id": "..." }` (L'intero JSON della chiave privata Firebase generato ed incollato su un'unica riga).
* Variabili Frontend (React/Vite):
  - Inserisci tutte quelle che iniziano con `VITE_FIREBASE_...` ottenute dalla console Firebase web.

### Passo D: Come Funziona il Serverless Routing (Sotto il Cofano)
La nostra applicazione è configurata per funzionare nativamente su Vercel Serverless senza alcun aggiustamento manuale:
- Il file `vercel.json` reindirizza dinamicamente tutte le richieste all'endpoint `/api/*` verso `api/handler.cjs`.
- Durante la compilazione, esbuild impacchetta il server TypeScript in un unico file bundle CommonJS compresso situato in `dist/server.cjs`. Il wrapper `handler.cjs` lo esegue sulla piattaforma serverless di Vercel, eliminando i problemi di percorso tipici dei moduli ES.
- Le pagine del frontend sono compilate in file statici pronti per la CDN di Vercel, garantendo caricamenti istantanei da ogni parte del mondo.

### Passo E: Avvia il Deploy
1. Clicca sul tastino blu **Deploy**.
2. Vercel installerà i pacchetti (npm install), eseguirà il build (`npm run build`) e manderà online l'app. Avrai un link temporaneo funzionante (es. `animalhub.vercel.app`).

---

## 5. Allacciare il Dominio personalizzato (www.bookping.it)

Ora che l'app gira su Vercel in modo perfetto, andiamo a re-indirizzarla sul tuo dominio ufficiale.

1. In Vercel, dalla dashboard del tuo progetto appena pubblicato, clicca in alto su **Settings** (Impostazioni).
2. Nel menu a sinistra seleziona **Domains**.
3. Nel campo input scrivi `www.bookping.it` e clicca **Add**.
4. Vercel analizzerà che il dominio non è attualmente in suo possesso. Ti mostrerà delle istruzioni DNS a schermo (es. _"Imposta un record CNAME che punta a `cname.vercel-dns.com`"_ oppure un IP per il record A).
5. Ora, apri una nuova scheda e accedi al **Pannello DNS di Aruba** per il tuo dominio `bookping.it`.
6. Cerca "Gestione DNS".
7. Modifica (o crea) il **Record A** (se hai messo `bookping.it` senza www) per puntare all'IP dato da Vercel, oppure modifica il **Record CNAME** per la voce `www` per puntare a `cname.vercel-dns.com`.
8. Salva sul pannello Aruba.
9. **Attendi**: I DNS possono richiedere dai 5 minuti alle canoniche 24h per propagarsi nel mondo. Su Vercel vedrai lo stato del dominio passare su "Valid" con un badge verde non appena la verifica andrà a buon fine. Vercel attiverà in automatico e gratuitamente anche il certificato SSL HTTPS (il lucchetto verde).
