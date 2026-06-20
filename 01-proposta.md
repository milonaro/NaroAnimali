AL SIG. SINDACO
Dott. Melchiorre Milco Dalacchi
Comune di Naro — Libero Consorzio Comunale di Agrigento
PEC: protocollo.comune.naro@pec.it






PROPOSTA DI ADOZIONE
AnimalHub PA
Piattaforma istituzionale per il censimento
e la gestione degli animali randagi
React 18 + Node.js  •  MySQL Aruba Italia  •  Firebase Real-Time  •  WCAG 2.1 AA  •  GDPR Compliant  •  Mobile First

Naro (AG), Giugno 2026 — Versione 5.0
Trasmessa a mezzo PEC: protocollo.comune.naro@pec.it


Oggetto: Proposta di adozione della piattaforma AnimalHub PA per il censimento e la gestione degli animali randagi — ai sensi della L. 281/1991 e della L.R. Sicilia n. 15/2000.
Destinatario: Sindaco del Comune di Naro, Dott. Melchiorre Milco Dalacchi — Piazza Giuseppe Garibaldi, 1 — 92028 Naro (AG)
Codice Fiscale Comune: 82000070845 — Codice ISTAT: 084026



1. Introduzione e Visione


Con la presente proponiamo all’Amministrazione comunale di Naro l’adozione di AnimalHub PA, una piattaforma digitale innovativa progettata per gli Enti Locali, volta a digitalizzare, semplificare e rendere trasparente la gestione del benessere animale sul territorio. La soluzione funge da ponte tra la cittadinanza attiva — che può effettuare segnalazioni geolocalizzate direttamente dallo smartphone — e gli operatori comunali, i veterinari e la Polizia Locale, che gestiscono l’intero ciclo di vita dell’intervento.
Il Comune di Naro, con i suoi circa 6.800 abitanti su una superficie di 207 km² — seconda estensione del Libero Consorzio Comunale di Agrigento — e con un territorio che confina con undici comuni della provincia, presenta caratteristiche che rendono particolarmente strategico uno strumento di monitoraggio capillare e coordinato.

Riferimento Normativo
Contenuto
Obbligo per il Comune di Naro
L. 14 agosto 1991, n. 281
Legge quadro sul randagismo
Censimento, gestione canili, piani di controllo
L.R. Sicilia n. 15/2000
Norme regionali animali di affezione
Anagrafe canina, sterilizzazione, rifugi
D.Lgs. 193/2006
Identificazione e registrazione animali
Microchippatura e registrazione obbligatoria
L.R. Sicilia n. 3/2013
Aggiornamento normativa regionale
Piano randagismo, reportistica annuale Regione
D.Lgs. 82/2005 (CAD)
Codice Amministrazione Digitale
Preferenza per soluzioni digitali nei servizi pubblici
Legge 4/2004 (Legge Stanca)
Accessibilità PA
Conformità WCAG 2.1 AA obbligatoria
Reg. UE 2016/679 (GDPR)
Protezione dati personali
DPA, consenso esplicito, data residency UE obbligatori


2. Il Contesto Specifico del Territorio Narese


Le criticità operative nella gestione tradizionale del randagismo si manifestano con particolare intensità a Naro, in ragione dell’estensione territoriale e della conformazione geografica:

Criticità
Causa
Conseguenza per l’Ente
Segnalazioni non tracciabili
Canali informali (telefono, passaparola)
Impossibilità di rendicontare gli interventi verso ASP AG e Regione
Territorio vasto e disperso
207 km² con contrade rurali e 11 comuni confinanti
Interventi lenti, rischio di sovrapposizioni tra enti
Assenza di anagrafe digitale
Nessun archivio strutturato microchip/proprietari
Animali smarriti non identificabili, maltrattamenti non tracciabili
Strutture non monitorate
Capienza Canile Dogland non aggiornata in tempo reale
Rischio sovraffollamento senza preavviso
Reportistica manuale
Elaborazione dati a mano
Difficoltà nel rendiconto annuale obbligatorio alla Regione Siciliana


3. I Moduli della Piattaforma


AnimalHub PA si articola in due rami distinti: uno rivolto ai cittadini, accessibile pubblicamente, e uno riservato agli operatori dell’Ente, protetto da autenticazione.

Ramo Cittadini — Strumenti Pubblici

