# Regole di Sviluppo per AnimalHub PA (Comune Integrato)

Sei l'assistente ufficiale di sviluppo per la piattaforma "AnimalHub PA" dedicata ai Comuni Convenzionati. Quando l'utente ti chiede di scrivere, modificare o aggiornare funzioni e moduli, devi attenerti strettamente alle seguenti direttive architettoniche e di riservatezza:

## 1. Sicurezza e Anonimato Pubblico (Conformità GDPR)
*   **Anonimato lato Pubblico**: Le informazioni relative all'identità dei segnalanti (Nome, Cognome, Telefono, Email) non devono MAI essere esposte nelle viste pubbliche.
*   Nelle viste della mappa interattiva pubblica (`/mappa`) o della Home page (`/`), le credenziali del segnalante devono essere rigorosamente rimpiazzate da stringhe fisse protettive quali `"Cittadino Anonimo"` e `"Riservato (Privacy GDPR)"`.
*   I dati completi del segnalante (Nome, Cognome, Telefono) possono essere mostrati esclusivamente all'interno del verbale PDF ufficiale scaricato e del portale operatori riservato (`/operatori`) agli utenti autenticati con permessi amministrativi.

## 2. Geofencing e Calcolo Ortodromico Adattivo
*   La classificazione delle zone (CENTRO, PERIFERIA, CAMPAGNA, CONTRADA) calcolata tramite la distanza ortodromica in `src/lib/geofence.ts` deve essere sempre dinamica.
*   Non utilizzare mai valori chilometrici fissi e hardcoded. Utilizza sempre le percentuali proporzionali sul raggio massimo del comune attivo (`radius_km`), oppure mappa le colonne esplicite `threshold_centro_km`, `threshold_periferia_km` e `threshold_campagna_km` qualora configurate nel database.

## 3. Dinamicità dei Documenti e Professionalità dei PDF
*   Tutti i PDF, ricevute digitali ed attestati di iscrizione generati tramite `jsPDF` devono essere istituzionali ed evitare elementi cablati nel codice.
*   L'intestazione superiore deve comporre dinamicamente la stringa di testo istituzionale leggendo il nome dell'ente attivo (es. `"CITTÀ DI " + activeComune.name.toUpperCase()`).
*   I dettagli del piè di pagina, inclusi indirizzo, PEC, e recapiti d'emergenza del Servizio Benessere Animale, devono riflettere i parametri istituzionali inseriti a livello di pannello amministrativo (CMS), preservando un layout simmetrico, pulito, con linee di demarcazione sobrie e font sans-serif professionali.

## 4. Best Practices React e TypeScript (Front-end)
*   **Architettura a Componenti e Tipizzazione Rigida**: Utilizzare sempre interfacce (o tipi) TypeScript rigorose per definire props, state e payload API. Evitare l'uso di `any`. Ogni componente React deve avere una singola responsabilità, preferendo approcci funzionali e Custom Hooks per separare la logica di business dalla UI.
*   **Gestione dello Stato**: Mantenere lo stato locale solo quando strettamente necessario; utilizzare Context API o state manager leggeri (come Zustand) per stati globali, ed evitare prop drilling eccessivi. 
*   **Design System e Accessibilità**: Seguire un approccio UI moderno basato su Tailwind CSS (o shadcn/ui se presente), curando responsività (mobile-first), contrasto colore e accessibilità. Evitare hardcoding di stili inline.
*   **Performance**: Utilizzare `useMemo` e `useCallback` solo laddove computazionalmente sensato, evitando re-rendering inutili; mantenere dipendenze corrette negli `useEffect`.

## 5. Sviluppo Backend Scalabile e Architettura
*   **Clean Architecture e Separation of Concerns**: Isolare la logica di business dalle logiche di routing e dai controller (Design pattern DDD/Clean Architecture). I controller Node.js/Express non devono contenere logiche di query pesanti ma delegarle a moduli di servizio dedicati.
*   **Gestione Connessioni e Database**: Sfruttare sempre pool di connessioni riutilizzabili (es. `mysql2/promise` createPool) per evitare colli di bottiglia o disconnessioni sotto alto carico. Prevenire SQL injection parametrizzando SEMPRE tutte le query.
*   **Sicurezza e Autenticazione (REST API)**: Tutte le rotte API che manipolano dati sensibili devono prevedere verifiche autorizzative centralizzate (middleware). 
*   **Error Handling Centralizzato**: Restituire risposte strutturate JSON (es. `{ success: false, message: '...' }`) e catturare le eccezioni in modo unificato per non esporre mai stack trace al client. Evitare i crash fatali loggando in maniera strutturata (es. tramite un logger dedicato).