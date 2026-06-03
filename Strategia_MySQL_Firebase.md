# Strategia Architetturale: MySQL + Firebase

Questa architettura ibrida massimizza le performance e riduce i costi, unendo la solidità relazionale di MySQL (master data) con la reattività in tempo reale di Firebase Firestore (presentazione real-time).

## 1. Connessione al Database MySQL esterno (Aruba)

Per connettere il backend (in esecuzione su Google Cloud Run / AI Studio con Node.js) al database MySQL ospitato su Aruba, adottiamo la seguente strategia:

### Librerie Consigliate in Node.js
- **`mysql2`**: La libreria standard e più performante per connettersi a MySQL da Node.js. Al contrario del vecchio `mysql`, supporta nativamente le **Promises** (`mysql2/promise`), facilitando l'uso di `async/await`.
- **Connection Pool**: Invece di aprire e chiudere una connessione singola ad ogni richiesta, viene creato un `Pool` di connessioni all'avvio del server. Questo è essenziale per gestire molteplici richieste simultanee tipiche di un'app server, evitando il sovraccarico di handshake TCP verso Aruba.
- **Variabili d'ambiente (.env)**: Le credenziali (Host, Database, User, Password) **non devono mai** risiedere nel codice sorgente (`server.ts`). Vengono fornite esclusivamente tramite variabili d'ambiente.

### Sicurezza e Interazione
- **Prepared Statements / Parameterized Queries**: Usando i metodi messi a disposizione da `mysql2` (es. tramite il simbolo `?`), ci difendiamo automaticamente dalle SQL Injection, poiché i dati vengono separati logicamente dalla query.
- **Whitelist IP su Aruba**: Da notare che alcuni server MySQL condivisi su Aruba potrebbero bloccare connessioni esterne. Assicurarsi dal pannello Aruba che l'IP del backend o le connessioni da remoto (wildcard `%` se permesso) siano abilitate per l'utente del database.

## 2. Flusso di Inserimento Dati (Post Segnalazione)

Quando un utente inserisce una segnalazione dal Frontend React, il flusso è il seguente:

1. **Frontend**: Invia una POST request asincrona a `/api/segnalazioni` con il Payload (fotografia e metadati) sul backend.
2. **Backend (Node.js)**:
   - Riceve la richiesta.
   - Formula la query di `INSERT INTO segnalazioni (...) VALUES (?, ?, ...)`.
   - Esegue la query su **MySQL (Aruba)** usando il Pool.
   - Se inserita con successo, riprende l'ID generato automaticamente (`insertId`).
3. **Sincronizzazione Firebase (Real-time)**:
   - Immediatamente dopo aver ottenuto l'`insertId` di MySQL, il backend crea un Documento ridotto in **Firestore**.
   - Firestore contiene solo i dati necessari al frontend per renderizzare i "pin" sulla mappa istantaneamente senza far pollare MySQL: ID relazionale, latitudine, longitudine, specie.
4. **Risposta Frontend**: Il server risponde OK. La Mappa React ascolta i cambiamenti da Firestore e fa apparire il nuovo marker in tempo reale.

## 3. Gestione Fallback e Continuità
Nel codice fornito in `server.ts` viene definita una strategia ibrida: 
- Se le variabili `DB_HOST`, `DB_USER` sono presenti nel sistema, il backend si aggancia al vero database Aruba tramite `mysql2`.
- Altrimenti (es. in ambienti di anteprima non configurati o in caso di errore), sfrutta un fallback locale (`sqlite3`) per assicurarsi che l'app funzioni per il test dell'interfaccia.