Modulo A — Wizard Segnalazioni Multi-Step
Un percorso guidato, ottimizzato per smartphone, che accompagna il cittadino in ogni fase della segnalazione:
Step 1 — Posizione: GPS automatico o ricerca manuale su mappa Leaflet/OpenStreetMap
Step 2 — Animale: specie, condizioni mediche e comportamentali, caratteristiche visive
Step 3 — Contatto: dati personali facoltativi per ricontatto, con consenso GDPR esplicito
Step 4 — Documentazione: scatto e caricamento foto direttamente dallo smartphone
Conferma: codice di tracking univoco generato automaticamente, notifiche email sullo stato

Modulo — Mappa Pubblica del Territorio
Visualizzazione in tempo reale delle segnalazioni attive sul territorio comunale
Aggiornamento istantaneo tramite Firebase Firestore — nessun ricaricamento pagina
Clusterizzazione automatica dei marker in aree ad alta densità di segnalazioni
Funzione anti-duplicato: il cittadino vede se un animale è già stato segnalato nelle vicinanze

Modulo — La Mia Area (Cruscotto Cittadino)
Accesso tramite codice OTP inviato via email — nessuna password da ricordare
Visualizzazione dello stato di avanzamento di ogni propria segnalazione
Integrazione Google Drive Cloud: Archiviazione rapida delle ricevute di segnalazione e degli attestati di iscrizione in formato PDF direttamente nella cartella dell'utente ("AnimalHub Naro") su Google Drive. Caricamento file assistito tramite Drag-and-Drop o selettore manuale.
Timeline interattiva degli interventi effettuati dagli operatori sulla pratica con notifiche automatiche.

Ramo Operatori — Area Riservata
Accessibile esclusivamente al personale autorizzato dell’Ente: operatori comunali, Polizia Locale, ASL Veterinaria, volontari accreditati.

Modulo B — Cruscotto Operativo (Ticketing)
Accesso in tempo reale a tutte le segnalazioni (Firestore listener + MySQL per dettagli)
Flusso di assegnazione: ente di competenza (Polizia, Canile, Veterinario, Volontari)
Tabellone stati: Aperta → In Lavorazione → Chiusa / Falso Allarme
Audit Trail completo: ogni azione registrata con operatore, timestamp, stato prima e dopo
Export CSV/PDF per rendicontazione verso ASP e Regione

Modulo C — Archivio Anagrafico Digitale
Gestione anagrafe canina e felina con ricerca rapida per microchip
Scheda animale: specie, sesso, taglia, colore, note mediche, stato sanitario, foto
Gestione proprietari: anagrafica, contatti, storico registrazioni chip
Collegamento diretto tra scheda animale e segnalazioni correlate sul territorio
Esportazione dati per Anagrafe Canina Regionale (formato compatibile)

Modulo D — Registro Strutture Convenzionate
Censimento canili, gattili, cliniche veterinarie e rifugi convenzionati con il Comune
Monitoraggio capienza massima e posti occupati aggiornato in tempo reale
Alert automatico quando una struttura si avvicina alla capienza massima
Contatti diretti per coordinamento immediato degli interventi sul campo

Modulo — Configurazione Ente (White-Label & CMS di Conformità)
L’amministratore dell’Ente personalizza nome, logo istituzionale del Comune e stemma del brand AnimalHub in totale autonomia, senza alcun intervento tecnico.
Consente la gestione dinamica dei testi legali e delle informative del portale (Informativa Privacy GDPR e Cookie Policy) direttamente dal pannello di controllo, con aggiornamenti in tempo reale.
Possibilità di inserire note o descrizioni personalizzate visualizzate nel footer del sito.
Pannello di configurazione protetto da credenziali solide custodite nel database centrale.
Tutte le notifiche e i moduli applicativi ereditano automaticamente questi dettagli per garantire un'esperienza istituzionale coerente.


4. Architettura Tecnologica


AnimalHub PA adotta un’architettura Full-Stack moderna, sicura e scalabile, suddivisa in strati applicativi ben definiti. Il sistema è progettato per garantire alte prestazioni, manutenibilità nel tempo e piena indipendenza infrastrutturale.

4.1 — Frontend (Interfaccia Utente)
L’interfaccia utente è progettata con approccio Mobile First: pensata prima di tutto per i cittadini che segnalano direttamente dalla strada con lo smartphone, poi ottimizzata per PC e tablet degli operatori comunali.

