# Proposta di Adozione: Piattaforma "AnimalHub PA"

## 1. Introduzione e Visione
**AnimalHub PA** è una piattaforma digitale innovativa progettata per gli Enti Locali e i Comuni, volta a digitalizzare, semplificare e rendere trasparente la gestione del benessere animale sul territorio. La soluzione funge da ponte tra la cittadinanza attiva (che può effettuare segnalazioni geolocalizzate) e gli operatori comunali, i veterinari e la polizia locale (che gestiscono l'intero ciclo di vita dell'intervento).

L'obiettivo principale è fornire all'Ente uno strumento "chiavi in mano" per il monitoraggio del randagismo, il soccorso di animali feriti e la gestione dell'anagrafe degli animali d'affezione.

---

## 2. Architettura Tecnica e Tecnologie Utilizzate
La piattaforma adotta un'architettura **Full-Stack moderna, sicura e scalabile**, suddivisa in strati applicativi ben definiti per garantire prestazioni elevate e manutenibilità.

### 2.1. Frontend (Interfaccia Utente)
- **Framework Core**: Sviluppato in **React 18** con **TypeScript**, per garantire interfacce utente dinamiche, sicure e prive di errori a runtime.
- **Tooling e Build**: **Vite**, che assicura tempi di caricamento istantanei e un'ottimizzazione avanzata del bundle.
- **Styling UI/UX**: **Tailwind CSS**. L'interfaccia è completamente *responsive*, accessibile (WCAG) e ottimizzata per l'uso "Mobile First" da parte dei cittadini direttamente in strada.
- **Cartografia e GIS**: Il modulo mappa (fondamentale per le segnalazioni e il tracking) è basato su **Leaflet** e OpenStreetMap, fornendo rendering cartografico fluido e supporto per clusterizzazione dei marcatori.
- **Iconografia**: **Lucide React**, per una veste grafica istituzionale, pulita e minimale.
- **Animazioni**: **Motion (Framer Motion)** per fornire un feedback visivo elegante e moderno durante la navigazione e il caricamento dei moduli.

### 2.2. Backend (Logica di Servizio e API)
- **Runtime**: **Node.js** con web server **Express**, configurato per servire sia l'applicazione frontend compilata, sia le API REST.
- **Integrazione API**: Gestione sicura del flusso dati Server-Side, per mantenere nascoste le credenziali e implementare logiche di validazione robuste.
- **Real-Time Middleware**: Architettura reattiva in ascolto degli eventi per l'aggiornamento automatico dei cruscotti operativi.

### 2.3. Database e Persistenza Dati
La piattaforma adotta un approccio **ibrido e ridondante**:
1. **Primary Database (Relazionale)**: **MySQL** (collegato tramite il layer `mysql2/promise`) per lo stoccaggio persistente e robusto delle segnalazioni, per l'integrità referenziale dei dati degli utenti e dei log di sistema (Modulo B & C).
2. **Fallback / Local Dev**: **SQLite** integrato automaticamente in caso di irreperibilità del demone MySQL primario, garantendo l'uptime del servizio operativo.
3. **Database Real-Time**: **Firebase Firestore**. Sincronizzato con il backend relazionale per "spingere" (push) gli aggiornamenti istantanei sulla cartografia e sulle dashboard degli operatori senza necessità per gli utenti di ricaricare le pagine.

---

## 3. Moduli della Piattaforma (Ramo Cittadini)
Questi strumenti sono esposti al pubblico, accessibili da smartphone e ottimizzati per la facilità d'uso.

- **Wizard Segnalazioni (Multi-Step)**: Un percorso guidato che permette al cittadino di compilare una segnalazione di:
  - Posizione esatta tramite GPS o ricerca su mappa.
  - Caratteristiche dell'animale (specie, condizioni mediche/comportamentali).
  - Dati personali per ricontatto (con consenso Privacy GDPR esplicito).
  - Gestione documentale (Scatto e caricamento foto).
- **Mappa Pubblica del Territorio**: Visualizzazione in tempo reale dello stato delle segnalazioni pubbliche sul territorio, per evitare segnalazioni duplicate.
- **La Mia Area**: Cruscotto personale del cittadino per visualizzare lo stato di avanzamento della propria segnalazione.

---

## 4. Moduli Gestionali (Ramo Operatori / Admin)
Area riservata e protetta da autenticazione forte, destinata al personale dell'Ente, Polizia Locale, ASL Veterinaria e Volontari accreditati.

- **Modulo B - Cruscotto Operativo Ticketing**:
  - Accesso in tempo reale a tutte le segnalazioni inoltrate dai cittadini (grazie a Firestore e MySQL).
  - Flusso di assegnazione (assegnazione ente di competenza: Polizia, Canile, Veterinario).
  - Tabellone cronologico con aggiornamento degli stati (Aperta, In Lavorazione, Chiusa, Falso Allarme).
  - Storico Log ("Audit Trail") di ogni singola azione sull'intervento, indispensabile per trasparenza e finalità legali.

- **Modulo C - Archivio Anagrafico Digitale (Anagrafe Canina/Felina)**:
  - Sincronizzazione con il database anagrafico per il lookup rapido di animali microchippati.
  - Gestione di proprietari, registrazioni chip e note mediche. Fondamentale per identificare animali smarriti.

- **Modulo Configurazione Ente (White-Label)**:
  - Funzionalità integrata per l'amministratore di sistema dell'Ente che consente di modificare dinamicamente il **Nome dell'Ente** e l'**URL del Logo Istituzionale**.
  - Queste personalizzazioni vengono salvate nel database (tabella `admin_config`) ed ereditate dinamicamente dall'intera interfaccia pubblica o privata.

---

## 5. Sicurezza e Conformità (Compliance)
- **Privacy Policy e Cookie Policy**: La piattaforma gestisce i consensi preventivi.
- **Conformità GDPR**: Dati personali disaccoppiati (dove necessario) dai dati pubblici delle segnalazioni. La cancellazione o modifica su richiesta è gestibile da database centrale MySQL.
- **Accessibilità**: I contrasti cromatici, gli spazi di tap (touch targets su mobile) e i design pattern sono disegnati seguendo le indicazioni WCAG (Web Content Accessibility Guidelines) in modo da rendere il servizio fruibile da tutte le fasce della popolazione.

---

## 6. Vantaggi Strategici per l'Adozione
1. **Digitalizzazione del "Costumer Service" Cittadino**: Eliminazione delle code al centralino o documentazione cartacea persa; tutto è centralizzato in un unico codice di tracking.
2. **Ottimizzazione Risorse Economiche**: Interventi mirati e tracciati. Il sistema evita sovrapposizioni di pattuglie o enti sulla stessa segnalazione.
3. **Statistiche e Reportistica**: Dati quantitativi estraibili su base geolocalizzata per prevenire focolai di randagismo o maltrattamenti.
4. **Indipendenza Infrastrutturale**: La scelta del database MySQL combinata a NodeJS rende l'architettura compatibile sia con infrastrutture cloud europee (Cloud Run/AWS) che con farm on-premise su server comunali.

---

Questa architettura moderna e componibile qualifica **AnimalHub PA** non solo come una vetrina, ma come un solido Sistema Gestionale per la digitalizzazione delle operations comunali in ambito tutela e cura del territorio.
