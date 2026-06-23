# Manuale Operativo e Tecnico - Piattaforma AnimalHub PA

Questo documento fornisce una panoramica strutturata della piattaforma **AnimalHub PA**. È suddiviso in due sezioni principali: una tecnica dedicata agli sviluppatori e una operativa dedicata agli utenti di sistema (Admin e Operatori comunali).

---

## 1. Guida per Sviluppatori (Technical Overview)

La piattaforma è un'applicazione full-stack costruita con React (Vite) sul frontend e Node.js (Express) sul backend, con database MySQL (MariaDB).

### 1.1 Architettura Multi-Tenancy
La piattaforma adotta un approccio basato sulla configurazione dinamica per supportare più comuni.
- **Identificazione Comune:** Il comune attivo è determinato dalla chiave memorizzata nella tabella `admin_config` con `key_name = 'activeComune'`.
- **Backend (`server.ts`):** Tutte le route API recuperano dinamicamente la chiave del comune corrente tramite la funzione `getActiveComune()` per filtrare le query al database.
- **Database:** Tutte le tabelle che gestiscono dati comunali (segnalazioni, adozioni, strutture, convenzioni, etc.) contengono una colonna `comune_key` che funge da discriminante per garantire l'isolamento dei dati.

### 1.2 Database e Schema
- **Schema:** Le tabelle principali utilizzano `comune_key` come colonna obbligatoria per le query.
- **Modifiche Schema:** Ogni modifica allo schema deve riflettersi in tutte le clausole `WHERE comune_key = ?` nelle query SQL del backend.

### 1.3 Configurazione e Setup
- **Variabili d'ambiente:** Definire le variabili nel file `.env.example`.
- **Deploy:** Seguire le procedure standard per la pipeline CI/CD configurata via Cloud Run.
- **Multi-tenant isolation:** Assicurarsi che qualsiasi nuova funzionalità o tabella aggiunta includa il supporto alla `comune_key`.

---

## 2. Guida Operativa (Functional Overview)

Questa sezione è destinata agli utenti che interagiscono con l'interfaccia di amministrazione.

### 2.1 Ruoli e Permessi
1. **ADMIN:** Accesso completo. Può configurare le impostazioni di sistema, gestire convenzioni, fatture e cambiare le impostazioni del comune attivo.
2. **POLIZIA LOCALE / CANILE SANITARIO:** Accesso operativo. Possono visualizzare le segnalazioni, caricare log di intervento, gestire pratiche di adozione e monitorare le strutture.
3. **VOLONTARI:** Accesso di sola consultazione o creazione segnalazioni (a seconda della configurazione).

### 2.2 Funzioni Principali
- **Gestione Segnalazioni:** Gli operatori possono creare, aggiornare lo stato (NUOVA, IN_CARICO, INTERVENTO, VALIDATA, CHIUSA, FUSA) e aggiungere log alle segnalazioni.
- **Fusione Segnalazioni (Duplicati):** È possibile fondere segnalazioni duplicate in un'attività principale. La segnalazione duplicata assume lo stato `FUSA`.
- **Adozioni:** Gestione completa delle scartoffie e dei log relativi alle pratiche di adozione (Affido Temporaneo o Adozione Definitiva).
- **Strutture e Convenzioni:** Monitoraggio dei canili, gattili e accordi contrattuali tra il comune e le strutture sanitarie.

### 2.3 Gestione del Comune (Amministrazione)
L'amministratore può, attraverso il pannello di controllo, aggiornare la `activeComune` configurazione, che imposta il contesto di tutti i dati visualizzati (segnalazioni, adozioni, strutture) per il comune corretto.

---

## 3. Best Practices di Manutenzione

### 3.1 Sicurezza
- Non hardcodare mai nomi, loghi o riferimenti a specifici comuni nel frontend o backend. Utilizzare sempre le configurazioni caricate dinamicamente dal database.

### 3.2 Evoluzione del Codice
- Per aggiungere un nuovo comune: inserire i dati di configurazione nella tabella `admin_config` e preparare le tabelle con i dati corretti filtrati per la nuova `comune_key`.
- In caso di errori, controllare sempre i log del server e la correttezza della `comune_key` nelle query SQL.