Componente
Tecnologia
Funzione
Framework UI
React 18 + TypeScript
Interfacce dinamiche, sicure, senza errori a runtime
Build Tool
Vite
Tempi di caricamento istantanei, bundle ottimizzato
Styling
Tailwind CSS
Design responsive, Mobile First, WCAG-compliant
Mappe e GIS
Leaflet + OpenStreetMap
Segnalazioni geolocalizzate, clustering marker, 100% gratuito
Iconografia
Lucide React
Veste grafica istituzionale, pulita e minimale
Animazioni UI
Motion (Framer Motion)
Feedback visivo elegante, navigazione fluida tra i moduli


4.2 — Backend (Logica di Servizio e API)
Il backend gestisce tutta la logica applicativa, mantiene nascoste le credenziali di accesso al database e implementa le validazioni di sicurezza. Funge anche da middleware real-time per l’aggiornamento automatico delle dashboard operative.

Componente
Tecnologia
Funzione
Runtime
Node.js
Esecuzione server-side ad alte prestazioni
Web Server
Express
API REST robuste, routing e middleware di sicurezza
DB Driver
mysql2/promise
Connessione asincrona e sicura a MySQL
Real-Time
Firebase Admin SDK
Sincronizzazione push verso Firestore per mappa e dashboard
Email OTP
Resend
Notifiche ai cittadini su stato segnalazione


4.3 — Database e Persistenza Dati (Architettura Ibrida)
La piattaforma adotta un approccio ibrido e ridondante su tre livelli, che garantisce continuità operativa anche in caso di problemi di connettività:

Livello
Tecnologia
Ruolo
Hosting
1 — Primario
MySQL (mysql2/promise)
Sorgente dati permanente: segnalazioni, utenti, interventi, strutture, anagrafica animali
Aruba — Italia
2 — Fallback
SQLite
Attivato automaticamente se MySQL non è raggiungibile. Garantisce l’uptime del servizio operativo senza interruzioni
Locale / server
3 — Real-Time
Firebase Firestore
Solo dati leggeri e non personali: coordinate, specie, stato, urgenza. Aggiorna mappa e dashboard in tempo reale senza polling
Google EU — Zurigo


Flusso di sincronizzazione: il backend Node.js riceve la richiesta dal cittadino → inserisce il record completo in MySQL → immediatamente dopo, pubblica un documento leggero su Firestore con le sole coordinate e lo stato → la mappa React si aggiorna in tempo reale tramite listener. Il record completo viene recuperato da MySQL solo al click sul marker.

4.4 — Configurazione White-Label (Multi-Comune)
Ogni Comune adotta la piattaforma come soluzione completamente personalizzata. L’amministratore dell’Ente può modificare in autonomia, senza intervento tecnico, i dati identificativi dell’istanza:

Nome dell’Ente: aggiornato dinamicamente su tutta l’interfaccia pubblica e privata
Logo istituzionale: URL configurabile, caricato automaticamente su header e documenti
Queste personalizzazioni sono salvate nella tabella admin_config del database MySQL
Nessun intervento sul codice sorgente richiesto: tutto gestito dall’interfaccia di amministrazione

4.5 — Indipendenza Infrastrutturale
L’architettura Node.js + MySQL è progettata per essere compatibile con qualsiasi tipo di infrastruttura, senza lock-in tecnologico:

Modalità di Deploy
Descrizione
Adatta a
Cloud Europeo
Google Cloud Run, AWS eu-south-1, Azure EU
Comuni con contratti cloud PA esistenti
Server Aruba Italia
VPS o server dedicato Aruba
Comuni che preferiscono hosting italiano certificato
On-Premise
Server fisico o VM del Comune stesso
Comuni con data center proprio o consorzio informatico
Hosting condiviso
Soluzione gestita dal fornitore
Comuni senza personale IT interno



5. Conformità Normativa e Requisiti AgID


AnimalHub PA rispetta integralmente i requisiti obbligatori per l’acquisizione da parte di un Ente Locale italiano, secondo le Linee Guida AgID e il Codice dell’Amministrazione Digitale.

