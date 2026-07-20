# Manuale Operativo e Tecnico - Piattaforma AnimalHub PA

Questo documento fornisce una panoramica strutturata della piattaforma **AnimalHub PA**. È suddiviso in due sezioni principali: una tecnica dedicata agli sviluppatori e una operativa dedicata agli utenti di sistema (Amministratori, Operatori comunali e Cittadini).

---

## 1. Guida per Sviluppatori (Technical Overview)

La piattaforma è un'applicazione full-stack costruita con **React (Vite)** sul frontend e **Node.js (Express)** sul backend, interfacciata con un database relazionale **MySQL (MariaDB)** e un database NoSQL real-time **Firestore** per la gestione della mappa interattiva.

### 1.1 Architettura Multi-Tenancy ed Isolamento Logico
La piattaforma supporta più comuni simultaneamente con isolamento logico dei dati tramite la colonna `comune_key`:
- **Isolamento Relazionale:** Ogni record (segnalazione, anagrafica, adozione, fattura, convenzione) ha un attributo `comune_key` (es. `'naro'`, `'agrigento'`). Tutte le query SQL del backend filtrano i dati sulla base del comune corrente o di quello associato all'operatore loggato.
- **Isolamento Firestore:** Ciascun record memorizzato su Firestore include il campo `comuneKey`. Il client applica un filtraggio in memoria basato sulla selezione locale del comune per garantire un rendering dei marker istantaneo e reattivo.
- **Configurazione Dinamica:** Le configurazioni territoriali e di geofencing (es. coordinate geografiche e raggio del comune) sono caricate a runtime dalla tabella `comuni`.

### 1.2 Compilazione e Routing Serverless (Vercel Integration)
Per supportare in modo ottimale il deploy serverless di un server Express senza incorrere nelle rigide limitazioni delle importazioni dei moduli ES nativi su Node.js:
1. **Compilazione esbuild:** Durante il processo di build (`npm run build`), esbuild compila il server TypeScript (`server.ts`) in un unico pacchetto bundle CommonJS situato in `dist/server.cjs`.
2. **Punto d'Ingresso Vercel:** Il file `vercel.json` instrada tutte le richieste `/api/*` verso il serverless function wrapper `api/handler.js`, che a sua volta carica ed esegue il file compilato `dist/server.cjs`.
3. **SPA Fallback:** Tutte le altre rotte non API vengono reindirizzate su `index.html` per permettere al client React di gestire il routing in modalità SPA (Single Page Application).

### 1.3 Gestione Variabili d'Ambiente e Connessione Firestore
- **FIREBASE_DATABASE_ID** (o `VITE_FIREBASE_DATABASE_ID`): Identifica il database ID di Firestore da utilizzare. In Sandbox (AI Studio), punta al database isolato e personalizzato fornito nel file di configurazione locale. In produzione (Vercel), se non specificato, cade in modalità fallback sul database standard `(default)`.
- **FIREBASE_SERVICE_ACCOUNT_KEY**: Stringa JSON compressa su una singola riga contenente la chiave privata dell'account di servizio Firebase. Consente al backend Express di effettuare modifiche autorizzate su Firestore. Se assente (es. in ambienti locali senza credenziali), l'applicazione salta l'inizializzazione del modulo `firebase-admin` in modo difensivo per prevenire crash bloccanti.

---

## 2. Guida Operativa (Functional Overview)

Questa sezione è destinata a chi gestisce i portali amministrativi o interagisce con il sistema in veste di cittadino o operatore comunale.

### 2.1 Gestione Ruoli e Profilazione Utenti
Gli operatori comunali accedono tramite credenziali riservate e sono categorizzati secondo 4 livelli di accesso:
1. **ADMIN (Amministratore di Sistema):** Accesso completo alla dashboard KPI complessiva, configurazione dei tariffari comunali, emissione e validazione delle fatture PA, caricamento dei contratti di convenzione e modifica delle impostazioni geografiche ed anagrafiche dei comuni attivi.
2. **POLIZIA LOCALE:** Ruolo operativo sul campo. Può visualizzare e aggiornare le segnalazioni di randagismo, assegnare codici tracking, firmare e chiudere verbali di intervento o procedere alla fusione di segnalazioni duplicate.
3. **CANILE SANITARIO / VET:** Responsabile del benessere degli animali. Gestisce il registro anagrafico canino/felino (inserimento microchip, stato di salute, foto), programma calendari d'intervento sanitari (sterilizzazione, cure) e controlla la capienza e postazioni occupate delle strutture.
4. **VOLONTARI:** Operatori di supporto convenzionati con il comune per attività di ricognizione, censimento e stallo temporaneo degli animali adottabili.

