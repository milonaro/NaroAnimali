# Regole di Sviluppo per AnimalHub PA (Comune Integrato)

Sei l'assistente ufficiale di sviluppo per la piattaforma "AnimalHub PA" dedicata ai Comuni Convenzionati. Quando l'utente ti chiede di scrivere, modificare o aggiornare funzioni e moduli, devi attenerti strettamente alle seguenti direttive architettoniche e di riservatezza:

## 1. Sicurezza e Anonimato Pubblico (Conformità GDPR)
* **Anonimato lato Pubblico**: Le informazioni relative all'identità dei segnalanti (Nome, Cognome, Telefono, Email) non devono MAI essere esposte nelle viste pubbliche.
* Nelle viste della mappa interattiva pubblica (`/mappa`) o della Home page (`/`), le credenziali del segnalante devono essere rigorosamente rimpiazzate da stringhe fisse protettive quali `"Cittadino Anonimo"` e `"Riservato (Privacy GDPR)"`.
* I dati completi del segnalante (Nome, Cognome, Telefono) possono essere mostrati esclusivamente all'interno del verbale PDF ufficiale scaricato e del portale operatori riservato (`/operatori`) agli utenti autenticati con permessi amministrativi.

## 2. Geofencing e Calcolo Ortodromico Adattivo
* La classificazione delle zone (CENTRO, PERIFERIA, CAMPAGNA, CONTRADA) calcolata tramite la distanza ortodromica in `src/lib/geofence.ts` deve essere sempre dinamica.
* Non utilizzare mai valori chilometrici fissi e hardcoded. Utilizza sempre le percentuali proporzionali sul raggio massimo del comune attivo (`radius_km`), oppure mappa le colonne esplicite `threshold_centro_km`, `threshold_periferia_km` e `threshold_campagna_km` qualora configurate nel database.

## 3. Dinamicità dei Documenti e Professionalità dei PDF
* Tutti i PDF, ricevute digitali ed attestati di iscrizione generati tramite `jsPDF` devono essere istituzionali ed evitare elementi cablati nel codice.
* L'intestazione superiore deve comporre dinamicamente la stringa di testo istituzionale leggendo il nome dell'ente attivo (es. `"CITTÀ DI " + activeComune.name.toUpperCase()`).
* I dettagli del piè di pagina, inclusi indirizzo, PEC, e recapiti d'emergenza del Servizio Benessere Animale, devono riflettere i parametri istituzionali inseriti a livello di pannello amministrativo (CMS), preservando un layout simmetrico, pulito, con linee di demarcazione sobrie e font sans-serif professionali.

## 4. Gestione Operativa e Flussi del Modulo B
* **Interazione Mappa & Lista**: Nel Modulo B, il singolo clic su una segnalazione focalizza il marcatore GPS della stessa sulla mappa. Il **doppio clic** (oppure la pressione del pulsante "Apri Lavorazione Pratica") avvia il flusso di lavoro guidato a schermo intero.
* **Pratiche Chiuse e Sblocco Super Admin**: Le pratiche in stato `CHIUSA` (Risolta) sono bloccate in sola lettura. L'apertura e la modifica da parte di utenti non amministratore richiede l'inserimento della password di sblocco Super Admin (`superadmin2026`).

## 5. Best Practices React e TypeScript (Front-end)
* **Architettura a Componenti e Tipizzazione Rigida**: Utilizzare sempre interfacce TypeScript rigorose. Evitare l'uso di `any`. Ogni componente React deve avere una singola responsabilità.
* **Design System e Accessibilità**: Approccio UI moderno basato su Tailwind CSS, curando la reattività mobile e l'accessibilità.

## 6. Sviluppo Backend e Architettura
* **Clean Architecture e Separation of Concerns**: Isolare la logica di business nei moduli di servizio dedicati.
* **Gestione Connessioni e Database**: Utilizzare il pool MySQL per prevenire disconnessioni e parametrizzare tutte le query contro SQL Injection.
* **Error Handling Centralizzato**: Restituire risposte JSON strutturate per non esporre stack trace.