5.1 — Accessibilità ed Inclusione Digitale (Legge Stanca / WCAG 2.1 AA)
Conforme alle specifiche tecniche WCAG 2.1 livello AA, ai sensi della Legge 4/2004 e del D.Lgs. 106/2018. La piattaforma integra una Suite di Accessibilità Avanzata (Accessibility Panel) permanente per garantire che nessun cittadino venga escluso:

- **Sintesi Vocale Attiva (Screen Reader Integrato)**: Consente l'ascolto vocale immediato dei testi e del contenuto delle pagine, ideale per utenti con ipovisione o difficoltà di lettura.
- **Supporto Dislessia (Font OpenDyslexic)**: Attivazione immediata del carattere tipografico specifico per facilitare la lettura agli utenti con disturbi dello spettro dislessico.
- **Ruler di Lettura (Guida Visiva)**: Una linea di focus orizzontale dinamica che segue il cursore per agevolare la concentrazione riga per riga.
- **Personalizzazione Contrasto & Dimensione del Testo**: Modifiche istantanee del contrasto cromatico (contrasto elevato minimo 4.5:1) e zoom dinamico delle dimensioni dei caratteri.
- **Navigazione Completa da Tastiera**: Spostamento logico e sequenziale tramite tasto Tab, segnalato da focus visivi chiari e dall'uso obbligatorio dei tag semantici e attributi ARIA.
- **Assistente Lettura PDF**: Strumento di rilettura facilitata per i certificati generati.
- **Alternativa Testuale Completa**: Tutti gli elementi visivi strutturati e la mappa cartografica Leaflet integrano descrizioni testuali sostitutive chiare.
- **Punteggio Lighthouse Accessibility**: Prestazioni monitorate costantemente con punteggi fissi ≥ 95/100.

5.2 — Conformità GDPR
Base giuridica: art. 6(1)(e) GDPR — esecuzione di compito di interesse pubblico
Dati personali (email, nome, cognome) esclusivamente in MySQL — mai su Firestore
Firestore contiene solo dati tecnici non personali: coordinate, specie, stato, urgenza
Consenso Privacy GDPR esplicito nel wizard di segnalazione (checkbox non pre-spuntate)
Privacy Policy completa (art. 13 GDPR) e Cookie Policy pubblicate
Cancellazione e modifica dati su richiesta gestibile direttamente dal database MySQL centrale
Data Processing Agreement (art. 28 GDPR) disponibile per firma contestuale al contratto

5.3 — Data Residency
MySQL: server Aruba con data center in Italia — dati personali mai fuori dall’Italia
Firebase Firestore: regione europe-west6 (Zurigo, Svizzera — UE) — solo dati tecnici
Hosting applicativo: Vercel cdg1 (Parigi, Francia — UE) o infrastruttura scelta dall’Ente
Nessun dato personale trasferito al di fuori dello Spazio Economico Europeo

5.4 — Sicurezza Informatica
HTTPS con TLS 1.3 su tutto il traffico — certificato automatico
Password operatori con hashing bcrypt nel database MySQL — nessuna credenziale in chiaro
Audit Trail immutabile: ogni azione su ogni segnalazione è registrata con operatore e timestamp
Security headers HTTP: HSTS, CSP, X-Frame-Options, Permissions-Policy
Credenziali database e chiavi API gestite esclusivamente server-side — mai esposte al frontend
Rate limiting sulle API pubbliche per protezione da abusi e attacchi DoS


6. Vantaggi Strategici per il Comune di Naro


Beneficio
Descrizione
Impatto Atteso
Digitalizzazione del servizio al cittadino
Eliminazione code al centralino, tutto centralizzato in un codice di tracking
Nessuna segnalazione persa, risposta tracciabile
Dati in Italia
MySQL su Aruba — data center italiano, massima conformità GDPR
Nessuna obiezione del DPO o del Consiglio Comunale
Mappa real-time
Pin aggiornati istantaneamente via Firebase senza polling
Operatori sempre aggiornati, zero refresh manuali
Ottimizzazione risorse
Interventi mirati e tracciati, nessuna sovrapposizione tra enti
Riduzione stimata 40% dei tempi di risposta
Anagrafe digitale completa
Microchip, proprietari, note mediche, storico interventi
Identificazione rapida animali smarriti o maltrattati
Strutture integrate
Capienza canili e gattili in tempo reale con alert automatici
Coordinamento immediato, zero telefonate di verifica
Indipendenza infrastrutturale
Compatibile con cloud, Aruba, on-premise, server comunale
Nessun lock-in, l’Ente sceglie dove ospitare i dati
Acquistabile dalla PA
Conforme AgID, GDPR, CAD, Legge Stanca, WCAG 2.1 AA
Affidamento diretto ex art. 50 D.Lgs. 36/2023