### 2.2 Moduli Funzionali Principali

#### 2.2.1 Area Cittadino (Accesso con OTP)
I cittadini possono accedere al portale pubblico per presentare segnalazioni geolocalizzate certificate:
- **Autenticazione OTP:** Per accedere in modo sicuro, il cittadino inserisce la propria email e riceve un codice OTP temporaneo inviato o mostrato a schermo. L'accesso viene registrato in `citizen_access_logs`.
- **Invio Segnalazioni:** Compilando il modulo interattivo, il cittadino descrive le condizioni dell'animale, seleziona la specie, imposta il livello di urgenza, scatta/carica una foto e seleziona il punto esatto sulla mappa GPS (con geofencing restrittivo che verifica l'appartenenza geografica delle coordinate al territorio del comune).

#### 2.2.2 Gestione Segnalazioni e Fusione Duplicati
- **Modifiche di Stato:** Una segnalazione transita negli stati `CREATA` -> `IN_CARICO` -> `IN_INTERVENTO` -> `RISOLTA` / `CHIUSA`.
- **Fusione Duplicati (FUSA):** Se più cittadini segnalano lo stesso animale nello stesso punto, gli operatori possono fondere le segnalazioni duplicate in un'unica attività principale per evitare di frammentare i registri. La segnalazione duplicata assume lo stato `FUSA`.

#### 2.2.3 Gestione Pratiche di Adozione (`adozioni`)
Gestione digitale del ciclo di affido e adozione definitiva. Gli operatori registrano l'anagrafica del richiedente (incluso Codice Fiscale, recapiti e residenza), collegano la pratica al microchip dell'animale registrato e ne aggiornano lo stato (`IN_VALUTAZIONE`, `APPROVATA`, `COMPLETATA`). All'approvazione, lo stato dell'animale nel registro passa automaticamente ad `ADOTTATO`.

#### 2.2.4 Monitoraggio Strutture e Convenzioni
- **Strutture:** Tracciamento della capienza massima e dei posti occupati in tempo reale all'interno di canili, gattili e rifugi convenzionati.
- **Convenzioni:** Archivio digitale dei contratti stipulati tra la PA e le strutture esterne, con tracciamento degli importi annui impegnati, degli atti di delibera comunali e delle scadenze temporali.

#### 2.2.5 Contabilità, Tariffario e Fatturazione Elettronica
Modulo dedicato alla trasparenza e rendicontazione finanziaria dei servizi sanitari per il randagismo:
- **Tariffario PA:** Gestione dei costi standard concordati per singolo comune (es. costo per giornata di ricovero in canile, quota sterilizzazione, tariffa cattura).
- **Voci di Costo (`costi_voci`):** Generazione automatica o manuale delle spese relative a ciascun intervento sul territorio associando il microchip o il codice tracking.
- **Fatture PA:** Raggruppamento e consolidamento delle voci di costo non ancora fatturate per emettere fatture elettroniche PA munite di codici ministeriali obbligatori quali **CIG** (Codice Identificativo Gara) e **CUP** (Codice Unico Progetto) per la liquidazione da parte della tesoreria comunale.

#### 2.2.6 Sicurezza e Log di Sistema (Access Tracking)
Per prevenire frodi, accessi abusivi e tracciare la responsabilità delle azioni svolte:
- **admin_access_logs:** Traccia ogni login (riuscito o fallito) sui portali amministrativi, registrando IP, User Agent, username e data.
- **citizen_access_logs:** Monitora l'accesso pubblico dei cittadini tramite OTP.
- **visitor_tracking_logs:** Rileva la telemetria di consultazione (pagine visitate, referral e comune prescelto) per fini statistici e di performance.

---

## 3. Best Practices di Manutenzione

1. **Sicurezza delle Connessioni Esterne:** Non inserire password in chiaro nel codice sorgente. Se il database MySQL si trova su Aruba, abilitare l'accesso remoto nel pannello di controllo Aruba MySQL autorizzando le connessioni in ingresso o impostando regole di firewalling adeguate.
2. **Coerenza tra Database e Frontend:** Quando si introducono nuovi campi nel database relazionale, ricordarsi di aggiornare il file `initialize_reference_tables.sql` per preservare l'integrità dei dati demo installati durante il bootstrap dell'applicazione.
3. **Verifica Permessi Firestore:** Monitorare sempre le regole in `firestore.rules` ed effettuare test periodici sulle chiamate API per scongiurare eccezioni dovute a permessi insufficienti o a disallineamenti dell'ID del database.