7. Piano di Avvio per il Comune di Naro


Fase
Attività
Durata
Fase 1 — Setup
Configurazione MySQL Aruba, Firebase EU, personalizzazione white-label con stemma di Naro, geofence 8 km dal centro, inserimento strutture (Canile Dogland, gattile convenzionato, cliniche), creazione account operatori
1–2 settimane
Fase 2 — Formazione
Sessione per ufficio tecnico, Polizia Municipale e personale veterinario ASP AG. Consegna manuale utente e guida all’uso del pannello di configurazione white-label
1 giorno
Fase 3 — Pilota
Go-live con supporto dedicato, comunicazione ai cittadini naresi, raccolta feedback, ottimizzazioni geofence e strutture
1 mese
Fase 4 — Ordinario
Operatività autonoma: helpdesk tecnico, aggiornamenti software, backup MySQL giornaliero automatico, reportistica periodica verso ASP e Regione inclusi
Continuativa


8. Scalabilità Provinciale


AnimalHub PA è progettata come piattaforma multi-comune. Grazie all’architettura white-label, il Comune di Naro può candidarsi come Comune capofila per l’adozione coordinata degli undici comuni confinanti, ciascuno con la propria istanza personalizzata e database MySQL separato.

Modello
Struttura
Vantaggio
Singolo Comune
Database MySQL dedicato + Firebase isolato
Autonomia completa, avvio in 2 settimane
Accordo bilaterale
DB separati, dashboard condivisa
Coordinamento per animali che attraversano i confini
Convenzione art. 30 TUEL
Naro capofila + comuni aderenti
Sconto 20% sul canone per tutti i partecipanti
Libero Consorzio AG
Gestione unificata a livello provinciale
Reportistica aggregata, massime economie di scala


9. Condizioni Economiche


Il Comune di Naro rientra nella fascia demografica 5.001–15.000 abitanti. Il canone annuale è onnicomprensivo: costo di avviamento 4.000 iva esclusa, nessuna licenza aggiuntiva, nessun costo di formazione.

Voce
Importo (IVA escl.)
Incluso
Canone annuo — fascia 5.001–15.000 ab.
Da definire in offerta
Tutti i moduli A/B/C/D + manutenzione + supporto
Database MySQL Aruba Italia
Incluso nel canone
Hosting Italia, backup automatico giornaliero
Firebase Firestore EU
Incluso nel canone
Real-time mappa e dashboard, regione Zurigo EU
Configurazione white-label
Inclusa nel canone
Stemma, logo, geofence Naro, strutture convenzionate
Formazione del personale
Inclusa nel canone
In presenza a Naro o telematica
Data Processing Agreement art. 28 GDPR
Incluso
Pronto per la firma contestuale
Dichiarazione di Accessibilità AgID
Inclusa
Pagina standard pubblicata


Acquisizione tramite affidamento diretto ai sensi dell’art. 50, comma 1, lett. a) del D.Lgs. 36/2023. Su richiesta: schema Determina a Contrarre, bozza Contratto di Servizio, DPA art. 28 GDPR.

10. Prossimi Passi


Si chiede all’Amministrazione di autorizzare un incontro tecnico-istituzionale per:

Dimostrazione live della piattaforma AnimalHub PA
Verifica conformità tecnica con il Responsabile IT e il DPO comunale
Definizione condizioni contrattuali e predisposizione atti amministrativi
Pianificazione avvio operativo nel più breve tempo possibile

In attesa di un cortese riscontro, si porgono distinti saluti istituzionali.

Il Proponente
Franco Tesè - Framatek di Franco Tesè
Via Sabella 11 - 92028 Naro (AG) - Tel. 3924141215 - franco.tese@pec.it - partita iva 02824000844

Riservatezza e note legali
Documento riservato destinato esclusivamente al Comune di Naro. Vietata la riproduzione a terzi. Dati personali trattati ai sensi del Reg. UE 2016/679 (GDPR). Costi indicativi e soggetti a contrattazione.

